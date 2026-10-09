import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { FriendRequest, FriendItem } from '../types';

interface UseFriendsProps {
  sessionId: string;
  userName: string;
  avatarId?: string;
  enabled: boolean;
}

const LOCAL_FRIENDS_PREFIX = 'banter_saved_friends_';

export function useFriends({ sessionId, userName, avatarId, enabled }: UseFriendsProps) {
  // Confirmed friends list
  const [friends, setFriends] = useState<FriendItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(`${LOCAL_FRIENDS_PREFIX}${sessionId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Incoming pending requests
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  // Outgoing sent requests
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Helper to persist friends to localStorage
  const persistFriends = useCallback((items: FriendItem[]) => {
    setFriends(items);
    try {
      localStorage.setItem(`${LOCAL_FRIENDS_PREFIX}${sessionId}`, JSON.stringify(items));
    } catch {}
  }, [sessionId]);

  // 1. Listen for INCOMING friend requests for me
  useEffect(() => {
    if (!enabled || !sessionId) return;

    const reqCol = collection(db, 'friend_requests');
    const q = query(
      reqCol,
      where('toSessionId', '==', sessionId),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: FriendRequest[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            fromSessionId: data.fromSessionId,
            fromUserName: data.fromUserName,
            fromAvatarId: data.fromAvatarId,
            toSessionId: data.toSessionId,
            toUserName: data.toUserName,
            status: data.status,
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
          });
        });
        setIncomingRequests(list);
      },
      (err) => {
        console.error('Incoming friend requests error:', err);
      }
    );

    return () => unsubscribe();
  }, [enabled, sessionId]);

  // 2. Listen for SENT friend requests made by me
  useEffect(() => {
    if (!enabled || !sessionId) return;

    const reqCol = collection(db, 'friend_requests');
    const q = query(
      reqCol,
      where('fromSessionId', '==', sessionId),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: FriendRequest[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            fromSessionId: data.fromSessionId,
            fromUserName: data.fromUserName,
            fromAvatarId: data.fromAvatarId,
            toSessionId: data.toSessionId,
            toUserName: data.toUserName,
            status: data.status,
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
          });
        });
        setSentRequests(list);
      },
      (err) => {
        console.error('Sent friend requests error:', err);
      }
    );

    return () => unsubscribe();
  }, [enabled, sessionId]);

  // 3. Listen for FRIENDSHIPS in Firestore involving me
  useEffect(() => {
    if (!enabled || !sessionId) return;

    const friendshipsCol = collection(db, 'friendships');
    const q = query(
      friendshipsCol,
      where('participants', 'array-contains', sessionId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedFriends: FriendItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // Find the partner participant
          const partnerSessionId = data.participants?.find((p: string) => p !== sessionId);
          if (partnerSessionId) {
            const partnerInfo = data[partnerSessionId] || {};
            loadedFriends.push({
              friendSessionId: partnerSessionId,
              friendName: partnerInfo.userName || partnerInfo.name || 'Friend',
              avatarId: partnerInfo.avatarId,
              statusText: partnerInfo.statusText,
              addedAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
            });
          }
        });

        // Merge with local fallback
        setFriends((prev) => {
          const merged = [...loadedFriends];
          // Keep any locally saved ones not yet deleted
          prev.forEach((p) => {
            if (!merged.some((m) => m.friendSessionId === p.friendSessionId)) {
              merged.push(p);
            }
          });
          try {
            localStorage.setItem(`${LOCAL_FRIENDS_PREFIX}${sessionId}`, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      },
      (err) => {
        console.error('Friendships listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [enabled, sessionId]);

  // 4. Send Friend Request
  const sendFriendRequest = useCallback(
    async (
      targetSessionId: string,
      targetUserName: string,
      targetAvatarId?: string
    ): Promise<{ success: boolean; message: string }> => {
      if (!targetSessionId || targetSessionId === sessionId) {
        return { success: false, message: 'Cannot add yourself as a friend.' };
      }

      // Check if already friends
      if (friends.some((f) => f.friendSessionId === targetSessionId)) {
        return { success: false, message: `${targetUserName} is already in your friends list!` };
      }

      // Check if already sent
      if (sentRequests.some((r) => r.toSessionId === targetSessionId)) {
        return { success: false, message: `Request already sent to ${targetUserName}.` };
      }

      const requestId = `freq_${[sessionId, targetSessionId].sort().join('_')}`;

      try {
        const reqDocRef = doc(db, 'friend_requests', requestId);
        await setDoc(reqDocRef, {
          fromSessionId: sessionId,
          fromUserName: userName,
          fromAvatarId: avatarId || null,
          toSessionId: targetSessionId,
          toUserName: targetUserName,
          status: 'pending',
          createdAt: serverTimestamp(),
        });

        setActionNotice(`Friend request sent to ${targetUserName}!`);
        setTimeout(() => setActionNotice(null), 3000);
        return { success: true, message: `Friend request sent to ${targetUserName}!` };
      } catch (err) {
        console.error('Send friend request error:', err);
        return { success: false, message: 'Could not send friend request. Check connection.' };
      }
    },
    [sessionId, userName, avatarId, friends, sentRequests]
  );

  // 5. Accept Friend Request
  const acceptFriendRequest = useCallback(
    async (req: FriendRequest) => {
      try {
        // Deterministic friendship document ID
        const friendshipId = `fs_${[sessionId, req.fromSessionId].sort().join('_')}`;
        const friendshipRef = doc(db, 'friendships', friendshipId);

        // Store friendship document
        await setDoc(
          friendshipRef,
          {
            friendshipId,
            participants: [sessionId, req.fromSessionId],
            [sessionId]: {
              userName,
              avatarId: avatarId || null,
            },
            [req.fromSessionId]: {
              userName: req.fromUserName,
              avatarId: req.fromAvatarId || null,
            },
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );

        // Remove/delete request doc
        await deleteDoc(doc(db, 'friend_requests', req.id)).catch(() => {});

        // Add to local state immediately
        const newFriend: FriendItem = {
          friendSessionId: req.fromSessionId,
          friendName: req.fromUserName,
          avatarId: req.fromAvatarId,
          addedAt: Date.now(),
        };

        setFriends((prev) => {
          const next = [newFriend, ...prev.filter((f) => f.friendSessionId !== req.fromSessionId)];
          persistFriends(next);
          return next;
        });

        setIncomingRequests((prev) => prev.filter((r) => r.id !== req.id));
        setActionNotice(`You and ${req.fromUserName} are now friends!`);
        setTimeout(() => setActionNotice(null), 3500);
      } catch (err) {
        console.error('Accept friend request error:', err);
      }
    },
    [sessionId, userName, avatarId, persistFriends]
  );

  // 6. Decline Friend Request
  const declineFriendRequest = useCallback(
    async (req: FriendRequest) => {
      try {
        await deleteDoc(doc(db, 'friend_requests', req.id));
        setIncomingRequests((prev) => prev.filter((r) => r.id !== req.id));
        setActionNotice(`Declined request from ${req.fromUserName}.`);
        setTimeout(() => setActionNotice(null), 2500);
      } catch (err) {
        console.error('Decline friend request error:', err);
      }
    },
    []
  );

  // 7. Remove Friend
  const removeFriend = useCallback(
    async (friendSessionId: string) => {
      const friendshipId = `fs_${[sessionId, friendSessionId].sort().join('_')}`;
      try {
        await deleteDoc(doc(db, 'friendships', friendshipId)).catch(() => {});
      } catch (err) {
        console.error('Remove friendship error:', err);
      }

      setFriends((prev) => {
        const next = prev.filter((f) => f.friendSessionId !== friendSessionId);
        persistFriends(next);
        return next;
      });
    },
    [sessionId, persistFriends]
  );

  // 8. Helper check if user is already a friend
  const isFriend = useCallback(
    (checkSessionId: string) => {
      return friends.some((f) => f.friendSessionId === checkSessionId);
    },
    [friends]
  );

  // Helper check if there's a pending request with user
  const hasPendingRequestWith = useCallback(
    (checkSessionId: string) => {
      return (
        sentRequests.some((r) => r.toSessionId === checkSessionId) ||
        incomingRequests.some((r) => r.fromSessionId === checkSessionId)
      );
    },
    [sentRequests, incomingRequests]
  );

  return {
    friends,
    incomingRequests,
    sentRequests,
    pendingCount: incomingRequests.length,
    actionNotice,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    isFriend,
    hasPendingRequestWith,
    clearNotice: () => setActionNotice(null),
  };
}
