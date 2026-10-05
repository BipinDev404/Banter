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
} from './lib/firebase';
import { usePresence } from './hooks/usePresence';
import { useMessages } from './hooks/useMessages';
import { useTyping } from './hooks/useTyping';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [userName, setUserName] = useState<string>(() => getSavedUserName());
  const [isEntered, setIsEntered] = useState<boolean>(() => !!getSavedUserName());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Active inline reply target
  const [replyTarget, setReplyTarget] = useState<{ userName: string; snippet?: string } | null>(null);

  // Unique session ID for this browser tab
  const sessionId = useMemo(() => getSessionId(), []);

  // Connection test on initial mount
  useEffect(() => {
    testConnection();
  }, []);

  // Presence hook
  const { onlineCount, notifications } = usePresence({
    sessionId,
    userName,
    enabled: isEntered,
  });

  // Messages hook
  const {
    messages,
    sendMessage,
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
  });

  // Real-time typing status hook
  const { typingUsers, notifyTyping, stopTyping } = useTyping({
    sessionId,
    userName,
    enabled: isEntered,
  });

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
    </div>
  );
}
