/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getSessionId,
  getSavedUserName,
  saveUserName,
  clearLocalData,
  testConnection,
  db,
} from './lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { usePresence } from './hooks/usePresence';
import { useMessages } from './hooks/useMessages';
import { useTyping } from './hooks/useTyping';
import { usePrivateChat } from './hooks/usePrivateChat';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { SettingsModal } from './components/SettingsModal';
import { OnlineUsersModal } from './components/OnlineUsersModal';
import { LightboxModal } from './components/LightboxModal';
import { MessageActionsModal } from './components/MessageActionsModal';
import { PrivateChatConfirmationModal } from './components/PrivateChatConfirmationModal';
import { PrivateChatModal } from './components/PrivateChatModal';
import { ChatMessage } from './types';
import { playMessagePopSound } from './lib/sound';

export default function App() {
  const [userName, setUserName] = useState<string>(() => getSavedUserName());
  const [isEntered, setIsEntered] = useState<boolean>(() => !!getSavedUserName());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isOnlineUsersOpen, setIsOnlineUsersOpen] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [actionsMsg, setActionsMsg] = useState<ChatMessage | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Active inline reply target
  const [replyTarget, setReplyTarget] = useState<{ userName: string; snippet?: string } | null>(null);

  // Unique session ID for this browser tab
  const sessionId = useMemo(() => getSessionId(), []);

  // Connection test and global double-click prevention
  useEffect(() => {
    testConnection();

    const handleDblClick = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener('dblclick', handleDblClick);
    return () => window.removeEventListener('dblclick', handleDblClick);
  }, []);

  // Presence hook
  const { onlineCount, notifications, otherUsers, onlineUsers, markViewLoaded } = usePresence({
    sessionId,
    userName,
    enabled: isEntered,
  });

  // Messages hook
  const {
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
    clearError,
  } = useMessages({
    userId: sessionId,
    userName,
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

  // Real-time Private Chat hook
  const {
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
    sendPrivateMessage,
    togglePrivateReaction,
    clearPrivateError,
  } = usePrivateChat({
    sessionId,
    userName,
    enabled: isEntered,
  });

  // Play subtle 'pop' sound when a new message from another user arrives
  const lastMessageCountRef = React.useRef<number>(-1);
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    if (lastMessageCountRef.current === -1) {
      // First snapshot on chat load: initialize count without playing sound
      lastMessageCountRef.current = messages.length;
      return;
    }

    if (messages.length > lastMessageCountRef.current) {
      const newestMsg = messages[messages.length - 1];
      // Play pop only if message came from another user and is not our own optimistic send
      if (newestMsg && newestMsg.userId !== sessionId && !newestMsg.isOptimistic) {
        playMessagePopSound();
      }
      lastMessageCountRef.current = messages.length;
    } else if (messages.length < lastMessageCountRef.current) {
      // Ephemeral cleanup happened
      lastMessageCountRef.current = messages.length;
    }
  }, [messages, sessionId]);

  const handleEnterChat = (name: string, avatarId?: string) => {
    const cleanName = name.trim();
    saveUserName(cleanName);
    if (avatarId) {
      try {
        localStorage.setItem('banter_user_avatar', avatarId);
      } catch (e) {
        console.error(e);
      }
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

  if (!isEntered) {
    return (
      <WelcomeScreen
        onEnter={handleEnterChat}
        initialName={userName}
      />
    );
  }

  return (
    <div
      className={`h-[100dvh] w-full flex flex-col overflow-hidden transition-colors ${
        isDarkMode ? 'dark bg-[#121316] text-neutral-100' : 'bg-white text-neutral-900'
      }`}
    >
      {/* Offline Alert */}
      {isOffline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs px-4 py-1.5 text-center select-none font-medium">
          You&apos;re offline. Reconnecting to chat...
        </div>
      )}

      {/* Clean Chat Header */}
      <ChatHeader
        onlineCount={onlineCount}
        isOffline={isOffline}
        userName={userName}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenOnlineUsers={() => setIsOnlineUsersOpen(true)}
        typingUsers={typingUsers}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Message Thread */}
      <MessageList
        messages={messages}
        systemNotifications={notifications}
        currentUserId={sessionId}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMoreMessages}
        onReact={toggleReaction}
        onReplyTo={handleReplyTo}
        onOpenImage={(url, name) => setLightboxImage({ url, name })}
        onOpenActionsModal={(msg) => setActionsMsg(msg)}
        typingUsers={typingUsers}
        isDarkMode={isDarkMode}
      />

      {/* Clean Input Bar */}
      <MessageInput
        onSendMessage={sendMessage}
        disabled={isOffline}
        errorMessage={errorMessage}
        onClearError={clearError}
        replyTarget={replyTarget}
        onClearReply={() => setReplyTarget(null)}
        onTyping={notifyTyping}
        onStopTyping={stopTyping}
        isDarkMode={isDarkMode}
      />

      {/* Simple Profile Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentName={userName}
        onSaveName={handleSaveNewName}
        onClearData={handleClearData}
        isDarkMode={isDarkMode}
      />

      {/* Online Users List Modal */}
      <OnlineUsersModal
        isOpen={isOnlineUsersOpen}
        onClose={() => setIsOnlineUsersOpen(false)}
        users={onlineUsers}
        onRequestPrivateChat={(targetId, targetName) => {
          requestPrivateChat(targetId, targetName);
        }}
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

      {/* Active 1-on-1 Private Chat Modal */}
      <PrivateChatModal
        isOpen={!!activePrivateChat}
        onClose={leavePrivateChat}
        room={activePrivateChat}
        messages={privateMessages}
        onSendMessage={sendPrivateMessage}
        onReact={togglePrivateReaction}
        currentUserId={sessionId}
        currentUserName={userName}
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
                ? '📷 Photo'
                : `📄 ${actionsMsg.attachment.name}`
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
            toggleReaction(actionsMsg.id, emoji);
          }
        }}
        onEdit={(newText) => {
          if (actionsMsg?.id) {
            editMessage(actionsMsg.id, newText);
          }
        }}
        onDelete={() => {
          if (actionsMsg?.id) {
            deleteMessage(actionsMsg.id);
          }
        }}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
