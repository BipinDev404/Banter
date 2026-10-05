import React from 'react';
import { Sun, Moon, Settings, User, MessageSquare } from 'lucide-react';
import { TypingUser } from '../types';

interface ChatHeaderProps {
  onlineCount: number;
  isOffline?: boolean;
  userName: string;
  onOpenSettings: () => void;
  typingUsers?: TypingUser[];
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onlineCount,
  isOffline = false,
  userName = 'You',
  onOpenSettings,
  typingUsers = [],
  isDarkMode = false,
  onToggleDarkMode,
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
      {/* Left: Brand Identity with Simple Message Icon & Dynamic Typing Status */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#007AFF] text-white flex items-center justify-center shadow-xs shrink-0">
          <MessageSquare className="w-4.5 h-4.5 stroke-[2.2]" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-lg tracking-tight leading-none">
            Banter
          </span>
          {hasTypers ? (
            <span className="text-[11px] text-blue-500 font-semibold tracking-tight mt-0.5 flex items-center gap-1.5 animate-in fade-in">
              <span>{typerLabel}</span>
              <span className="inline-flex gap-0.5 items-center">
                <span className="w-1 h-1 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-1 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 h-1 rounded-full bg-blue-500 animate-bounce [animation-delay:0s]" />
              </span>
            </span>
          ) : (
            <span className="text-[11px] text-neutral-400 font-medium tracking-tight mt-0.5">
              Global Chat
            </span>
          )}
        </div>
      </div>

      {/* Right Controls: Online Status, Theme Toggle, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Online Badge */}
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
            isOffline
              ? 'bg-amber-500/10 text-amber-500'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}
          title={`${onlineCount} users online`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOffline ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
            }`}
          />
          <span>{onlineCount} online</span>
        </div>

        {/* Theme Switcher */}
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

        {/* User Profile & Settings */}
        <button
          onClick={onOpenSettings}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            isDarkMode
              ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}
          title={`Signed in as ${userName || 'You'}. Click to change settings.`}
          aria-label="User settings"
        >
          <User className="w-3.5 h-3.5" />
          <span className="max-w-[100px] truncate">{userName || 'You'}</span>
        </button>
      </div>
    </header>
  );
};
