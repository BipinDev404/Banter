import React from 'react';
import { User, MessageSquare, ArrowLeft, Users, Info, Sun, Moon } from 'lucide-react';
import { BanterLogo } from './BanterLogo';
import { TypingUser, PrivateChatRoom, GroupItem } from '../types';
import { getAvatarForUser, getGroupAvatar } from '../lib/avatars';
import { UserAvatar } from './UserAvatar';

interface ChatHeaderProps {
  onlineCount: number;
  isOffline?: boolean;
  userName: string;
  onOpenSettings: () => void;
  onOpenOnlineUsers?: () => void;
  onOpenFriends?: () => void;
  friendsCount?: number;
  pendingRequestsCount?: number;
  typingUsers?: TypingUser[];
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  activePrivateChat?: PrivateChatRoom | null;
  onLeavePrivateChat?: () => void;
  isPartnerOnline?: boolean;
  activeGroup?: GroupItem | null;
  onLeaveGroupChat?: () => void;
  onOpenGroupInfo?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onlineCount,
  isOffline = false,
  userName = 'You',
  onOpenSettings,
  onOpenOnlineUsers,
  onOpenFriends,
  friendsCount = 0,
  pendingRequestsCount = 0,
  typingUsers = [],
  isDarkMode = true,
  onToggleDarkMode,
  activePrivateChat,
  onLeavePrivateChat,
  isPartnerOnline = false,
  activeGroup,
  onLeaveGroupChat,
  onOpenGroupInfo,
}) => {
  const validTypingUsers = (typingUsers || []).filter(
    (u) => u && typeof u.userName === 'string' && u.userName.trim().length > 0
  );
  const hasTypers = validTypingUsers.length > 0;
  const firstTyperName = validTypingUsers[0]?.userName || 'Someone';
  const typerLabel =
    validTypingUsers.length === 1
      ? `${firstTyperName} is typing`
      : `${firstTyperName} +${validTypingUsers.length - 1} typing`;

  // Partner avatar for chat
  const partnerAvatar = activePrivateChat
    ? getAvatarForUser(
        activePrivateChat.partnerSessionId,
        activePrivateChat.partnerName,
        activePrivateChat.partnerAvatarId
      )
    : null;

  // Group avatar for group chat
  const groupAvatar = activeGroup ? getGroupAvatar(activeGroup.avatarId, activeGroup.name) : null;

  // User avatar for profile button
  const userAvatar = getAvatarForUser(undefined, userName);

  return (
    <header
      className={`px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between border-b shrink-0 select-none z-30 sticky top-0 backdrop-blur-2xl transition-all ${
        isDarkMode
          ? 'bg-black/80 border-white/10 text-white'
          : 'bg-white/80 border-black/5 text-neutral-900'
      }`}
    >
      {/* Subtle Apple top edge reflection */}
      <div
        className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent ${
          isDarkMode ? 'via-white/20' : 'via-black/10'
        } to-transparent pointer-events-none`}
      />

      {/* Left: Brand Identity / Chat Info / Group Chat Info */}
      <div className="flex items-center gap-2.5 min-w-0">
        {activeGroup ? (
          /* Group Chat Header View */
          <div className="flex items-center gap-2.5 min-w-0">
            {onLeaveGroupChat && (
              <button
                type="button"
                onClick={onLeaveGroupChat}
                className={`p-2 rounded-full active:scale-90 transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-white/10 hover:bg-white/15 text-white'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                }`}
                title="Back to Global Chat"
                aria-label="Back to Global Chat"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
              </button>
            )}

            {groupAvatar && <UserAvatar avatar={groupAvatar} size="sm" />}

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm sm:text-base tracking-tight truncate">
                  {activeGroup.name}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 flex items-center gap-1">
                  <MessageSquare className="w-2.5 h-2.5 stroke-[2.5]" />
                  <span>Group</span>
                </span>
              </div>
              <span className="text-[11px] text-neutral-400">
                {activeGroup.members.length} {activeGroup.members.length === 1 ? 'member' : 'members'} • Details
              </span>
            </div>
          </div>
        ) : activePrivateChat ? (
          /* 1-on-1 Chat Mode Header */
          <div className="flex items-center gap-2.5 min-w-0">
            {onLeavePrivateChat && (
              <button
                type="button"
                onClick={onLeavePrivateChat}
                className={`p-2 rounded-full active:scale-90 transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-white/10 hover:bg-white/15 text-white'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                }`}
                title="Back to Global Chat"
                aria-label="Back to Global Chat"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
              </button>
            )}

            {partnerAvatar && (
              <UserAvatar
                avatar={partnerAvatar}
                size="sm"
                isOnline={isPartnerOnline}
                showOnlineBadge={true}
              />
            )}

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm sm:text-base tracking-tight truncate">
                  {activePrivateChat.partnerName}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 flex items-center gap-1">
                  <MessageSquare className="w-2.5 h-2.5 stroke-[2.5]" />
                  <span>Chat</span>
                </span>
              </div>
              <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isPartnerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-500'
                  }`}
                />
                <span>{isPartnerOnline ? 'Active in chat' : 'Offline'}</span>
              </span>
            </div>
          </div>
        ) : (
          /* Global Room Brand Header */
          <div className="flex items-center gap-3 min-w-0">
            <BanterLogo size="md" showText={true} />
            {hasTypers && (
              <span className="text-[11px] text-[#007AFF] font-medium tracking-tight flex items-center gap-1.5 animate-in fade-in">
                <span>{typerLabel}</span>
                <span className="inline-flex gap-0.5 items-center">
                  <span className="w-1 h-1 rounded-full bg-[#007AFF] animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1 h-1 rounded-full bg-[#007AFF] animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1 h-1 rounded-full bg-[#007AFF] animate-bounce [animation-delay:0s]" />
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right Controls: Online Users, Friends, Theme Switcher, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Info button if in Group Chat Mode */}
        {activeGroup && onOpenGroupInfo && (
          <button
            type="button"
            onClick={onOpenGroupInfo}
            className={`w-9 h-9 rounded-full border flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-[#1c1c1e] hover:bg-[#2c2c2e] border-white/10 text-neutral-300 hover:text-white'
                : 'bg-neutral-100 hover:bg-neutral-200 border-black/5 text-neutral-700 hover:text-black'
            }`}
            title="Group info & members"
            aria-label="Group info & members"
          >
            <Info className="w-4 h-4 stroke-[2.2]" />
          </button>
        )}

        {/* Return to Global Chat Button if in Private/Group Mode */}
        {(activePrivateChat || activeGroup) && (
          <button
            type="button"
            onClick={activeGroup ? onLeaveGroupChat : onLeavePrivateChat}
            className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border active:scale-95 transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-[#1c1c1e] hover:bg-[#2c2c2e] border-white/10 text-neutral-300 hover:text-white'
                : 'bg-neutral-100 hover:bg-neutral-200 border-black/5 text-neutral-700 hover:text-black'
            }`}
            title="Return to Global Public Chat"
          >
            <span>Exit Chat</span>
          </button>
        )}

        {/* Online Count: Status Capsule */}
        <button
          type="button"
          onClick={onOpenOnlineUsers}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer transition-all active:scale-95 border ${
            isOffline
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20'
              : isDarkMode
              ? 'bg-[#1c1c1e] hover:bg-[#2c2c2e] border-white/10 text-neutral-200'
              : 'bg-neutral-100 hover:bg-neutral-200 border-black/5 text-neutral-700'
          }`}
          title={`${onlineCount} users online`}
          aria-label="View online users"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOffline ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'
            }`}
          />
          <span>{onlineCount}</span>
        </button>

        {/* Friends & Groups Center Trigger Button */}
        {onOpenFriends && (
          <button
            type="button"
            onClick={onOpenFriends}
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer relative active:scale-95 ${
              pendingRequestsCount > 0
                ? 'bg-blue-500/20 border-blue-500/30 text-blue-500 dark:text-blue-300 hover:bg-blue-500/30'
                : isDarkMode
                ? 'bg-[#1c1c1e] hover:bg-[#2c2c2e] border-white/10 text-neutral-300 hover:text-white'
                : 'bg-neutral-100 hover:bg-neutral-200 border-black/5 text-neutral-700 hover:text-black'
            }`}
            title={`Friends & Groups (${friendsCount} friends${pendingRequestsCount > 0 ? `, ${pendingRequestsCount} requests` : ''})`}
            aria-label="Open friends and groups"
          >
            <Users className="w-4 h-4 stroke-[2.2]" />
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-black animate-pulse" />
            )}
          </button>
        )}

        {/* Theme Toggle Button (Dark / White Mode) */}
        {onToggleDarkMode && (
          <button
            type="button"
            onClick={onToggleDarkMode}
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer active:scale-90 ${
              isDarkMode
                ? 'bg-[#1c1c1e] hover:bg-[#2c2c2e] border-white/10 text-amber-400 hover:text-amber-300'
                : 'bg-neutral-100 hover:bg-neutral-200 border-black/5 text-neutral-700 hover:text-black'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 stroke-[2.2]" />
            ) : (
              <Moon className="w-4 h-4 stroke-[2.2]" />
            )}
          </button>
        )}

        {/* Profile Button: Clean Capsule with User Avatar and Username */}
        <button
          onClick={onOpenSettings}
          className={`h-9 px-2.5 rounded-full border flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
            isDarkMode
              ? 'bg-[#1c1c1e] hover:bg-[#2c2c2e] border-white/10 text-white'
              : 'bg-neutral-100 hover:bg-neutral-200 border-black/5 text-neutral-800'
          }`}
          title={`Profile: ${userName || 'You'} (Click to change username)`}
          aria-label="Open profile"
        >
          <UserAvatar avatar={userAvatar} size="xs" />
          <span className="text-xs font-medium max-w-[90px] sm:max-w-[120px] truncate">
            {userName || 'Profile'}
          </span>
        </button>
      </div>
    </header>
  );
};
