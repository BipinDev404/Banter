import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ChatMessage, ChatAttachment, GroupItem, GroupMemberInfo } from '../types';
import { TWO_HOURS_MS } from './useMessages';

interface UseGroupsProps {
  sessionId: string;
  userName: string;
  avatarId?: string;
  enabled: boolean;
}

export function useGroups({ sessionId, userName, avatarId, enabled }: UseGroupsProps) {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [activeGroup, setActiveGroup] = useState<GroupItem | null>(null);
  const [groupMessages, setGroupMessages] = useState<ChatMessage[]>([]);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(false);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [groupNotice, setGroupNotice] = useState<string | null>(null);

  // 1. Listen for all groups that the current user is a member of
  useEffect(() => {
    if (!enabled || !sessionId) {
      setGroups([]);
      return;
    }

    setLoadingGroups(true);
    const groupsCol = collection(db, 'groups');
    const q = query(groupsCol, where('members', 'array-contains', sessionId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: GroupItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.name || 'Group',
            avatarId: data.avatarId || undefined,
            createdBy: data.createdBy || '',
            creatorName: data.creatorName || 'Member',
            members: Array.isArray(data.members) ? data.members : [],
            memberDetails: data.memberDetails || {},
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
            lastMessage: data.lastMessage || undefined,
            lastMessageAt: data.lastMessageAt?.toMillis ? data.lastMessageAt.toMillis() : undefined,
          });
        });

        // Sort groups by recent activity or creation
        list.sort((a, b) => (b.lastMessageAt || b.createdAt) - (a.lastMessageAt || a.createdAt));
        setGroups(list);
        setLoadingGroups(false);

        // Keep activeGroup reference in sync
        setActiveGroup((curr) => {
          if (!curr) return null;
          const found = list.find((g) => g.id === curr.id);
          return found || null;
        });
      },
      (err) => {
        console.error('Groups listener error:', err);
        setLoadingGroups(false);
      }
    );

    return () => unsubscribe();
  }, [enabled, sessionId]);

  // 2. Create a new group
  const createGroup = useCallback(
    async (
      name: string,
      memberIds: string[],
      memberList: { sessionId: string; userName: string; avatarId?: string }[],
      groupAvatarId?: string
    ): Promise<{ success: boolean; group?: GroupItem; message?: string }> => {
      const cleanName = name.trim();
      if (!cleanName) {
        return { success: false, message: 'Please provide a group name.' };
      }

      const allMemberIds = Array.from(new Set([sessionId, ...memberIds]));
      if (allMemberIds.length < 2) {
        return { success: false, message: 'Select at least one friend to start a group.' };
      }

      const groupId = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const memberDetails: Record<string, GroupMemberInfo> = {
        [sessionId]: {
          sessionId,
          userName,
          avatarId: avatarId || undefined,
        },
      };

      memberList.forEach((m) => {
        memberDetails[m.sessionId] = {
          sessionId: m.sessionId,
          userName: m.userName,
          avatarId: m.avatarId || undefined,
        };
      });

      try {
        const groupDocRef = doc(db, 'groups', groupId);
        const newGroupData = {
          id: groupId,
          name: cleanName,
          avatarId: groupAvatarId || 'g_squad',
          createdBy: sessionId,
          creatorName: userName,
          members: allMemberIds,
          memberDetails,
          createdAt: serverTimestamp(),
          lastMessage: `Group created by ${userName}`,
          lastMessageAt: serverTimestamp(),
        };

        await setDoc(groupDocRef, newGroupData);

        const createdGroup: GroupItem = {
          id: groupId,
          name: cleanName,
          avatarId: groupAvatarId || 'g_squad',
          createdBy: sessionId,
          creatorName: userName,
          members: allMemberIds,
          memberDetails,
          createdAt: Date.now(),
        };

        setGroupNotice(`Group "${cleanName}" created!`);
        setTimeout(() => setGroupNotice(null), 3000);

        return { success: true, group: createdGroup };
      } catch (err) {
        console.error('Create group error:', err);
        return { success: false, message: 'Failed to create group. Please check your connection.' };
      }
    },
    [sessionId, userName, avatarId]
  );

  // 3. Leave group
  const leaveGroup = useCallback(
    async (groupId: string) => {
      try {
        const groupRef = doc(db, 'groups', groupId);
        const group = groups.find((g) => g.id === groupId);

        if (!group) return;

        // If only 1 member left, delete the group entirely
        if (group.members.length <= 1) {
          await deleteDoc(groupRef);
        } else {
          await updateDoc(groupRef, {
            members: arrayRemove(sessionId),
            [`memberDetails.${sessionId}`]: deleteDoc as any,
          }).catch(async () => {
            const updatedMembers = group.members.filter((m) => m !== sessionId);
            const updatedDetails = { ...group.memberDetails };
            delete updatedDetails[sessionId];
            await setDoc(
              groupRef,
              { members: updatedMembers, memberDetails: updatedDetails },
              { merge: true }
            );
          });
        }

        if (activeGroup?.id === groupId) {
          setActiveGroup(null);
          setGroupMessages([]);
        }

        setGroupNotice(`Left group "${group.name}".`);
        setTimeout(() => setGroupNotice(null), 2500);
      } catch (err) {
        console.error('Leave group error:', err);
      }
    },
    [sessionId, groups, activeGroup]
  );

  // 4. Open group conversation
  const openGroupChat = useCallback((group: GroupItem) => {
    setActiveGroup(group);
  }, []);

  // 5. Exit active group chat
  const leaveGroupChat = useCallback(() => {
    setActiveGroup(null);
    setGroupMessages([]);
  }, []);

  // 6. Listen for messages in active group chat with 2-hour auto cleanup
  useEffect(() => {
    if (!activeGroup) {
      setGroupMessages([]);
      return;
    }

    setLoadingMessages(true);
    const messagesCol = collection(db, 'group_messages');
    const q = query(
      messagesCol,
      where('groupId', '==', activeGroup.id),
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
        setGroupMessages(loaded);
        setLoadingMessages(false);
      },
      (err) => {
        console.error('Group messages error:', err);
        setLoadingMessages(false);
      }
    );

    return () => unsubscribe();
  }, [activeGroup]);

  // 7. Send message in active group
  const sendGroupMessage = useCallback(
    async (
      text: string,
      attachment?: ChatAttachment,
      replyTo?: { userName: string; snippet: string }
    ): Promise<boolean> => {
      if (!activeGroup) return false;

      const trimmed = text.trim();
      if (!trimmed && !attachment) return false;

      const now = Date.now();
      const cleanMsgId = `gmsg_${now}_${Math.random().toString(36).substring(2, 7)}`;

      const optimisticMsg: ChatMessage = {
        id: cleanMsgId,
        userId: sessionId,
        userName,
        avatarId,
        message: trimmed,
        attachment,
        replyTo,
        createdAt: now,
        isOptimistic: true,
      };

      setGroupMessages((prev) => [...prev, optimisticMsg]);

      try {
        const docRef = doc(db, 'group_messages', cleanMsgId);
        const payload: Record<string, any> = {
          groupId: activeGroup.id,
          userId: sessionId,
          userName: userName.slice(0, 20),
          avatarId: avatarId || null,
          message: trimmed,
          createdAt: serverTimestamp(),
        };

        if (attachment) payload.attachment = attachment;
        if (replyTo) {
          payload.replyTo = {
            userName: replyTo.userName,
            snippet: replyTo.snippet.slice(0, 200),
          };
        }

        await setDoc(docRef, payload);

        // Update last message on group document
        const snippetText = trimmed || (attachment ? `[${attachment.type}]` : 'Sent a message');
        updateDoc(doc(db, 'groups', activeGroup.id), {
          lastMessage: `${userName}: ${snippetText}`,
          lastMessageAt: serverTimestamp(),
        }).catch(() => {});

        return true;
      } catch (err) {
        console.error('Error sending group message:', err);
        setGroupMessages((prev) => prev.filter((m) => m.id !== cleanMsgId));
        return false;
      }
    },
    [activeGroup, sessionId, userName, avatarId]
  );

  // 8. Toggle reaction on group message
  const toggleGroupReaction = useCallback((messageId: string, emoji: string) => {
    setGroupMessages((prev) => {
      const msg = prev.find((m) => m.id === messageId);
      const existing = msg?.reactions || [];
      const updated = existing.includes(emoji)
        ? existing.filter((e) => e !== emoji)
        : [...existing, emoji];

      try {
        setDoc(doc(db, 'group_messages', messageId), { reactions: updated }, { merge: true }).catch(() => {});
      } catch (e) {
        console.error(e);
      }

      return prev.map((m) => (m.id === messageId ? { ...m, reactions: updated } : m));
    });
  }, []);

  return {
    groups,
    activeGroup,
    groupMessages,
    loadingGroups,
    loadingMessages,
    groupNotice,
    createGroup,
    leaveGroup,
    openGroupChat,
    leaveGroupChat,
    sendGroupMessage,
    toggleGroupReaction,
    clearGroupNotice: () => setGroupNotice(null),
  };
}
