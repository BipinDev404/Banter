import { useState, useEffect, useRef } from 'react';
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

interface UsePresenceOptions {
  sessionId: string;
  userName: string;
  enabled: boolean;
}

const TWO_MINUTES_MS = 2 * 60 * 1000; // 2 minutes auto-disappear for join/leave events
const HEARTBEAT_INTERVAL_MS = 15 * 1000; // 15 seconds
const TIMEOUT_THRESHOLD_MS = 45 * 1000; // 45 seconds offline threshold

export function usePresence({ sessionId, userName, enabled }: UsePresenceOptions) {
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // Track sessions and their last known state
  const prevSessionsRef = useRef<Map<string, { userName: string; lastSeen: number }>>(new Map());
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

      // Keep only notices from the last 2 minutes, max 10
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

  // 2. Presence registration & heartbeat
  useEffect(() => {
    if (!enabled || !userName || !sessionId) return;

    const presenceDocRef = doc(db, 'presence', sessionId);

    const registerPresence = async (isFirstTime = false) => {
      try {
        const payload: Record<string, any> = {
          sessionId,
          userName: userName.slice(0, 20),
          lastSeen: serverTimestamp(),
        };

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

    // Cleanup on window close or reload
    const handleLeave = () => {
      try {
        deleteDoc(presenceDocRef);
      } catch (err) {
        // non-blocking
      }
    };

    window.addEventListener('beforeunload', handleLeave);
    window.addEventListener('pagehide', handleLeave);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleLeave);
      window.removeEventListener('pagehide', handleLeave);
      handleLeave();
    };
  }, [sessionId, userName, enabled]);

  // 3. Listen to all active presence docs in Firestore
  useEffect(() => {
    if (!enabled) return;

    const presenceCol = collection(db, 'presence');
    const unsubscribe = onSnapshot(
      presenceCol,
      (snapshot) => {
        const now = Date.now();
        const currentActive = new Map<string, { userName: string; lastSeen: number; connectedAt?: number }>();

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const lastSeenTime = data.lastSeen?.toMillis ? data.lastSeen.toMillis() : now;
          const connectedTime = data.connectedAt?.toMillis ? data.connectedAt.toMillis() : now;

          if (docSnap.id === sessionId && data.connectedAt) {
            connectedAtRef.current = data.connectedAt;
          }

          // Active if seen within 45 seconds
          if (now - lastSeenTime < TIMEOUT_THRESHOLD_MS) {
            currentActive.set(docSnap.id, {
              userName: data.userName || 'Someone',
              lastSeen: lastSeenTime,
              connectedAt: connectedTime,
            });
          } else if (now - lastSeenTime > 2 * 60 * 1000) {
            // Delete very stale presence documents (> 2 minutes inactive) to keep collection lean
            deleteDoc(docSnap.ref).catch(() => {});
          }
        });

        // Always ensure at least 1 (self) is counted
        const total = Math.max(1, currentActive.size);
        setOnlineCount(total);

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
        handleFirestoreError(error, OperationType.LIST, 'presence');
      }
    );

    return () => unsubscribe();
  }, [enabled, sessionId]);

  return { onlineCount, notifications };
}
