import { useState, useEffect, useRef, useCallback } from 'react';
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

interface UsePresenceOptions {
  sessionId: string;
  userName: string;
  avatarId?: string;
  enabled: boolean;
}

const TWO_MINUTES_MS = 2 * 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 15 * 1000; // 15 seconds
const TIMEOUT_THRESHOLD_MS = 45 * 1000; // 45 seconds offline threshold

export function usePresence({ sessionId, userName, avatarId, enabled }: UsePresenceOptions) {
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [otherUsers, setOtherUsers] = useState<ActiveUserReader[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUserItem[]>([]);

  // Track sessions and their last known state
  const prevSessionsRef = useRef<Map<string, { userName: string; avatarId?: string; lastSeen: number }>>(new Map());
  const isInitialLoadRef = useRef(true);
  const connectedAtRef = useRef<Timestamp | null>(null);

  // Helper to add system notification with deduplication
  const addSystemNotice = (text: string, type: 'join' | 'leave', actorName: string) => {
    const now = Date.now();
    setNotifications((prev) => {
      // Prevent duplicate notice of the same type for the same user within 15 seconds
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
  };

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

  // 2. Function to mark view as loaded / read
  const markViewLoaded = useCallback(async () => {
    if (!enabled || !userName || !sessionId) return;
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

  // 3. Presence registration & heartbeat
  useEffect(() => {
    if (!enabled || !userName || !sessionId) return;

    const presenceDocRef = doc(db, 'presence', sessionId);

    const registerPresence = async (isFirstTime = false) => {
      try {
        const payload: Record<string, any> = {
          sessionId,
          userName: userName.slice(0, 20),
          lastSeen: serverTimestamp(),
          lastReadAt: serverTimestamp(),
        };

        if (avatarId) {
          payload.avatarId = avatarId;
        }

        if (isFirstTime || !connectedAtRef.current) {
          payload.connectedAt = serverTimestamp();
        } else {
          payload.connectedAt = connectedAtRef.current;
        }

        await setDoc(presenceDocRef, payload);
      } catch (err) {
        console.error('Failed to register presence doc:', err);
      }
    };

    // Initial registration
    registerPresence(true);

    // Heartbeat every 15 seconds
    const heartbeatInterval = setInterval(() => {
      registerPresence(false);
    }, HEARTBEAT_INTERVAL_MS);

    // Refresh read state on window focus or visibility change
    const handleFocus = () => {
      markViewLoaded();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // Cleanup on window close or reload
    const handleLeave = () => {
      try {
        deleteDoc(presenceDocRef);
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

  // 4. Listen to all active presence docs in Firestore
  useEffect(() => {
    if (!enabled) return;

    const presenceCol = collection(db, 'presence');
    const unsubscribe = onSnapshot(
      presenceCol,
      (snapshot) => {
        const now = Date.now();
        const currentActive = new Map<string, { userName: string; avatarId?: string; lastSeen: number; connectedAt?: number }>();
        const readers: ActiveUserReader[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const lastSeenTime = data.lastSeen?.toMillis ? data.lastSeen.toMillis() : now;
          const connectedTime = data.connectedAt?.toMillis ? data.connectedAt.toMillis() : now;
          const lastReadTime = data.lastReadAt?.toMillis
            ? data.lastReadAt.toMillis()
            : lastSeenTime;

          if (docSnap.id === sessionId && data.connectedAt) {
            connectedAtRef.current = data.connectedAt;
          }

          // Active if seen within 45 seconds
          if (now - lastSeenTime < TIMEOUT_THRESHOLD_MS) {
            currentActive.set(docSnap.id, {
              userName: data.userName || 'Someone',
              avatarId: data.avatarId || undefined,
              lastSeen: lastSeenTime,
              connectedAt: connectedTime,
            });

            // If another user, register their read position
            if (docSnap.id !== sessionId) {
              readers.push({
                sessionId: docSnap.id,
                userName: data.userName || 'Someone',
                avatarId: data.avatarId || undefined,
                lastSeen: lastSeenTime,
                lastReadAt: lastReadTime,
              });
            }
          } else if (now - lastSeenTime > 2 * 60 * 1000) {
            // Delete very stale presence documents (> 2 minutes inactive) to keep collection lean
            deleteDoc(docSnap.ref).catch(() => {});
          }
        });

        // Always ensure at least 1 (self) is counted
        const total = Math.max(1, currentActive.size);
        setOnlineCount(total);
        setOtherUsers(readers);

        // Compile complete list of online users with colorful avatars
        const userList: OnlineUserItem[] = [];
        // Add self
        userList.push({
          sessionId,
          userName: userName || 'You',
          isSelf: true,
          avatar: getAvatarForUser(sessionId, userName, avatarId),
        });

        // Add other active participants
        currentActive.forEach((user, sId) => {
          if (sId !== sessionId) {
            userList.push({
              sessionId: sId,
              userName: user.userName,
              isSelf: false,
              avatar: getAvatarForUser(sId, user.userName, user.avatarId),
            });
          }
        });
        setOnlineUsers(userList);

        const prev = prevSessionsRef.current;

        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
          // Only show join notice on initial load if someone joined in the last 5 seconds
          currentActive.forEach((user, sId) => {
            if (sId !== sessionId && user.connectedAt && now - user.connectedAt < 5000) {
              addSystemNotice(`${user.userName} joined Banter`, 'join', user.userName);
            }
          });
        } else {
          // Detect who joined
          currentActive.forEach((user, sId) => {
            if (!prev.has(sId) && sId !== sessionId) {
              addSystemNotice(`${user.userName} joined Banter`, 'join', user.userName);
            }
          });

          // Detect who left
          prev.forEach((user, sId) => {
            if (!currentActive.has(sId) && sId !== sessionId) {
              addSystemNotice(`${user.userName} left Banter`, 'leave', user.userName);
            }
          });
        }

        prevSessionsRef.current = currentActive;
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

  return { onlineCount, notifications, otherUsers, onlineUsers, markViewLoaded };
}
