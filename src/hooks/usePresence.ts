import { useState, useEffect, useRef } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { SystemNotification } from '../types';

interface UsePresenceOptions {
  sessionId: string;
  userName: string;
  enabled: boolean;
}

export function usePresence({ sessionId, userName, enabled }: UsePresenceOptions) {
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const prevSessionsRef = useRef<Map<string, string>>(new Map());
  const isInitialLoadRef = useRef(true);

  // Helper to add system notification
  const addSystemNotice = (text: string) => {
    const notice: SystemNotification = {
      id: 'sys_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      text,
      timestamp: Date.now(),
    };
    setNotifications((prev) => [...prev.slice(-20), notice]); // keep last 20
  };

  useEffect(() => {
    if (!enabled || !userName || !sessionId) return;

    const presenceDocRef = doc(db, 'presence', sessionId);

    // 1. Register presence
    const registerPresence = async () => {
      try {
        await setDoc(presenceDocRef, {
          sessionId,
          userName: userName.slice(0, 20),
          connectedAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
        });
      } catch (err) {
        console.error('Failed to register presence doc:', err);
      }
    };

    registerPresence();

    // 2. Periodic heartbeat every 18 seconds
    const heartbeatInterval = setInterval(registerPresence, 18000);

    // 3. Unload cleanup
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

  // 4. Listen to all active presence docs
  useEffect(() => {
    if (!enabled) return;

    const presenceCol = collection(db, 'presence');
    const unsubscribe = onSnapshot(
      presenceCol,
      (snapshot) => {
        const now = Date.now();
        // A session is active if lastSeen is within 50 seconds (or null/pending)
        const currentActive = new Map<string, string>();

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const lastSeenTime = data.lastSeen?.toMillis ? data.lastSeen.toMillis() : now;
          // allow within 55s
          if (now - lastSeenTime < 55000) {
            currentActive.set(docSnap.id, data.userName || 'Someone');
          }
        });

        // Always ensure at least 1 (self) is counted if enabled
        const total = Math.max(1, currentActive.size);
        setOnlineCount(total);

        // Track joins and leaves after initial snapshot load
        if (!isInitialLoadRef.current) {
          const prev = prevSessionsRef.current;

          // Joined
          currentActive.forEach((name, sId) => {
            if (!prev.has(sId) && sId !== sessionId) {
              addSystemNotice(`${name} joined Banter`);
            }
          });

          // Left
          prev.forEach((name, sId) => {
            if (!currentActive.has(sId) && sId !== sessionId) {
              addSystemNotice(`${name} left Banter`);
            }
          });
        } else {
          isInitialLoadRef.current = false;
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
