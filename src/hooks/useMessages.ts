import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ChatMessage, ChatAttachment } from '../types';
import { ActiveUserReader } from './usePresence';

interface UseMessagesProps {
  userId: string;
  userName: string;
  avatarId?: string;
  enabled: boolean;
  otherUsers?: ActiveUserReader[];
  onViewLoaded?: () => void;
}

// 2 hours automatic message expiration cutoff
export const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export function useMessages({
  userId,
  userName,
  avatarId,
  enabled,
  otherUsers = [],
  onViewLoaded,
}: UseMessagesProps) {
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

  // 1. Periodic cleanup timer: auto-erase messages older than 2 hours in real time
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const cutoff = now - TWO_HOURS_MS;

      setFirestoreMessages((prev) => {
        const expired = prev.filter((m) => m.createdAt < cutoff);
        // Clean up expired docs in Firestore
        expired.forEach((m) => {
          if (!m.isOptimistic) {
            deleteDoc(doc(db, 'messages', m.id)).catch(() => {});
          }
        });

        const active = prev.filter((m) => m.createdAt >= cutoff);
        return active.length === prev.length ? prev : active;
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(cleanupInterval);
  }, []);

  // 2. Listen to live messages from Firestore with 2-hour filter and cleanup
  useEffect(() => {
    if (!enabled) return;

    setLoading(true);
    const messagesCol = collection(db, 'messages');
    const q = query(messagesCol, orderBy('createdAt', 'desc'), limit(messageLimit));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const now = Date.now();
        const cutoff = now - TWO_HOURS_MS;
        const loaded: ChatMessage[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const timestamp = data.createdAt?.toMillis
            ? data.createdAt.toMillis()
            : now;

          // Auto-erase check: If message is older than 2 hours, delete from Firestore
          if (timestamp < cutoff) {
            deleteDoc(docSnap.ref).catch(() => {});
            return;
          }

          loaded.push({
            id: docSnap.id,
            userId: data.userId || 'anon',
            userName: data.userName || 'Anonymous',
            avatarId: data.avatarId || undefined,
            message: data.message || '',
            createdAt: timestamp,
            attachment: data.attachment || undefined,
            reactions: Array.isArray(data.reactions) ? data.reactions : [],
            replyTo: data.replyTo || undefined,
          });
        });

        setHasMore(snapshot.docs.length >= messageLimit);
        // Chronological order: oldest at top, newest at bottom
        loaded.reverse();
        setFirestoreMessages(loaded);
        setLoading(false);
        setErrorMessage(null);
        onViewLoaded?.();
      },
      (error) => {
        setLoading(false);
        console.warn('Messages subscription issue:', error);
        setErrorMessage('Connection issue. Reconnecting...');
        if ((error as any)?.code !== 'unavailable' && !error.message?.includes('offline') && !error.message?.includes('didn\'t respond')) {
          handleFirestoreError(error, OperationType.LIST, 'messages');
        }
      }
    );

    return () => unsubscribe();
  }, [enabled, messageLimit]);

  // Map user reactions and calculate read status based on other users having loaded the view
  const messages = useMemo(() => {
    const now = Date.now();
    const cutoff = now - TWO_HOURS_MS;
    return firestoreMessages
      .filter((msg) => msg.createdAt >= cutoff)
      .map((msg) => {
        // A message is seen/read when at least one other user has loaded the view at or after message creation
        const readers = (otherUsers || []).filter((u) => {
          const readTime = Math.max(u.lastReadAt || 0, u.lastSeen || 0);
          return readTime >= (msg.createdAt - 3000);
        });

        const isRead = readers.length > 0;
        const readBy = readers.map((r) => r.userName);

        return {
          ...msg,
          isRead,
          readBy,
          reactions: reactionsMap[msg.id] || msg.reactions || [],
        };
      });
  }, [firestoreMessages, reactionsMap, otherUsers]);

  // Toggle reaction (Tapback)
  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    setReactionsMap((prev) => {
      const msg = firestoreMessages.find((m) => m.id === messageId);
      const existingReactions = prev[messageId] || msg?.reactions || [];
      const updated = existingReactions.includes(emoji)
        ? existingReactions.filter((e) => e !== emoji)
        : [...existingReactions, emoji];

      const newMap = { ...prev, [messageId]: updated };
      try {
        localStorage.setItem('banter_reactions_map', JSON.stringify(newMap));
      } catch (e) {
        console.error(e);
      }

      // Sync to Firestore doc
      try {
        setDoc(doc(db, 'messages', messageId), { reactions: updated }, { merge: true }).catch(() => {});
      } catch (e) {
        console.error(e);
      }

      return newMap;
    });
  }, [firestoreMessages]);

  // Send message with optional attachment and replyTo
  const sendMessage = useCallback(
    async (
      text: string,
      attachment?: ChatAttachment,
      replyTo?: { userName: string; snippet: string }
    ): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed && !attachment) {
        return false;
      }

      if (trimmed.length > 2000) {
        setErrorMessage('Message too long (max 2000 characters).');
        return false;
      }

      // Rate limit protection
      const now = Date.now();
      if (now - lastSentTimeRef.current < 300) {
        setErrorMessage('Sending too fast! Please slow down.');
        return false;
      }

      const fiveSecsAgo = now - 5000;
      recentSendsRef.current = recentSendsRef.current.filter((t) => t > fiveSecsAgo);
      if (recentSendsRef.current.length >= 8) {
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
        avatarId,
        message: trimmed,
        attachment,
        replyTo,
        createdAt: now,
        isOptimistic: true,
      };

      setFirestoreMessages((prev) => [...prev, optimisticMsg]);

      try {
        const msgDocRef = doc(db, 'messages', cleanMessageId);
        const payload: Record<string, any> = {
          userId,
          userName: userName.slice(0, 20),
          avatarId: avatarId || null,
          message: trimmed,
          createdAt: serverTimestamp(),
        };

        if (attachment) {
          payload.attachment = attachment;
        }

        if (replyTo) {
          payload.replyTo = {
            userName: replyTo.userName,
            snippet: replyTo.snippet.slice(0, 200),
          };
        }

        await setDoc(msgDocRef, payload);
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

  // Edit an existing message
  const editMessage = useCallback(async (messageId: string, newText: string): Promise<boolean> => {
    const trimmed = newText.trim();
    if (!trimmed) return false;

    // Optimistic local update
    setFirestoreMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, message: trimmed } : m))
    );

    try {
      await setDoc(doc(db, 'messages', messageId), { message: trimmed }, { merge: true });
      return true;
    } catch (err) {
      console.error('Error editing message:', err);
      setErrorMessage("Couldn't update message.");
      return false;
    }
  }, []);

  // Delete an existing message
  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    // Optimistic local update
    setFirestoreMessages((prev) => prev.filter((m) => m.id !== messageId));

    try {
      await deleteDoc(doc(db, 'messages', messageId));
      return true;
    } catch (err) {
      console.error('Error deleting message:', err);
      setErrorMessage("Couldn't delete message.");
      return false;
    }
  }, []);

  return {
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    loading,
    hasMore,
    loadMoreMessages,
    isOffline,
    errorMessage,
    clearError: () => setErrorMessage(null),
  };
}
