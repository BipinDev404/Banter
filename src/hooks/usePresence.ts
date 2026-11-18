import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { SystemNotification } from '../types';
import { getAvatarForUser } from '../lib/avatars';
import { OnlineUserItem } from '../components/OnlineUsersModal';

export interface ActiveUserReader {
  sessionId: string;
  userName: string;
  avatarId?: string;
  lastSeen: number;
  lastReadAt: number;
}

interface RawPresenceEntry {
  sessionId: string;
  userName: string;
  avatarId?: string;
  lastSeen: number;
  connectedAt: number;
  lastReadAt: number;
}

interface UsePresenceOptions {
  sessionId: string;
  userName: string;
  avatarId?: string;
  enabled: boolean;
  canMarkGlobalRead?: boolean;
  ghostMode?: boolean;
  friendSessionIds?: string[];
}

const TWO_MINUTES_MS = 2 * 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 15 * 1000; // 15 seconds
const TIMEOUT_THRESHOLD_MS = 45 * 1000; // 45 seconds offline threshold

export function usePresence({
  sessionId,
  userName,
  avatarId,
  enabled,
  canMarkGlobalRead = true,
  ghostMode = false,
  friendSessionIds = [],
}: UsePresenceOptions) {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [rawActiveUsers, setRawActiveUsers] = useState<RawPresenceEntry[]>([]);
  const [ghostSessionIds, setGhostSessionIds] = useState<Set<string>>(new Set());

  // Track visible sessions and their last known state for join/leave notices
  const prevVisibleRef = useRef<Map<string, RawPresenceEntry>>(new Map());
  const isInitialLoadRef = useRef(true);
  const connectedAtRef = useRef<Timestamp | null>(null);
  const canMarkGlobalReadRef = useRef(canMarkGlobalRead);
  canMarkGlobalReadRef.current = canMarkGlobalRead;
  const lastReadMarkAtRef = useRef<number>(0);

  const friendIdSet = useMemo(() => new Set(friendSessionIds), [friendSessionIds]);

  // Helper to add system notification with deduplication
  const addSystemNotice = useCallback((text: string, type: 'join' | 'leave', actorName: string) => {
    const now = Date.now();
    setNotifications((prev) => {
      const isDuplicate = prev.some(
        (n) => n.text === text && now - n.timestamp < 15 * 1000
      );
      if (isDuplicate) return prev;

      const notice: SystemNotification = {
        id: 'sys_' + Math.random().toString(36).substring(2, 9) + now.toString(36),
        type,
        userName: actorName,
        text,
        timestamp: now,
      };

      const active = prev.filter((n) => now - n.timestamp < TWO_MINUTES_MS);
      return [...active, notice].slice(-10);
    });
  }, []);

  // 1. Timer to auto-expire notifications after 2 minutes
  useEffect(() => {
    const expireTimer = setInterval(() => {
      const now = Date.now();
      setNotifications((prev) => {
        const remaining = prev.filter((n) => now - n.timestamp < TWO_MINUTES_MS);
        return remaining.length === prev.length ? prev : remaining;
      });
    }, 1000);

    return () => clearInterval(expireTimer);
  }, []);

  // 2. Function to mark global view as actively viewed / read
  const markViewLoaded = useCallback(async (force = false) => {
    if (!enabled || !userName || !sessionId) return;
    if (!canMarkGlobalReadRef.current) return;
    if (typeof document !== 'undefined' && document.hidden) return;

    const now = Date.now();
    if (!force && now - lastReadMarkAtRef.current < 450) return;
    lastReadMarkAtRef.current = now;

    try {
      const presenceDocRef = doc(db, 'presence', sessionId);
      const data: Record<string, any> = {
        sessionId,
        userName: userName.slice(0, 20),
        lastSeen: serverTimestamp(),
        lastReadAt: serverTimestamp(),
        connectedAt: connectedAtRef.current || serverTimestamp(),
      };
      if (avatarId) data.avatarId = avatarId;
      await setDoc(presenceDocRef, data, { merge: true });
    } catch {
      // non-blocking
    }
  }, [enabled, sessionId, userName, avatarId]);

  // 2b. Sync Ghost Mode status to Firestore `user_status/{sessionId}`
  useEffect(() => {
    if (!enabled || !sessionId) return;
    const statusDocRef = doc(db, 'user_status', sessionId);
    setDoc(
      statusDocRef,
      {
        sessionId,
        ghostMode: Boolean(ghostMode),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch(() => {});
  }, [enabled, sessionId, ghostMode]);

  // 3. Presence registration & heartbeat
  useEffect(() => {
    if (!enabled || !userName || !sessionId) return;

    const presenceDocRef = doc(db, 'presence', sessionId);
    const statusDocRef = doc(db, 'user_status', sessionId);

    const registerPresence = async (isFirstTime = false) => {
      try {
        const payload: Record<string, any> = {
          sessionId,
          userName: userName.slice(0, 20),
          lastSeen: serverTimestamp(),
        };

        // Only stamp lastReadAt on initial boot if user is actually looking at Global chat
        if (
          isFirstTime &&
          canMarkGlobalReadRef.current &&
          (typeof document === 'undefined' || !document.hidden)
        ) {
          payload.lastReadAt = serverTimestamp();
        }

        if (avatarId) {
          payload.avatarId = avatarId;
        }

        if (isFirstTime || !connectedAtRef.current) {
          payload.connectedAt = serverTimestamp();
        } else {
          payload.connectedAt = connectedAtRef.current;
        }

        await setDoc(presenceDocRef, payload, { merge: true });
      } catch (err) {
        console.error('Failed to register presence doc:', err);
      }
    };

    registerPresence(true);

    const heartbeatInterval = setInterval(() => {
      registerPresence(false);
    }, HEARTBEAT_INTERVAL_MS);

    const handleFocus = () => {
      if (typeof document !== 'undefined' && !document.hidden && canMarkGlobalReadRef.current) {
        markViewLoaded(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    const handleLeave = () => {
      try {
        deleteDoc(presenceDocRef);
        deleteDoc(statusDocRef);
      } catch {
        // non-blocking
      }
    };

    window.addEventListener('beforeunload', handleLeave);
    window.addEventListener('pagehide', handleLeave);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('beforeunload', handleLeave);
      window.removeEventListener('pagehide', handleLeave);
      handleLeave();
    };
  }, [sessionId, userName, avatarId, enabled, markViewLoaded]);

  // 4. Listen to Ghost Mode statuses in `user_status`
  useEffect(() => {
    if (!enabled) return;

    const statusCol = collection(db, 'user_status');
    const unsubscribe = onSnapshot(
      statusCol,
      (snapshot) => {
        const nextGhosts = new Set<string>();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data?.ghostMode === true) {
            nextGhosts.add(docSnap.id);
          }
        });
        setGhostSessionIds(nextGhosts);
      },
      (error) => {
        if ((error as any)?.code === 'unavailable' || error.message?.includes('offline')) {
          console.warn('Status listener waiting for network connection...');
        }
      }
    );

    return () => unsubscribe();
  }, [enabled]);

  // 5. Listen to all active presence docs in Firestore
  useEffect(() => {
    if (!enabled) return;

    const presenceCol = collection(db, 'presence');
    const unsubscribe = onSnapshot(
      presenceCol,
      (snapshot) => {
        const now = Date.now();
        const activeList: RawPresenceEntry[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const lastSeenTime = data.lastSeen?.toMillis ? data.lastSeen.toMillis() : now;
          const connectedTime = data.connectedAt?.toMillis ? data.connectedAt.toMillis() : now;
          const lastReadTime = data.lastReadAt?.toMillis ? data.lastReadAt.toMillis() : 0;

          if (docSnap.id === sessionId && data.connectedAt) {
            connectedAtRef.current = data.connectedAt;
          }

          if (now - lastSeenTime < TIMEOUT_THRESHOLD_MS) {
            activeList.push({
              sessionId: docSnap.id,
              userName: data.userName || 'Someone',
              avatarId: data.avatarId || undefined,
              lastSeen: lastSeenTime,
              connectedAt: connectedTime,
              lastReadAt: lastReadTime,
            });
          } else if (now - lastSeenTime > 2 * 60 * 1000) {
            deleteDoc(docSnap.ref).catch(() => {});
          }
        });

        setRawActiveUsers(activeList);
      },
      (error) => {
        if ((error as any)?.code === 'unavailable' || error.message?.includes('offline') || error.message?.includes('didn\'t respond')) {
          console.warn('Presence listener waiting for network connection...');
        } else {
          handleFirestoreError(error, OperationType.LIST, 'presence');
        }
      }
    );

    return () => unsubscribe();
  }, [enabled, sessionId]);

  // 6. Filter visible active users respecting Ghost Mode (ghost users are visible ONLY to their friends)
  const { onlineCount, otherUsers, onlineUsers, visibleOtherEntries } = useMemo(() => {
    const visibleOthers: RawPresenceEntry[] = [];
    const readers: ActiveUserReader[] = [];

    rawActiveUsers.forEach((entry) => {
      if (entry.sessionId === sessionId) return;
      const isGhost = ghostSessionIds.has(entry.sessionId);
      const isFriendUser = friendIdSet.has(entry.sessionId);

      // Hide ghosted users from everyone except their confirmed friends
      if (isGhost && !isFriendUser) return;

      visibleOthers.push(entry);
      readers.push({
        sessionId: entry.sessionId,
        userName: entry.userName,
        avatarId: entry.avatarId,
        lastSeen: entry.lastSeen,
        lastReadAt: entry.lastReadAt,
      });
    });

    const userList: OnlineUserItem[] = [
      {
        sessionId,
        userName: userName || 'You',
        isSelf: true,
        avatar: getAvatarForUser(sessionId, userName, avatarId),
      },
      ...visibleOthers.map((u) => ({
        sessionId: u.sessionId,
        userName: u.userName,
        isSelf: false,
        avatar: getAvatarForUser(u.sessionId, u.userName, u.avatarId),
      })),
    ];

    return {
      onlineCount: 1 + visibleOthers.length,
      otherUsers: readers,
      onlineUsers: userList,
      visibleOtherEntries: visibleOthers,
    };
  }, [rawActiveUsers, ghostSessionIds, friendIdSet, sessionId, userName, avatarId]);

  // 7. Emit join/leave notices only for users visible to us (respecting Ghost Mode)
  useEffect(() => {
    if (!enabled) return;
    const now = Date.now();
    const currentVisibleMap = new Map<string, RawPresenceEntry>();
    visibleOtherEntries.forEach((u) => currentVisibleMap.set(u.sessionId, u));

    const prev = prevVisibleRef.current;

    if (isInitialLoadRef.current) {
      if (rawActiveUsers.length > 0) {
        isInitialLoadRef.current = false;
        currentVisibleMap.forEach((user) => {
          if (user.connectedAt && now - user.connectedAt < 5000) {
            addSystemNotice(`${user.userName} joined Banter`, 'join', user.userName);
          }
        });
        prevVisibleRef.current = currentVisibleMap;
      }
      return;
    }

    currentVisibleMap.forEach((user, sId) => {
      if (!prev.has(sId)) {
        addSystemNotice(`${user.userName} joined Banter`, 'join', user.userName);
      }
    });

    prev.forEach((user, sId) => {
      if (!currentVisibleMap.has(sId)) {
        addSystemNotice(`${user.userName} left Banter`, 'leave', user.userName);
      }
    });

    prevVisibleRef.current = currentVisibleMap;
  }, [enabled, visibleOtherEntries, rawActiveUsers.length, addSystemNotice]);

  return { onlineCount, notifications, otherUsers, onlineUsers, markViewLoaded };
}
