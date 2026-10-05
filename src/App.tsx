/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import {
  getSessionId,
  getSavedUserName,
  saveUserName,
  clearLocalData,
  testConnection,
} from './lib/firebase';
import { usePresence } from './hooks/usePresence';
import { useMessages } from './hooks/useMessages';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [userName, setUserName] = useState<string>(() => getSavedUserName());
  const [isEntered, setIsEntered] = useState<boolean>(() => !!getSavedUserName());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

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

  const handleEnterChat = (name: string) => {
    const cleanName = name.trim();
    saveUserName(cleanName);
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
    setUserName('');
    setIsEntered(false);
    setIsSettingsOpen(false);
  };

  if (!isEntered) {
    return (
      <WelcomeScreen
        onEnter={handleEnterChat}
        initialName={userName}
      />
    );
  }

  return (
    <div className="h-[100dvh] w-full max-w-4xl mx-auto flex flex-col bg-[#090a0f] text-neutral-100 overflow-hidden relative border-x border-neutral-800/40">
      {/* Offline status notification */}
      {isOffline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs px-4 py-2 text-center select-none font-medium tracking-tight">
          You&apos;re offline. Trying to reconnect...
        </div>
      )}

      {/* App Header */}
      <ChatHeader
        onlineCount={onlineCount}
        isOffline={isOffline}
        onOpenSettings={() => setIsSettingsOpen(true)}
        userName={userName}
      />

      {/* Scrollable Chat Area */}
      <MessageList
        messages={messages}
        systemNotifications={notifications}
        currentUserId={sessionId}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMoreMessages}
      />

      {/* Pinned Bottom Input */}
      <MessageInput
        onSendMessage={sendMessage}
        disabled={isOffline}
        errorMessage={errorMessage}
        onClearError={clearError}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentName={userName}
        onSaveName={handleSaveNewName}
        onClearData={handleClearData}
      />
    </div>
  );
}
