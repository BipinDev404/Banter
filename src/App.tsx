/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  getSessionId,
  getSavedUserName,
  saveUserName,
  clearLocalData,
  testConnection,
  db,
} from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import {
  usePresence,
  useMessages,
  useTyping,
  usePrivateChat,
  useFriends,
  useGroups,
} from '@/hooks';
import {
  WelcomeScreen,
  ChatHeader,
  MessageList,
  MessageInput,
  SettingsModal,
  OnlineUsersModal,
  FriendsModal,
  GroupInfoModal,
  LightboxModal,
  MessageActionsModal,
  PrivateChatConfirmationModal,
  FriendAlertModal,
} from '@/components';
import { FriendAlertData } from '@/components/FriendAlertModal';
import { ChatMessage, GroupItem } from '@/types';
import { playMessagePopSound } from '@/lib/sound';
import { AppSettings, loadSavedSettings, saveSettings, getFontOption } from '@/lib/settings';

export default function App() {
  const [userName, setUserName] = useState<string>(() => getSavedUserName());
  const [isEntered, setIsEntered] = useState<boolean>(() => !!getSavedUserName());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isOnlineUsersOpen, setIsOnlineUsersOpen] = useState<boolean>(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState<boolean>(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [actionsMsg, setActionsMsg] = useState<ChatMessage | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('banter_dark_mode');
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {
      // fallback
    }
    return true; // Default dark: always open in dark/black
  });
  const [settings, setSettings] = useState<AppSettings>(() => loadSavedSettings());
  const [friendAlertData, setFriendAlertData] = useState<FriendAlertData | null>(null);
  const dismissedRequestsRef = useRef<Set<string>>(new Set());

  // Active inline reply target
  const [replyTarget, setReplyTarget] = useState<{ userName: string; snippet?: string } | null>(null);

  // Sync theme changes with html element and persistence
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.backgroundColor = '#000000';
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.backgroundColor = '#F2F2F7';
      document.documentElement.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem('banter_dark_mode', isDarkMode ? 'true' : 'false');
    } catch {
      // storage error
    }
  }, [isDarkMode]);

  // Unique session ID for this browser tab
  const sessionId = useMemo(() => getSessionId(), []);

  // Connection test on boot
  useEffect(() => {
    testConnection();

    const handleDblClick = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener('dblclick', handleDblClick);
    return () => window.removeEventListener('dblclick', handleDblClick);
  }, []);

  // Presence hook with custom Apple vector avatar synchronization
  const { onlineCount, notifications, otherUsers, onlineUsers, markViewLoaded } = usePresence({
    sessionId,
    userName,
    avatarId: settings.avatarId,
    enabled: isEntered,
  });

  // Global Messages hook
  const {
    messages: globalMessages,
    sendMessage: sendGlobalMessage,
    editMessage: editGlobalMessage,
    deleteMessage: deleteGlobalMessage,
    toggleReaction: toggleGlobalReaction,
    loading: loadingGlobal,
    hasMore: hasMoreGlobal,
    loadMoreMessages: loadMoreGlobalMessages,
    isOffline,
    errorMessage: globalErrorMessage,
    clearError: clearGlobalError,
  } = useMessages({
    userId: sessionId,
    userName,
    avatarId: settings.avatarId,
    enabled: isEntered,
    otherUsers,
    onViewLoaded: markViewLoaded,
  });

  // Real-time typing status hook
  const { typingUsers, notifyTyping, stopTyping } = useTyping({
    sessionId,
    userName,
    enabled: isEntered,
  });

  // Real-time 1-on-1 Direct Chat hook
  const {
    incomingRequest,
    activePrivateChat,
    privateMessages,
    requestPrivateChat,
    acceptPrivateChat,
    declinePrivateChat,
    leavePrivateChat,
    openDirectChat,
    sendPrivateMessage,
    togglePrivateReaction,
  } = usePrivateChat({
    sessionId,
    userName,
    avatarId: settings.avatarId,
    enabled: isEntered,
  });

  // Real-time Friends and Friend Requests hook
  const {
    friends,
    incomingRequests,
    sentRequests,
    pendingCount: pendingFriendsCount,
    actionNotice: friendNotice,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    isFriend,
  } = useFriends({
    sessionId,
    userName,
    avatarId: settings.avatarId,
    enabled: isEntered,
  });

  // Prompt popup whenever an incoming friend request is detected
  useEffect(() => {
    if (!isEntered) return;
    if (incomingRequests.length > 0) {
      const unhandled = incomingRequests.find((r) => !dismissedRequestsRef.current.has(r.id));
      if (unhandled && !friendAlertData) {
        setFriendAlertData({
          type: 'incoming',
          targetSessionId: unhandled.fromSessionId,
          targetUserName: unhandled.fromUserName,
          targetAvatarId: unhandled.fromAvatarId,
          requestId: unhandled.id,
        });
      }
    }
  }, [incomingRequests, isEntered, friendAlertData]);

  const handleSendFriendRequestWithPopup = useCallback(
    async (targetId: string, targetName: string, avatarId?: string) => {
      const res = await sendFriendRequest(targetId, targetName, avatarId);
      if (res.success) {
        setFriendAlertData({
          type: 'sent',
          targetSessionId: targetId,
          targetUserName: targetName,
          targetAvatarId: avatarId,
        });
      }
      return res;
    },
    [sendFriendRequest]
  );

  // Real-time Friend Groups hook
  const {
    groups,
    activeGroup,
    groupMessages,
    groupNotice,
    createGroup,
    leaveGroup,
    openGroupChat,
    leaveGroupChat,
    sendGroupMessage,
    toggleGroupReaction,
  } = useGroups({
    sessionId,
    userName,
    avatarId: settings.avatarId,
    enabled: isEntered,
  });

  // Determine active conversation messages (Group > Direct > Global)
  const currentMessages = activeGroup
    ? groupMessages
    : activePrivateChat
    ? privateMessages
    : globalMessages;

  // Play subtle 'pop' sound when a new message from another user arrives
  const lastMessageCountRef = useRef<number>(-1);
  useEffect(() => {
    if (!currentMessages || currentMessages.length === 0) return;

    if (lastMessageCountRef.current === -1) {
      lastMessageCountRef.current = currentMessages.length;
      return;
    }

    if (currentMessages.length > lastMessageCountRef.current) {
      const newestMsg = currentMessages[currentMessages.length - 1];
      if (newestMsg && newestMsg.userId !== sessionId && !newestMsg.isOptimistic) {
        if (settings.soundEnabled) {
          playMessagePopSound();
        }
      }
      lastMessageCountRef.current = currentMessages.length;
    } else if (currentMessages.length < lastMessageCountRef.current) {
      lastMessageCountRef.current = currentMessages.length;
    }
  }, [currentMessages, sessionId, settings.soundEnabled]);

  const handleEnterChat = (name: string, avatarId?: string) => {
    const cleanName = name.trim();
    saveUserName(cleanName);
    if (avatarId) {
      try {
        localStorage.setItem('banter_user_avatar', avatarId);
      } catch (e) {
        console.error(e);
      }
      setSettings((prev) => ({ ...prev, avatarId }));
    }
    setUserName(cleanName);
    setIsEntered(true);
  };

  const handleSaveNewName = (newName: string) => {
    const cleanName = newName.trim();
    saveUserName(cleanName);
    setUserName(cleanName);
  };

  const handleClearData = () => {
    try {
      deleteDoc(doc(db, 'presence', sessionId)).catch(() => {});
    } catch (e) {
      console.error(e);
    }
    clearLocalData();
    try {
      localStorage.removeItem('banter_user_avatar');
      localStorage.removeItem('banter_reactions_map');
      localStorage.removeItem('banter_app_settings_v2');
    } catch (e) {
      console.error(e);
    }
    setUserName('');
    setIsEntered(false);
    setIsSettingsOpen(false);
  };

  const handleReplyTo = useCallback((senderName: string, textSnippet: string) => {
    const firstName = senderName.split(' ')[0] || senderName;
    setReplyTarget({ userName: firstName, snippet: textSnippet });
  }, []);

  // Direct Message with friend handler
  const handleStartDirectChat = useCallback(
    (friendSessionId: string, friendName: string, friendAvatarId?: string) => {
      leaveGroupChat();
      openDirectChat(friendSessionId, friendName, friendAvatarId);
    },
    [openDirectChat, leaveGroupChat]
  );

  // Group chat opening handler
  const handleOpenGroupChat = useCallback(
    (group: GroupItem) => {
      leavePrivateChat();
      openGroupChat(group);
    },
    [openGroupChat, leavePrivateChat]
  );

  // Unified Send Message Dispatcher (Group vs Direct vs Global)
  const handleSendMessage = useCallback(
    async (text: string, attachment?: any, replyTo?: any) => {
      if (activeGroup) {
        return await sendGroupMessage(text, attachment, replyTo);
      }
      if (activePrivateChat) {
        return await sendPrivateMessage(text, attachment, replyTo);
      }
      return await sendGlobalMessage(text, attachment, replyTo);
    },
    [activeGroup, activePrivateChat, sendGroupMessage, sendPrivateMessage, sendGlobalMessage]
  );

  // Unified Reaction Dispatcher
  const handleToggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (activeGroup) {
        toggleGroupReaction(messageId, emoji);
      } else if (activePrivateChat) {
        togglePrivateReaction(messageId, emoji);
      } else {
        toggleGlobalReaction(messageId, emoji);
      }
    },
    [activeGroup, activePrivateChat, toggleGroupReaction, togglePrivateReaction, toggleGlobalReaction]
  );

  // Unified Edit Dispatcher
  const handleEditMessage = useCallback(
    async (messageId: string, newText: string) => {
      if (activeGroup || activePrivateChat) {
        return true;
      }
      return await editGlobalMessage(messageId, newText);
    },
    [activeGroup, activePrivateChat, editGlobalMessage]
  );

  // Unified Delete Dispatcher
  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      if (activeGroup || activePrivateChat) {
        return true;
      }
      return await deleteGlobalMessage(messageId);
    },
    [activeGroup, activePrivateChat, deleteGlobalMessage]
  );

  // Check if partner is online in private mode
  const isPartnerOnline = useMemo(() => {
    if (!activePrivateChat) return false;
    return onlineUsers.some((u) => u.sessionId === activePrivateChat.partnerSessionId);
  }, [activePrivateChat, onlineUsers]);

  if (!isEntered) {
    return (
      <WelcomeScreen
        onEnter={handleEnterChat}
        initialName={userName}
        initialAvatarId={settings.avatarId}
      />
    );
  }

  const activeFont = getFontOption(settings.fontStyle);
  const activeToast = friendNotice || groupNotice;

  return (
    <div
      style={{ fontFamily: activeFont.fontFamily }}
      className={`h-[100dvh] w-full flex flex-col overflow-hidden transition-colors ${
        isDarkMode ? 'dark bg-black text-white' : 'bg-[#F2F2F7] text-neutral-900'
      }`}
    >
      {/* Offline Alert */}
      {isOffline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-500 text-xs px-4 py-1.5 text-center select-none font-medium">
          You&apos;re offline. Reconnecting to chat...
        </div>
      )}

      {/* Clean Chat Header (No group plus icon on header; full view on private/group/global) */}
      <ChatHeader
        onlineCount={onlineCount}
        isOffline={isOffline}
        userName={userName}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenOnlineUsers={() => setIsOnlineUsersOpen(true)}
        onOpenFriends={() => setIsFriendsOpen(true)}
        friendsCount={friends.length}
        pendingRequestsCount={pendingFriendsCount}
        typingUsers={typingUsers}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
        activePrivateChat={activePrivateChat}
        onLeavePrivateChat={leavePrivateChat}
        isPartnerOnline={isPartnerOnline}
        activeGroup={activeGroup}
        onLeaveGroupChat={leaveGroupChat}
        onOpenGroupInfo={() => setIsGroupInfoOpen(true)}
      />

      {/* Main Message Thread (Global, Group, or Direct Friend Chat) */}
      <MessageList
        messages={currentMessages}
        systemNotifications={activePrivateChat || activeGroup ? [] : notifications}
        currentUserId={sessionId}
        loading={loadingGlobal}
        hasMore={activePrivateChat || activeGroup ? false : hasMoreGlobal}
        onLoadMore={activePrivateChat || activeGroup ? () => {} : loadMoreGlobalMessages}
        onReact={handleToggleReaction}
        onReplyTo={handleReplyTo}
        onOpenImage={(url, name) => setLightboxImage({ url, name })}
        onOpenActionsModal={(msg) => setActionsMsg(msg)}
        typingUsers={activePrivateChat || activeGroup ? [] : typingUsers}
        isDarkMode={isDarkMode}
        settings={settings}
      />

      {/* Clean Message Input Bar */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={isOffline}
        errorMessage={globalErrorMessage}
        onClearError={clearGlobalError}
        replyTarget={replyTarget}
        onClearReply={() => setReplyTarget(null)}
        onTyping={notifyTyping}
        onStopTyping={stopTyping}
        isDarkMode={isDarkMode}
        themeAccent={settings.themeAccent}
      />

      {/* Profile Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentName={userName}
        onSaveName={handleSaveNewName}
        onClearData={handleClearData}
        settings={settings}
      />

      {/* Online Users List Modal */}
      <OnlineUsersModal
        isOpen={isOnlineUsersOpen}
        onClose={() => setIsOnlineUsersOpen(false)}
        users={onlineUsers}
        onRequestPrivateChat={(targetId, targetName) => {
          const friend = friends.find((f) => f.friendSessionId === targetId);
          if (friend) {
            handleStartDirectChat(friend.friendSessionId, friend.friendName, friend.avatarId);
          } else {
            requestPrivateChat(targetId, targetName);
          }
        }}
        isFriend={isFriend}
        onSendFriendRequest={(targetId, targetName, avatarId) => {
          handleSendFriendRequestWithPopup(targetId, targetName, avatarId);
        }}
        isDarkMode={isDarkMode}
      />

      {/* Friends & Groups Center Modal */}
      <FriendsModal
        isOpen={isFriendsOpen}
        onClose={() => setIsFriendsOpen(false)}
        friends={friends}
        groups={groups}
        incomingRequests={incomingRequests}
        sentRequests={sentRequests}
        onAcceptRequest={acceptFriendRequest}
        onDeclineRequest={declineFriendRequest}
        onSendRequest={sendFriendRequest}
        onRemoveFriend={removeFriend}
        onStartDirectChat={handleStartDirectChat}
        onOpenGroupChat={handleOpenGroupChat}
        onCreateGroup={createGroup}
        onLeaveGroup={leaveGroup}
        onlineUsers={onlineUsers}
        currentSessionId={sessionId}
        isDarkMode={isDarkMode}
        onShowFriendPopup={(data) => setFriendAlertData(data)}
      />

      {/* Group Info Modal */}
      <GroupInfoModal
        isOpen={isGroupInfoOpen}
        onClose={() => setIsGroupInfoOpen(false)}
        group={activeGroup}
        currentSessionId={sessionId}
        onLeaveGroup={leaveGroup}
        isDarkMode={isDarkMode}
      />

      {/* Private Chat Confirmation Request Modal */}
      <PrivateChatConfirmationModal
        isOpen={!!incomingRequest}
        request={incomingRequest}
        onAccept={() => {
          if (incomingRequest) acceptPrivateChat(incomingRequest);
        }}
        onDecline={() => {
          if (incomingRequest) declinePrivateChat(incomingRequest);
        }}
        isDarkMode={isDarkMode}
      />

      {/* Fullscreen Image Lightbox Modal */}
      <LightboxModal
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        imageUrl={lightboxImage?.url || ''}
        imageName={lightboxImage?.name}
      />

      {/* Message Options Actions Modal */}
      <MessageActionsModal
        isOpen={!!actionsMsg}
        onClose={() => setActionsMsg(null)}
        message={actionsMsg}
        isSelf={actionsMsg?.userId === sessionId}
        onReply={() => {
          if (actionsMsg) {
            const textPart = actionsMsg.message?.trim() || '';
            const attachLabel = actionsMsg.attachment
              ? actionsMsg.attachment.type === 'image'
                ? 'Photo'
                : actionsMsg.attachment.name
              : '';
            const snippet = textPart
              ? attachLabel
                ? `${textPart} (${attachLabel})`
                : textPart
              : attachLabel;
            handleReplyTo(actionsMsg.userName, snippet);
          }
        }}
        onReact={(emoji) => {
          if (actionsMsg?.id) {
            handleToggleReaction(actionsMsg.id, emoji);
          }
        }}
        onEdit={(newText) => {
          if (actionsMsg?.id) {
            handleEditMessage(actionsMsg.id, newText);
          }
        }}
        onDelete={() => {
          if (actionsMsg?.id) {
            handleDeleteMessage(actionsMsg.id);
          }
        }}
        isFriend={actionsMsg ? isFriend(actionsMsg.userId) : false}
        onAddFriend={() => {
          if (actionsMsg) {
            handleSendFriendRequestWithPopup(actionsMsg.userId, actionsMsg.userName, actionsMsg.avatarId);
          }
        }}
        isDarkMode={isDarkMode}
      />

      {/* Friend Action & Incoming Request Alert Modal */}
      <FriendAlertModal
        isOpen={!!friendAlertData}
        onClose={() => setFriendAlertData(null)}
        data={friendAlertData}
        onAccept={() => {
          if (!friendAlertData) return;
          const req =
            incomingRequests.find((r) => r.id === friendAlertData.requestId) ||
            incomingRequests.find((r) => r.fromSessionId === friendAlertData.targetSessionId);
          if (req) {
            acceptFriendRequest(req);
            setFriendAlertData({
              type: 'accepted',
              targetSessionId: req.fromSessionId,
              targetUserName: req.fromUserName,
              targetAvatarId: req.fromAvatarId,
            });
          }
        }}
        onDecline={() => {
          if (!friendAlertData) return;
          const req =
            incomingRequests.find((r) => r.id === friendAlertData.requestId) ||
            incomingRequests.find((r) => r.fromSessionId === friendAlertData.targetSessionId);
          if (req) {
            dismissedRequestsRef.current.add(req.id);
            declineFriendRequest(req);
          }
          setFriendAlertData(null);
        }}
        onStartChat={() => {
          if (friendAlertData?.targetSessionId && friendAlertData.targetUserName) {
            handleStartDirectChat(
              friendAlertData.targetSessionId,
              friendAlertData.targetUserName,
              friendAlertData.targetAvatarId
            );
          }
          setFriendAlertData(null);
          setIsFriendsOpen(false);
          setIsOnlineUsersOpen(false);
        }}
        isDarkMode={isDarkMode}
      />

      {/* Floating Notice Toast for Friend & Group Actions */}
      {activeToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="px-4 py-2 rounded-2xl bg-neutral-900/90 text-white dark:bg-white/90 dark:text-neutral-900 text-xs font-semibold shadow-xl border border-white/10 backdrop-blur-md flex items-center gap-2">
            <span>{activeToast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
