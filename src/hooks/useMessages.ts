import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ChatMessage } from '../types';

interface UseMessagesProps {
  userId: string;
  userName: string;
  enabled: boolean;
}

export function useMessages({ userId, userName, enabled }: UseMessagesProps) {
  const [firestoreMessages, setFirestoreMessages] = useState<ChatMessage[]>([]);
  const [messageLimit, setMessageLimit] = useState<number>(50);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Local reactions map (messageId -> string[] of emojis)
  const [reactionsMap, setReactionsMap] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('banter_reactions_map');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {};
  });

  // Rate limiting tracker
  const lastSentTimeRef = useRef<number>(0);
  const recentSendsRef = useRef<number[]>([]);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setErrorMessage(null);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setErrorMessage("You're offline. Reconnecting...");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to live messages from Firestore
  useEffect(() => {
    if (!enabled) return;

    setLoading(true);
    const messagesCol = collection(db, 'messages');
    const q = query(messagesCol, orderBy('createdAt', 'desc'), limit(messageLimit));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const timestamp = data.createdAt?.toMillis
            ? data.createdAt.toMillis()
            : Date.now();

          loaded.push({
            id: docSnap.id,
            userId: data.userId || 'anon',
            userName: data.userName || 'Anonymous',
            message: data.message || '',
            createdAt: timestamp,
          });
        });

        setHasMore(snapshot.docs.length >= messageLimit);
        // Chronological order: oldest at top, newest at bottom
        loaded.reverse();
        setFirestoreMessages(loaded);
        setLoading(false);
        setErrorMessage(null);
      },
      (error) => {
        setLoading(false);
        console.error('Messages subscription error:', error);
        setErrorMessage('Connection issue. Reconnecting...');
        handleFirestoreError(error, OperationType.LIST, 'messages');
      }
    );

    return () => unsubscribe();
  }, [enabled, messageLimit]);

  // Map user reactions to live messages
  const messages = useMemo(() => {
    return firestoreMessages.map((msg) => ({
      ...msg,
      reactions: reactionsMap[msg.id] || msg.reactions || [],
    }));
  }, [firestoreMessages, reactionsMap]);

  // Toggle reaction (Tapback)
  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    setReactionsMap((prev) => {
      const current = prev[messageId] || [];
      const updated = current.includes(emoji)
        ? current.filter((e) => e !== emoji)
        : [...current, emoji];

      const newMap = { ...prev, [messageId]: updated };
      try {
        localStorage.setItem('banter_reactions_map', JSON.stringify(newMap));
      } catch (e) {
        console.error(e);
      }
      return newMap;
    });
  }, []);

  // Send message
  const sendMessage = useCallback(
    async (text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed) {
        return false;
      }

      if (trimmed.length > 500) {
        setErrorMessage('Message too long (max 500 characters).');
        return false;
      }

      // Rate limit protection
      const now = Date.now();
      if (now - lastSentTimeRef.current < 400) {
        setErrorMessage('Sending too fast! Please slow down.');
        return false;
      }

      const fiveSecsAgo = now - 5000;
      recentSendsRef.current = recentSendsRef.current.filter((t) => t > fiveSecsAgo);
      if (recentSendsRef.current.length >= 6) {
        setErrorMessage('Slow down a bit! You are sending messages too quickly.');
        return false;
      }

      lastSentTimeRef.current = now;
      recentSendsRef.current.push(now);
      setErrorMessage(null);

      const cleanMessageId =
        'msg_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);

      // Optimistic update
      const optimisticMsg: ChatMessage = {
        id: cleanMessageId,
        userId,
        userName,
        message: trimmed,
        createdAt: now,
        isOptimistic: true,
      };

      setFirestoreMessages((prev) => [...prev, optimisticMsg]);

      try {
        const msgDocRef = doc(db, 'messages', cleanMessageId);
        await setDoc(msgDocRef, {
          userId,
          userName: userName.slice(0, 20),
          message: trimmed,
          createdAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        console.error('Error sending message:', err);
        setFirestoreMessages((prev) => prev.filter((m) => m.id !== cleanMessageId));
        setErrorMessage("Message couldn't be sent. Try again.");
        return false;
      }
    },
    [userId, userName]
  );

  const loadMoreMessages = useCallback(() => {
    setMessageLimit((prev) => prev + 50);
  }, []);

  return {
    messages,
    sendMessage,
    toggleReaction,
    loading,
    hasMore,
    loadMoreMessages,
    isOffline,
    errorMessage,
    clearError: () => setErrorMessage(null),
  };
}
