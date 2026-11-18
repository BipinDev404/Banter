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
  arrayUnion,
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
  const [incomingRequests, setIncomingRequests] = useState<PrivateChatRequest[]>([]);
  const [sentRequestStatus, setSentRequestStatus] = useState<{
    id: string;
    toUserName: string;
    status: 'pending' | 'accepted' | 'declined';
  } | null>(null);

  const [activePrivateChat, setActivePrivateChat] = useState<PrivateChatRoom | null>(null);
  const [privateMessages, setPrivateMessages] = useState<ChatMessage[]>([]);
  const [loadingPrivate, setLoadingPrivate] = useState<boolean>(false);
  const [privateError, setPrivateError] = useState<string | null>(null);
  const [latestIncomingPrivateMessage, setLatestIncomingPrivateMessage] = useState<{
    message: ChatMessage;
    partnerSessionId: string;
    partnerName: string;
    partnerAvatarId?: string;
  } | null>(null);

  const initialPrivateLoadRef = useRef(true);
  const markedPrivateReadRef = useRef<Set<string>>(new Set());

  const incomingRequest = incomingRequests[0] || null;
  const incomingGroupInvites = incomingRequests.filter((r) => r.requestType === 'group');

  // Helper to generate deterministic private room ID from two session IDs
  const getRoomId = (idA: string, idB: string) => {
    return [idA, idB].sort().join('_room_');
  };

  // 1. Listen for INCOMING private chat & group invite requests for me
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
        const list: PrivateChatRequest[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            requestType: data.requestType === 'group' ? 'group' : 'chat',
            fromSessionId: data.fromSessionId,
            fromUserName: data.fromUserName,
            fromAvatarId: data.fromAvatarId || undefined,
            toSessionId: data.toSessionId,
            toUserName: data.toUserName,
            status: data.status,
            roomId: data.roomId,
            groupId: data.groupId || undefined,
            groupName: data.groupName || undefined,
            groupAvatarId: data.groupAvatarId || undefined,
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
          });
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        setIncomingRequests(list);
      },
      (err) => {
        console.error('Incoming private requests error:', err);
      }
    );

    return () => unsubscribe();
  }, [enabled, sessionId]);

  // 1b. Listen for INCOMING private messages addressed to current user in real time
  useEffect(() => {
    if (!enabled || !sessionId) return;

    const messagesCol = collection(db, 'private_messages');
    const q = query(
      messagesCol,
      where('targetSessionId', '==', sessionId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (initialPrivateLoadRef.current) {
          initialPrivateLoadRef.current = false;
          return;
        }

        const now = Date.now();
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const timestamp = data.createdAt?.toMillis ? data.createdAt.toMillis() : now;

            // Only notify if message is recent (< 25s) and not from current user
            if (now - timestamp < 25000 && data.userId !== sessionId) {
              const incomingMsg: ChatMessage = {
                id: change.doc.id,
                userId: data.userId || 'anon',
                userName: data.userName || 'Anonymous',
                message: data.message || '',
                createdAt: timestamp,
                attachment: data.attachment || undefined,
                avatarId: data.avatarId || undefined,
                reactions: Array.isArray(data.reactions) ? data.reactions : [],
                replyTo: data.replyTo || undefined,
              };

              setLatestIncomingPrivateMessage({
                message: incomingMsg,
                partnerSessionId: data.userId,
                partnerName: data.userName,
                partnerAvatarId: data.avatarId,
              });
            }
          }
        });
      },
      (err) => {
        console.warn('Background private messages listener issue:', err);
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
          if (data.requestType !== 'group') {
            setActivePrivateChat({
              roomId: data.roomId,
              partnerSessionId: data.toSessionId,
              partnerName: data.toUserName,
            });
          }
          setSentRequestStatus(null);
        } else if (data.status === 'declined') {
          setPrivateError(`${data.toUserName} declined the chat request.`);
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
          requestType: 'chat',
          fromSessionId: sessionId,
          fromUserName: userName,
          fromAvatarId: avatarId || null,
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
    [sessionId, userName, avatarId]
  );

  // 3b. Send Group Invite Confirmation Request to an online user
  const sendGroupInvite = useCallback(
    async (
      targetSessionId: string,
      targetUserName: string,
      group: { id: string; name: string; avatarId?: string }
    ): Promise<boolean> => {
      if (!targetSessionId || targetSessionId === sessionId) return false;

      const requestId = `greq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      try {
        const reqRef = doc(db, 'private_requests', requestId);
        await setDoc(reqRef, {
          requestType: 'group',
          fromSessionId: sessionId,
          fromUserName: userName,
          fromAvatarId: avatarId || null,
          toSessionId: targetSessionId,
          toUserName: targetUserName,
          status: 'pending',
          roomId: group.id,
          groupId: group.id,
          groupName: group.name,
          groupAvatarId: group.avatarId || 'clay_g_squad',
          createdAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        console.error('Failed to send group invite:', err);
        return false;
      }
    },
    [sessionId, userName, avatarId]
  );

  // 4. Accept Incoming Private Chat or Group Invite Request
  const acceptPrivateChat = useCallback(
    async (req: PrivateChatRequest) => {
      try {
        const reqRef = doc(db, 'private_requests', req.id);
        await setDoc(reqRef, { status: 'accepted' }, { merge: true });

        if (req.requestType !== 'group') {
          setActivePrivateChat({
            roomId: req.roomId,
            partnerSessionId: req.fromSessionId,
            partnerName: req.fromUserName,
            partnerAvatarId: req.fromAvatarId,
          });
        }
        setIncomingRequests((prev) => prev.filter((r) => r.id !== req.id));
      } catch (err) {
        console.error('Failed to accept request:', err);
      }
    },
    []
  );

  // 5. Decline Incoming Private Chat or Group Invite Request
  const declinePrivateChat = useCallback(
    async (req: PrivateChatRequest) => {
      try {
        const reqRef = doc(db, 'private_requests', req.id);
        await setDoc(reqRef, { status: 'declined' }, { merge: true });
        setIncomingRequests((prev) => prev.filter((r) => r.id !== req.id));
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
          const hasServerTimestamp = Boolean(data.createdAt?.toMillis);
          const timestamp = hasServerTimestamp ? data.createdAt.toMillis() : now;

          if (timestamp < cutoff) {
            deleteDoc(docSnap.ref).catch(() => {});
            return;
          }

          const readByIds: string[] = Array.isArray(data.readBy) ? data.readBy : [];
          const isRead = Boolean(
            data.isRead || readByIds.some((id: string) => id && id !== data.userId)
          );

          loaded.push({
            id: docSnap.id,
            userId: data.userId || 'anon',
            userName: data.userName || 'Anonymous',
            message: data.message || '',
            createdAt: timestamp,
            isOptimistic: !hasServerTimestamp || docSnap.metadata.hasPendingWrites,
            isRead,
            readByIds,
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

  // 7b. Mark incoming private messages as read ONLY when actively viewing this private chat
  const markVisiblePrivateMessagesRead = useCallback(() => {
    if (!activePrivateChat || !sessionId) return;
    if (typeof document !== 'undefined' && document.hidden) return;

    const unreadIncoming = privateMessages.filter(
      (m) =>
        !m.isOptimistic &&
        m.userId !== sessionId &&
        !m.isRead &&
        !(m.readByIds || []).includes(sessionId) &&
        !markedPrivateReadRef.current.has(m.id)
    );

    if (unreadIncoming.length === 0) return;

    unreadIncoming.forEach((m) => {
      markedPrivateReadRef.current.add(m.id);
      setDoc(
        doc(db, 'private_messages', m.id),
        {
          isRead: true,
          readBy: arrayUnion(sessionId),
          readAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {
        markedPrivateReadRef.current.delete(m.id);
      });
    });
  }, [activePrivateChat, privateMessages, sessionId]);

  useEffect(() => {
    markVisiblePrivateMessagesRead();
  }, [markVisiblePrivateMessagesRead]);

  useEffect(() => {
    if (!activePrivateChat) return;
    const handleFocus = () => {
      markVisiblePrivateMessagesRead();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [activePrivateChat, markVisiblePrivateMessagesRead]);

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
        isRead: false,
        readByIds: [sessionId],
      };

      setPrivateMessages((prev) => [...prev, optimisticMsg]);

      try {
        const docRef = doc(db, 'private_messages', cleanMsgId);
        const payload: Record<string, any> = {
          roomId: activePrivateChat.roomId,
          userId: sessionId,
          userName: userName.slice(0, 20),
          targetSessionId: activePrivateChat.partnerSessionId,
          message: trimmed,
          isRead: false,
          readBy: [sessionId],
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

  // 10. Edit/Rename an existing private message
  const editPrivateMessage = useCallback(async (messageId: string, newText: string): Promise<boolean> => {
    const trimmed = newText.trim();
    if (!trimmed) return false;

    setPrivateMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, message: trimmed } : m))
    );

    try {
      await setDoc(doc(db, 'private_messages', messageId), { message: trimmed }, { merge: true });
      return true;
    } catch (err) {
      console.error('Error editing private message:', err);
      return false;
    }
  }, []);

  // 11. Delete an existing private message
  const deletePrivateMessage = useCallback(async (messageId: string): Promise<boolean> => {
    setPrivateMessages((prev) => prev.filter((m) => m.id !== messageId));

    try {
      await deleteDoc(doc(db, 'private_messages', messageId));
      return true;
    } catch (err) {
      console.error('Error deleting private message:', err);
      return false;
    }
  }, []);

  return {
    incomingRequest,
    incomingRequests,
    incomingGroupInvites,
    sentRequestStatus,
    activePrivateChat,
    privateMessages,
    loadingPrivate,
    privateError,
    requestPrivateChat,
    sendGroupInvite,
    acceptPrivateChat,
    declinePrivateChat,
    leavePrivateChat,
    openDirectChat,
    sendPrivateMessage,
    togglePrivateReaction,
    editPrivateMessage,
    deletePrivateMessage,
    latestIncomingPrivateMessage,
    clearLatestIncomingPrivateMessage: () => setLatestIncomingPrivateMessage(null),
    clearPrivateError: () => setPrivateError(null),
  };
}
