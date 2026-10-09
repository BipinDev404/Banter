import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { TypingUser } from '../types';

interface UseTypingProps {
  sessionId: string;
  userName: string;
  enabled: boolean;
}

export function useTyping({ sessionId, userName, enabled }: UseTypingProps) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentTimeRef = useRef<number>(0);
  const isTypingRef = useRef<boolean>(false);

  // Send typing state to Firestore
  const updateTypingInFirestore = useCallback(
    async (isTyping: boolean) => {
      if (!enabled || !sessionId || !userName) return;

      try {
        const typingDocRef = doc(db, 'typing', sessionId);
        if (isTyping) {
          await setDoc(typingDocRef, {
            sessionId,
            userName: userName.slice(0, 20),
            isTyping: true,
            lastTyped: serverTimestamp(),
          });
          isTypingRef.current = true;
        } else {
          // When stopping, either set isTyping: false or delete doc
          if (isTypingRef.current) {
            await setDoc(typingDocRef, {
              sessionId,
              userName: userName.slice(0, 20),
              isTyping: false,
              lastTyped: serverTimestamp(),
            });
            isTypingRef.current = false;
          }
        }
      } catch (err) {
        console.error('Failed to update typing state:', err);
      }
    },
    [sessionId, userName, enabled]
  );

  // Called whenever user types into input
  const notifyTyping = useCallback(() => {
    if (!enabled || !sessionId) return;

    const now = Date.now();
    // Throttle writes: send to Firestore at most once every 1800ms while continuously typing
    if (now - lastSentTimeRef.current > 1800 || !isTypingRef.current) {
      lastSentTimeRef.current = now;
      updateTypingInFirestore(true);
    }

    // Reset the 2.5-second debounce timer
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      updateTypingInFirestore(false);
    }, 2500);
  }, [enabled, sessionId, updateTypingInFirestore]);

  // Immediately cancel typing (e.g. message was sent)
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    updateTypingInFirestore(false);
  }, [updateTypingInFirestore]);

  // Cleanup on unmount or tab close
  useEffect(() => {
    if (!enabled || !sessionId) return;

    const handleLeave = () => {
      try {
        const typingDocRef = doc(db, 'typing', sessionId);
        deleteDoc(typingDocRef);
      } catch {
        // non-blocking
      }
    };

    window.addEventListener('beforeunload', handleLeave);
    window.addEventListener('pagehide', handleLeave);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      window.removeEventListener('beforeunload', handleLeave);
      window.removeEventListener('pagehide', handleLeave);
      handleLeave();
    };
  }, [sessionId, enabled]);

  // Listen in real-time to other users typing
  useEffect(() => {
    if (!enabled) return;

    const typingCol = collection(db, 'typing');
    const unsubscribe = onSnapshot(
      typingCol,
      (snapshot) => {
        const now = Date.now();
        const activeTypers: TypingUser[] = [];

        snapshot.forEach((docSnap) => {
          // Do not include self
          if (docSnap.id === sessionId) return;

          const data = docSnap.data();
          if (!data.isTyping) return;

          const lastTypedTime = data.lastTyped?.toMillis
            ? data.lastTyped.toMillis()
            : now;

          // Only consider active if typed within the last 4.5 seconds
          if (now - lastTypedTime < 4500) {
            activeTypers.push({
              sessionId: docSnap.id,
              userName: data.userName || 'Someone',
              lastTyped: lastTypedTime,
            });
          }
        });

        setTypingUsers(activeTypers);
      },
      (error) => {
        if ((error as any)?.code === 'unavailable' || error.message?.includes('offline') || error.message?.includes('didn\'t respond')) {
          console.warn('Typing listener waiting for network connection...');
        } else {
          handleFirestoreError(error, OperationType.LIST, 'typing');
        }
      }
    );

    return () => unsubscribe();
  }, [enabled, sessionId]);

  // Periodic ticker to prune typing indicators if a user stopped without explicit write
  useEffect(() => {
    if (typingUsers.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) =>
        prev.filter((u) => Boolean(u && typeof u.userName === 'string' && now - u.lastTyped < 4500))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [typingUsers.length]);

  return {
    typingUsers,
    notifyTyping,
    stopTyping,
  };
}
