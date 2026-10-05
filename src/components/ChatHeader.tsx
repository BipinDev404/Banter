import React from 'react';
import { Sun, Moon, User, Lock, ArrowLeft } from 'lucide-react';
import { BanterLogo } from './BanterLogo';
import { TypingUser, PrivateChatRoom } from '../types';

interface ChatHeaderProps {
  onlineCount: number;
  isOffline?: boolean;
  userName: string;
  onOpenSettings: () => void;
  onOpenOnlineUsers?: () => void;
  typingUsers?: TypingUser[];
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  activePrivateChat?: PrivateChatRoom | null;
  onLeavePrivateChat?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onlineCount,
  isOffline = false,
  userName = 'You',
  onOpenSettings,
  onOpenOnlineUsers,
  typingUsers = [],
  isDarkMode = false,
  onToggleDarkMode,
  activePrivateChat,
  onLeavePrivateChat,
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

  return (
    <header
      className={`px-4 sm:px-8 py-3 flex items-center justify-between border-b shrink-0 select-none z-20 sticky top-0 transition-colors ${
        isDarkMode
          ? 'bg-[#141518]/90 border-neutral-800/80 text-white'
          : 'bg-white/90 border-neutral-200/80 text-neutral-900'
      } backdrop-blur-xl`}
    >
      {/* Left: Brand Identity / Private Chat Title */}
      <div className="flex items-center gap-2.5">
        <BanterLogo className="w-8 h-8 shrink-0 drop-shadow-xs" />
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl tracking-tight leading-none">
              Banter
            </span>
            {activePrivateChat && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-500 flex items-center gap-1.5 animate-in fade-in">
                <Lock className="w-3 h-3 stroke-[2.5]" />
                <span>Private with {activePrivateChat.partnerName}</span>
              </span>
            )}
          </div>
          {hasTypers && !activePrivateChat && (
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

      {/* Right Controls: Exit Private, Green Online Number, Theme Toggle, Expand-on-hover User Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Leave Private Chat Button */}
        {activePrivateChat && onLeavePrivateChat && (
          <button
            type="button"
            onClick={onLeavePrivateChat}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 cursor-pointer transition-all active:scale-95 shadow-2xs"
            title="Leave private chat and return to Global Chat"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Exit Private</span>
          </button>
        )}
        {/* Online Count: Clickable Green Dot + Number Only */}
        <button
          type="button"
          onClick={onOpenOnlineUsers}
          className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95 ${
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

        {/* Theme Switcher Button */}
        {onToggleDarkMode && (
          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDarkMode
                ? 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}

        {/* User Profile Button: Compact like theme button, expands full on hover */}
        <button
          onClick={onOpenSettings}
          className={`group p-2 hover:px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer overflow-hidden ${
            isDarkMode
              ? 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
          }`}
          title={`Signed in as ${userName || 'You'}. Click to change settings.`}
          aria-label="User settings"
        >
          <User className="w-4 h-4 shrink-0" />
          <span className="max-w-0 group-hover:max-w-[130px] transition-all duration-300 overflow-hidden whitespace-nowrap opacity-0 group-hover:opacity-100 font-medium">
            {userName || 'You'}
          </span>
        </button>
      </div>
    </header>
  );
};
