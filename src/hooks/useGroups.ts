import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
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
  onNewMessage?: (msg: ChatMessage, group: GroupItem) => void;
}

export function useGroups({ sessionId, userName, avatarId, enabled, onNewMessage }: UseGroupsProps) {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [activeGroup, setActiveGroup] = useState<GroupItem | null>(null);
  const [groupMessages, setGroupMessages] = useState<ChatMessage[]>([]);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(false);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [groupNotice, setGroupNotice] = useState<string | null>(null);
  const onNewMessageRef = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;
  const groupInitialLoadRef = useRef<Record<string, boolean>>({});
  const markedGroupReadRef = useRef<Set<string>>(new Set());

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
        const now = Date.now();
        const list: GroupItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const createdAt = data.createdAt?.toMillis ? data.createdAt.toMillis() : now;
          const lastMessageAt = data.lastMessageAt?.toMillis ? data.lastMessageAt.toMillis() : undefined;
          const isTemporary = Boolean(data.isTemporary);

          // Auto-expire temporary link groups after 2 hours of inactivity
          if (isTemporary && now - (lastMessageAt || createdAt) > TWO_HOURS_MS) {
            deleteDoc(docSnap.ref).catch(() => {});
            return;
          }

          list.push({
            id: docSnap.id,
            name: data.name || 'Group',
            avatarId: data.avatarId || undefined,
            createdBy: data.createdBy || '',
            creatorName: data.creatorName || 'Member',
            members: Array.isArray(data.members) ? data.members : [],
            memberDetails: data.memberDetails || {},
            createdAt,
            lastMessage: data.lastMessage || undefined,
            lastMessageAt,
            isTemporary,
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
      groupAvatarId?: string,
      allowSoloWhilePending = false
    ): Promise<{ success: boolean; group?: GroupItem; message?: string }> => {
      const cleanName = name.trim();
      if (!cleanName) {
        return { success: false, message: 'Please provide a group name.' };
      }

      const allMemberIds = Array.from(new Set([sessionId, ...memberIds]));
      if (allMemberIds.length < 2 && !allowSoloWhilePending) {
        return { success: false, message: 'Select at least one friend or online user to start a group.' };
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

  // 3b. Join an existing group (e.g. when accepting a group invitation confirmation box)
  const joinGroup = useCallback(
    async (groupId: string): Promise<GroupItem | null> => {
      if (!groupId || !sessionId) return null;
      try {
        const groupRef = doc(db, 'groups', groupId);
        await setDoc(
          groupRef,
          {
            members: arrayUnion(sessionId),
            memberDetails: {
              [sessionId]: {
                sessionId,
                userName,
                avatarId: avatarId || null,
              },
            },
          },
          { merge: true }
        );

        const snap = await getDoc(groupRef);
        if (snap.exists()) {
          const data = snap.data();
          const joinedGroup: GroupItem = {
            id: snap.id,
            name: data.name || 'Group',
            avatarId: data.avatarId || undefined,
            createdBy: data.createdBy || '',
            creatorName: data.creatorName || 'Member',
            members: Array.isArray(data.members) ? data.members : [sessionId],
            memberDetails: data.memberDetails || {},
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
            lastMessage: data.lastMessage || undefined,
            lastMessageAt: data.lastMessageAt?.toMillis ? data.lastMessageAt.toMillis() : undefined,
            isTemporary: Boolean(data.isTemporary),
          };
          setGroupNotice(`Joined group "${joinedGroup.name}"!`);
          setTimeout(() => setGroupNotice(null), 3000);
          return joinedGroup;
        }
        return null;
      } catch (err) {
        console.error('Join group error:', err);
        return null;
      }
    },
    [sessionId, userName, avatarId]
  );

  // 3b2. Create a shareable temporary group chat room & return its join link
  const createTemporaryGroupLink = useCallback(
    async (
      name: string,
      groupAvatarId?: string
    ): Promise<{ success: boolean; group?: GroupItem; shareUrl?: string; message?: string }> => {
      const cleanName = name.trim();
      if (!cleanName) {
        return { success: false, message: 'Please enter a group name for the link.' };
      }
      if (cleanName.length > 40) {
        return { success: false, message: 'Group name must be 40 characters or fewer.' };
      }

      const groupId = `tgrp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const memberDetails: Record<string, GroupMemberInfo> = {
        [sessionId]: {
          sessionId,
          userName,
          avatarId: avatarId || undefined,
        },
      };

      try {
        const groupDocRef = doc(db, 'groups', groupId);
        await setDoc(groupDocRef, {
          id: groupId,
          name: cleanName,
          avatarId: groupAvatarId || 'clay_g_squad',
          createdBy: sessionId,
          creatorName: userName,
          members: [sessionId],
          memberDetails,
          isTemporary: true,
          createdAt: serverTimestamp(),
          lastMessage: `Temporary link created by ${userName}`,
          lastMessageAt: serverTimestamp(),
        });

        const createdGroup: GroupItem = {
          id: groupId,
          name: cleanName,
          avatarId: groupAvatarId || 'clay_g_squad',
          createdBy: sessionId,
          creatorName: userName,
          members: [sessionId],
          memberDetails,
          createdAt: Date.now(),
          lastMessage: `Temporary link created by ${userName}`,
          lastMessageAt: Date.now(),
          isTemporary: true,
        };

        const baseUrl =
          typeof window !== 'undefined'
            ? `${window.location.origin}${window.location.pathname}`
            : '';
        const shareUrl = `${baseUrl}?join=${encodeURIComponent(groupId)}`;

        setGroupNotice(`Temporary chat link created for "${cleanName}"!`);
        setTimeout(() => setGroupNotice(null), 3000);

        return { success: true, group: createdGroup, shareUrl };
      } catch (err) {
        console.error('Create temporary group link error:', err);
        return { success: false, message: 'Could not create chat link. Check connection.' };
      }
    },
    [sessionId, userName, avatarId]
  );

  // 3b3. Fetch a group preview by ID (for shared join links)
  const getGroupPreview = useCallback(async (groupId: string): Promise<GroupItem | null> => {
    if (!groupId || !/^[a-zA-Z0-9_-]+$/.test(groupId)) return null;
    try {
      const snap = await getDoc(doc(db, 'groups', groupId));
      if (!snap.exists()) return null;
      const data = snap.data();
      return {
        id: snap.id,
        name: data.name || 'Temporary Group',
        avatarId: data.avatarId || undefined,
        createdBy: data.createdBy || '',
        creatorName: data.creatorName || 'Member',
        members: Array.isArray(data.members) ? data.members : [],
        memberDetails: data.memberDetails || {},
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
        lastMessage: data.lastMessage || undefined,
        lastMessageAt: data.lastMessageAt?.toMillis ? data.lastMessageAt.toMillis() : undefined,
        isTemporary: Boolean(data.isTemporary),
      };
    } catch {
      return null;
    }
  }, []);

  // 3c. Directly add confirmed friends to an existing group
  const addFriendsToGroup = useCallback(
    async (
      groupId: string,
      friendsToAdd: { sessionId: string; userName: string; avatarId?: string }[]
    ): Promise<boolean> => {
      if (!groupId || friendsToAdd.length === 0) return false;
      try {
        const groupRef = doc(db, 'groups', groupId);
        const memberDetailsPatch: Record<string, GroupMemberInfo> = {};
        const idsToAdd: string[] = [];

        friendsToAdd.forEach((f) => {
          idsToAdd.push(f.sessionId);
          memberDetailsPatch[f.sessionId] = {
            sessionId: f.sessionId,
            userName: f.userName,
            avatarId: f.avatarId || undefined,
          };
        });

        await setDoc(
          groupRef,
          {
            members: arrayUnion(...idsToAdd),
            memberDetails: memberDetailsPatch,
          },
          { merge: true }
        );

        setGroupNotice(
          friendsToAdd.length === 1
            ? `Added ${friendsToAdd[0].userName} to group!`
            : `Added ${friendsToAdd.length} friends to group!`
        );
        setTimeout(() => setGroupNotice(null), 3000);
        return true;
      } catch (err) {
        console.error('Add friends to group error:', err);
        return false;
      }
    },
    []
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
          const hasServerTimestamp = Boolean(data.createdAt?.toMillis);
          const timestamp = hasServerTimestamp ? data.createdAt.toMillis() : now;

          if (timestamp < cutoff) {
            deleteDoc(docSnap.ref).catch(() => {});
            return;
          }

          const readByIds: string[] = Array.isArray(data.readBy) ? data.readBy : [];
          const peerReaderIds = readByIds.filter((id: string) => id && id !== data.userId);
          const readerNames = peerReaderIds.map(
            (id: string) => activeGroup.memberDetails?.[id]?.userName || 'Member'
          );

          loaded.push({
            id: docSnap.id,
            userId: data.userId || 'anon',
            userName: data.userName || 'Anonymous',
            message: data.message || '',
            createdAt: timestamp,
            isOptimistic: !hasServerTimestamp || docSnap.metadata.hasPendingWrites,
            isRead: peerReaderIds.length > 0,
            readBy: readerNames,
            readByIds,
            attachment: data.attachment || undefined,
            reactions: Array.isArray(data.reactions) ? data.reactions : [],
            replyTo: data.replyTo || undefined,
            avatarId: data.avatarId || undefined,
          });
        });

        loaded.reverse();
        setGroupMessages(loaded);
        setLoadingMessages(false);

        // Notify on new real-time group messages
        const isInitial = !groupInitialLoadRef.current[activeGroup.id];
        if (!isInitial && onNewMessageRef.current) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              const timestamp = data.createdAt?.toMillis ? data.createdAt.toMillis() : now;
              if (now - timestamp < 20000 && data.userId !== sessionId) {
                onNewMessageRef.current?.(
                  {
                    id: change.doc.id,
                    userId: data.userId || 'anon',
                    userName: data.userName || 'Anonymous',
                    message: data.message || '',
                    createdAt: timestamp,
                    attachment: data.attachment || undefined,
                    reactions: Array.isArray(data.reactions) ? data.reactions : [],
                    replyTo: data.replyTo || undefined,
                    avatarId: data.avatarId || undefined,
                  },
                  activeGroup
                );
              }
            }
          });
        }
        groupInitialLoadRef.current[activeGroup.id] = true;
      },
      (err) => {
        console.error('Group messages error:', err);
        setLoadingMessages(false);
      }
    );

    return () => unsubscribe();
  }, [activeGroup, sessionId]);

  // 6b. Mark incoming group messages as read ONLY when actively viewing this group chat
  const markVisibleGroupMessagesRead = useCallback(() => {
    if (!activeGroup || !sessionId) return;
    if (typeof document !== 'undefined' && document.hidden) return;

    const unreadIncoming = groupMessages.filter(
      (m) =>
        !m.isOptimistic &&
        m.userId !== sessionId &&
        !(m.readByIds || []).includes(sessionId) &&
        !markedGroupReadRef.current.has(m.id)
    );

    if (unreadIncoming.length === 0) return;

    unreadIncoming.forEach((m) => {
      markedGroupReadRef.current.add(m.id);
      setDoc(
        doc(db, 'group_messages', m.id),
        {
          readBy: arrayUnion(sessionId),
        },
        { merge: true }
      ).catch(() => {
        markedGroupReadRef.current.delete(m.id);
      });
    });
  }, [activeGroup, groupMessages, sessionId]);

  useEffect(() => {
    markVisibleGroupMessagesRead();
  }, [markVisibleGroupMessagesRead]);

  useEffect(() => {
    if (!activeGroup) return;
    const handleFocus = () => {
      markVisibleGroupMessagesRead();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [activeGroup, markVisibleGroupMessagesRead]);

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
        isRead: false,
        readByIds: [sessionId],
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
          readBy: [sessionId],
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

  // 9. Edit/Rename an existing group message
  const editGroupMessage = useCallback(async (messageId: string, newText: string): Promise<boolean> => {
    const trimmed = newText.trim();
    if (!trimmed) return false;

    setGroupMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, message: trimmed } : m))
    );

    try {
      await setDoc(doc(db, 'group_messages', messageId), { message: trimmed }, { merge: true });
      return true;
    } catch (err) {
      console.error('Error editing group message:', err);
      return false;
    }
  }, []);

  // 10. Delete an existing group message
  const deleteGroupMessage = useCallback(async (messageId: string): Promise<boolean> => {
    setGroupMessages((prev) => prev.filter((m) => m.id !== messageId));

    try {
      await deleteDoc(doc(db, 'group_messages', messageId));
      return true;
    } catch (err) {
      console.error('Error deleting group message:', err);
      return false;
    }
  }, []);

  return {
    groups,
    activeGroup,
    groupMessages,
    loadingGroups,
    loadingMessages,
    groupNotice,
    createGroup,
    createTemporaryGroupLink,
    getGroupPreview,
    joinGroup,
    addFriendsToGroup,
    leaveGroup,
    openGroupChat,
    leaveGroupChat,
    sendGroupMessage,
    toggleGroupReaction,
    editGroupMessage,
    deleteGroupMessage,
    clearGroupNotice: () => setGroupNotice(null),
  };
}
