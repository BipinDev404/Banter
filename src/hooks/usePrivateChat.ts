import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ChatMessage, ChatAttachment, PrivateChatRequest, PrivateChatRoom } from '../types';
import { TWO_HOURS_MS } from './useMessages';

interface UsePrivateChatProps {
  sessionId: string;
  userName: string;
  avatarId?: string;
  enabled: boolean;
}

export function usePrivateChat({ sessionId, userName, avatarId, enabled }: UsePrivateChatProps) {
  const [incomingRequest, setIncomingRequest] = useState<PrivateChatRequest | null>(null);
  const [sentRequestStatus, setSentRequestStatus] = useState<{
    id: string;
    toUserName: string;
    status: 'pending' | 'accepted' | 'declined';
  } | null>(null);

  const [activePrivateChat, setActivePrivateChat] = useState<PrivateChatRoom | null>(null);
  const [privateMessages, setPrivateMessages] = useState<ChatMessage[]>([]);
  const [loadingPrivate, setLoadingPrivate] = useState<boolean>(false);
  const [privateError, setPrivateError] = useState<string | null>(null);

  // Helper to generate deterministic private room ID from two session IDs
  const getRoomId = (idA: string, idB: string) => {
    return [idA, idB].sort().join('_room_');
  };

  // 1. Listen for INCOMING private chat requests for me
  useEffect(() => {
    if (!enabled || !sessionId) return;

    const requestsCol = collection(db, 'private_requests');
    const q = query(
      requestsCol,
      where('toSessionId', '==', sessionId),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let latestReq: PrivateChatRequest | null = null;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          latestReq = {
            id: docSnap.id,
            fromSessionId: data.fromSessionId,
            fromUserName: data.fromUserName,
            toSessionId: data.toSessionId,
            toUserName: data.toUserName,
            status: data.status,
            roomId: data.roomId,
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
          };
        });
        setIncomingRequest(latestReq);
      },
      (err) => {
        console.error('Incoming private requests error:', err);
      }
    );

    return () => unsubscribe();
  }, [enabled, sessionId]);

  // 2. Listen for SENT private chat requests status
  useEffect(() => {
    if (!enabled || !sessionId || !sentRequestStatus) return;

    const reqDocRef = doc(db, 'private_requests', sentRequestStatus.id);
    const unsubscribe = onSnapshot(
      reqDocRef,
      (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();
        if (data.status === 'accepted') {
          setActivePrivateChat({
            roomId: data.roomId,
            partnerSessionId: data.toSessionId,
            partnerName: data.toUserName,
          });
          setSentRequestStatus(null);
        } else if (data.status === 'declined') {
          setPrivateError(`${data.toUserName} declined the private chat request.`);
          setTimeout(() => setSentRequestStatus(null), 3000);
        }
      },
      (err) => {
        console.error('Sent private request status error:', err);
      }
    );

    return () => unsubscribe();
  }, [enabled, sessionId, sentRequestStatus]);

  // 3. Send Private Chat Request to another user
  const requestPrivateChat = useCallback(
    async (targetSessionId: string, targetUserName: string): Promise<boolean> => {
      if (!targetSessionId || targetSessionId === sessionId) return false;

      const roomId = getRoomId(sessionId, targetSessionId);
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      try {
        setPrivateError(null);
        const reqRef = doc(db, 'private_requests', requestId);
        await setDoc(reqRef, {
          fromSessionId: sessionId,
          fromUserName: userName,
          toSessionId: targetSessionId,
          toUserName: targetUserName,
          status: 'pending',
          roomId,
          createdAt: serverTimestamp(),
        });

        setSentRequestStatus({
          id: requestId,
          toUserName: targetUserName,
          status: 'pending',
        });
        return true;
      } catch (err) {
        console.error('Failed to send private chat request:', err);
        setPrivateError('Could not send chat request.');
        return false;
      }
    },
    [sessionId, userName]
  );

  // 4. Accept Incoming Private Chat Request
  const acceptPrivateChat = useCallback(
    async (req: PrivateChatRequest) => {
      try {
        const reqRef = doc(db, 'private_requests', req.id);
        await setDoc(reqRef, { status: 'accepted' }, { merge: true });

        setActivePrivateChat({
          roomId: req.roomId,
          partnerSessionId: req.fromSessionId,
          partnerName: req.fromUserName,
        });
        setIncomingRequest(null);
      } catch (err) {
        console.error('Failed to accept request:', err);
      }
    },
    []
  );

  // 5. Decline Incoming Private Chat Request
  const declinePrivateChat = useCallback(
    async (req: PrivateChatRequest) => {
      try {
        const reqRef = doc(db, 'private_requests', req.id);
        await setDoc(reqRef, { status: 'declined' }, { merge: true });
        setIncomingRequest(null);
      } catch (err) {
        console.error('Failed to decline request:', err);
      }
    },
    []
  );

  // 6. Leave active private chat room
  const leavePrivateChat = useCallback(() => {
    setActivePrivateChat(null);
    setPrivateMessages([]);
  }, []);

  // 6b. Open direct chat without confirmation request (e.g. for existing confirmed friends)
  const openDirectChat = useCallback(
    (partnerSessionId: string, partnerName: string, partnerAvatarId?: string) => {
      const roomId = getRoomId(sessionId, partnerSessionId);
      setActivePrivateChat({
        roomId,
        partnerSessionId,
        partnerName,
        partnerAvatarId,
      });
      setSentRequestStatus(null);
      setIncomingRequest(null);
    },
    [sessionId]
  );

  // 7. Listen for messages in active private room with 2-hour auto cleanup
  useEffect(() => {
    if (!activePrivateChat) {
      setPrivateMessages([]);
      return;
    }

    setLoadingPrivate(true);
    const messagesCol = collection(db, 'private_messages');
    const q = query(
      messagesCol,
      where('roomId', '==', activePrivateChat.roomId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const now = Date.now();
        const cutoff = now - TWO_HOURS_MS;
        const loaded: ChatMessage[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const timestamp = data.createdAt?.toMillis ? data.createdAt.toMillis() : now;

          if (timestamp < cutoff) {
            deleteDoc(docSnap.ref).catch(() => {});
            return;
          }

          loaded.push({
            id: docSnap.id,
            userId: data.userId || 'anon',
            userName: data.userName || 'Anonymous',
            message: data.message || '',
            createdAt: timestamp,
            attachment: data.attachment || undefined,
            reactions: Array.isArray(data.reactions) ? data.reactions : [],
            replyTo: data.replyTo || undefined,
            avatarId: data.avatarId || undefined,
          });
        });

        loaded.reverse();
        setPrivateMessages(loaded);
        setLoadingPrivate(false);
      },
      (err) => {
        console.error('Private messages error:', err);
        setLoadingPrivate(false);
      }
    );

    return () => unsubscribe();
  }, [activePrivateChat]);

  // 8. Send message in active private room
  const sendPrivateMessage = useCallback(
    async (
      text: string,
      attachment?: ChatAttachment,
      replyTo?: { userName: string; snippet: string }
    ): Promise<boolean> => {
      if (!activePrivateChat) return false;

      const trimmed = text.trim();
      if (!trimmed && !attachment) return false;

      const now = Date.now();
      const cleanMsgId = `pmsg_${now}_${Math.random().toString(36).substring(2, 7)}`;

      const optimisticMsg: ChatMessage = {
        id: cleanMsgId,
        userId: sessionId,
        userName,
        message: trimmed,
        attachment,
        replyTo,
        createdAt: now,
        isOptimistic: true,
      };

      setPrivateMessages((prev) => [...prev, optimisticMsg]);

      try {
        const docRef = doc(db, 'private_messages', cleanMsgId);
        const payload: Record<string, any> = {
          roomId: activePrivateChat.roomId,
          userId: sessionId,
          userName: userName.slice(0, 20),
          message: trimmed,
          createdAt: serverTimestamp(),
        };

        if (attachment) payload.attachment = attachment;
        if (avatarId) payload.avatarId = avatarId;
        if (replyTo) {
          payload.replyTo = {
            userName: replyTo.userName,
            snippet: replyTo.snippet.slice(0, 200),
          };
        }

        await setDoc(docRef, payload);
        return true;
      } catch (err) {
        console.error('Error sending private message:', err);
        setPrivateMessages((prev) => prev.filter((m) => m.id !== cleanMsgId));
        return false;
      }
    },
    [activePrivateChat, sessionId, userName, avatarId]
  );

  // 9. Toggle reaction on private message
  const togglePrivateReaction = useCallback((messageId: string, emoji: string) => {
    setPrivateMessages((prev) => {
      const msg = prev.find((m) => m.id === messageId);
      const existing = msg?.reactions || [];
      const updated = existing.includes(emoji)
        ? existing.filter((e) => e !== emoji)
        : [...existing, emoji];

      try {
        setDoc(doc(db, 'private_messages', messageId), { reactions: updated }, { merge: true }).catch(() => {});
      } catch (e) {
        console.error(e);
      }

      return prev.map((m) => (m.id === messageId ? { ...m, reactions: updated } : m));
    });
  }, []);

  return {
    incomingRequest,
    sentRequestStatus,
    activePrivateChat,
    privateMessages,
    loadingPrivate,
    privateError,
    requestPrivateChat,
    acceptPrivateChat,
    declinePrivateChat,
    leavePrivateChat,
    openDirectChat,
    sendPrivateMessage,
    togglePrivateReaction,
    clearPrivateError: () => setPrivateError(null),
  };
}
