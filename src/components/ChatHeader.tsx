import React from 'react';
import { Sun, Moon, User, Lock, ArrowLeft, Users, Info } from 'lucide-react';
import { BanterLogo } from './BanterLogo';
import { TypingUser, PrivateChatRoom, GroupItem } from '../types';
import { getAvatarForUser, getGroupAvatar, renderAvatarIcon } from '../lib/avatars';
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
  isDarkMode = false,
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

  // Partner avatar for direct chat
  const partnerAvatar = activePrivateChat
    ? getAvatarForUser(
        activePrivateChat.partnerSessionId,
        activePrivateChat.partnerName,
        activePrivateChat.partnerAvatarId
      )
    : null;

  // Group avatar for group chat
  const groupAvatar = activeGroup ? getGroupAvatar(activeGroup.avatarId, activeGroup.name) : null;

  return (
    <header
      className={`px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between border-b shrink-0 select-none z-20 sticky top-0 transition-all ${
        isDarkMode
          ? 'bg-[#141518]/80 border-white/10 text-white'
          : 'bg-white/80 border-black/5 text-neutral-900'
      } backdrop-blur-2xl`}
    >
      {/* Subtle Apple top edge reflection */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent pointer-events-none" />

      {/* Left: Brand Identity / Direct Chat Info / Group Chat Info */}
      <div className="flex items-center gap-2.5 min-w-0">
        {activeGroup ? (
          /* Group Chat Header View */
          <div className="flex items-center gap-2.5 min-w-0">
            {onLeaveGroupChat && (
              <button
                type="button"
                onClick={onLeaveGroupChat}
                className="p-1.5 rounded-full hover:bg-neutral-200/80 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 active:scale-90 transition-all cursor-pointer"
                title="Back to Global Chat"
                aria-label="Back to Global Chat"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
              </button>
            )}

            {groupAvatar && (
              <UserAvatar avatar={groupAvatar} size="sm" />
            )}

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base tracking-tight truncate">
                  {activeGroup.name}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-500 flex items-center gap-1">
                  <Users className="w-2.5 h-2.5 stroke-[2.5]" />
                  <span>Group</span>
                </span>
              </div>
              <span className="text-[10px] text-neutral-400">
                {activeGroup.members.length} {activeGroup.members.length === 1 ? 'member' : 'members'} • Tap for info
              </span>
            </div>
          </div>
        ) : activePrivateChat ? (
          /* Direct 1-on-1 Chat Mode Header */
          <div className="flex items-center gap-2.5 min-w-0">
            {onLeavePrivateChat && (
              <button
                type="button"
                onClick={onLeavePrivateChat}
                className="p-1.5 rounded-full hover:bg-neutral-200/80 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 active:scale-90 transition-all cursor-pointer"
                title="Back to Global Chat"
                aria-label="Back to Global Chat"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
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
                <span className="font-bold text-sm sm:text-base tracking-tight truncate">
                  {activePrivateChat.partnerName}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                  <span>Direct</span>
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isPartnerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                  }`}
                />
                <span>{isPartnerOnline ? 'Active in chat' : 'Direct conversation'}</span>
              </span>
            </div>
          </div>
        ) : (
          /* Global Room Brand Header */
          <div className="flex items-center gap-2.5">
            <BanterLogo className="w-8 h-8 shrink-0 drop-shadow-xs" />
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight leading-none">
                  Banter
                </span>
              </div>
              {hasTypers && (
                <span className="text-[11px] text-blue-500 font-semibold tracking-tight mt-0.5 flex items-center gap-1.5 animate-in fade-in">
                  <span>{typerLabel}</span>
                  <span className="inline-flex gap-0.5 items-center">
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-bounce [animation-delay:0s]" />
                  </span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Controls: Online Users, Friends Center, Theme, User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Info button if in Group Chat Mode */}
        {activeGroup && onOpenGroupInfo && (
          <button
            type="button"
            onClick={onOpenGroupInfo}
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
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
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-neutral-100/90 dark:bg-neutral-800/90 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 active:scale-95 transition-all cursor-pointer shadow-2xs"
            title="Return to Global Public Chat"
          >
            <span>Exit {activeGroup ? 'Group' : 'Direct'}</span>
          </button>
        )}

        {/* Online Count: Green Dot + Number with Apple Pill */}
        <button
          type="button"
          onClick={onOpenOnlineUsers}
          className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all active:scale-95 shadow-2xs ${
            isOffline
              ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
          }`}
          title={`${onlineCount} online. Click to see list of online users.`}
          aria-label="View online users"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOffline ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
            }`}
          />
          <span>{onlineCount}</span>
        </button>

        {/* Friends & Groups Center Trigger Button */}
        {onOpenFriends && (
          <button
            type="button"
            onClick={onOpenFriends}
            className={`p-2 rounded-xl transition-all cursor-pointer relative active:scale-95 ${
              pendingRequestsCount > 0
                ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
                : isDarkMode
                ? 'text-neutral-300 hover:text-white hover:bg-white/10'
                : 'text-neutral-600 hover:text-black hover:bg-black/5'
            }`}
            title={`Friends & Groups Center (${friendsCount} friends${pendingRequestsCount > 0 ? `, ${pendingRequestsCount} requests` : ''})`}
            aria-label="Open friends & groups center"
          >
            <Users className="w-4 h-4 stroke-[2.2]" />
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-900 animate-pulse" />
            )}
          </button>
        )}

        {/* Theme Switcher Button */}
        {onToggleDarkMode && (
          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
              isDarkMode
                ? 'text-neutral-300 hover:text-white hover:bg-white/10'
                : 'text-neutral-600 hover:text-black hover:bg-black/5'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 stroke-[2.2]" /> : <Moon className="w-4 h-4 stroke-[2.2]" />}
          </button>
        )}

        {/* User Profile Button: Expand-on-hover */}
        <button
          onClick={onOpenSettings}
          className={`group p-2 hover:px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer overflow-hidden active:scale-95 ${
            isDarkMode
              ? 'text-neutral-300 hover:text-white hover:bg-white/10'
              : 'text-neutral-600 hover:text-black hover:bg-black/5'
          }`}
          title={`Signed in as ${userName || 'You'}. Click to customize profile and avatar.`}
          aria-label="User settings"
        >
          <User className="w-4 h-4 stroke-[2.2] shrink-0" />
          <span className="max-w-0 group-hover:max-w-[130px] transition-all duration-300 overflow-hidden whitespace-nowrap opacity-0 group-hover:opacity-100 font-medium">
            {userName || 'You'}
          </span>
        </button>
      </div>
    </header>
  );
};
