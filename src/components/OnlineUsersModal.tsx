import React, { useEffect } from 'react';
import { X, Users, Sparkles, Lock } from 'lucide-react';
import { AvatarProfile } from '../lib/avatars';

export interface OnlineUserItem {
  sessionId: string;
  userName: string;
  isSelf: boolean;
  avatar: AvatarProfile;
}

interface OnlineUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: OnlineUserItem[];
  onRequestPrivateChat?: (targetSessionId: string, targetUserName: string) => void;
  isDarkMode?: boolean;
}

export const OnlineUsersModal: React.FC<OnlineUsersModalProps> = ({
  isOpen,
  onClose,
  users = [],
  onRequestPrivateChat,
  isDarkMode = false,
}) => {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none animate-in fade-in duration-150">
      {/* Click outside to dismiss backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="online-users-title"
        className={`relative z-10 w-full max-w-sm rounded-[28px] border shadow-2xl p-5 overflow-hidden animate-in zoom-in-95 duration-150 transition-colors ${
          isDarkMode
            ? 'bg-[#18191D]/95 border-neutral-800 text-white'
            : 'bg-white/95 border-neutral-200 text-neutral-900'
        } backdrop-blur-xl`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800/80 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 id="online-users-title" className="text-base font-bold tracking-tight">
              Online Now
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {users.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              isDarkMode
                ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                : 'text-neutral-500 hover:text-black hover:bg-neutral-100'
            }`}
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User List */}
        <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1 -mr-1">
          {users.length === 0 ? (
            <div className="py-8 text-center text-neutral-400 text-xs">
              No users currently online
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.sessionId}
                className={`flex items-center justify-between p-2.5 rounded-2xl transition-colors border ${
                  user.isSelf
                    ? isDarkMode
                      ? 'bg-neutral-800/60 border-neutral-700/60'
                      : 'bg-blue-50/60 border-blue-100/80'
                    : isDarkMode
                    ? 'bg-neutral-900/40 border-transparent hover:bg-neutral-800/40'
                    : 'bg-neutral-50/60 border-transparent hover:bg-neutral-100/60'
                }`}
              >
                {/* Left: Avatar + Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full ${user.avatar.bgColor} border border-black/5 dark:border-white/10 flex items-center justify-center text-lg shrink-0 shadow-2xs`}
                  >
                    <span>{user.avatar.emoji}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold truncate text-neutral-900 dark:text-neutral-100">
                        {user.userName}
                      </span>
                      {user.isSelf && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#007AFF] text-white">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Active now</span>
                    </span>
                  </div>
                </div>

                {/* Right: Badge or Private Chat Button */}
                {user.isSelf ? (
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0 mr-1" />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onRequestPrivateChat?.(user.sessionId, user.userName);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0 ml-2"
                    title={`Send private chat request to ${user.userName}`}
                  >
                    <Lock className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>Private</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer info note */}
        <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 text-center">
          <p className="text-[11px] text-neutral-400 font-medium">
            Active participants in Banter chat
          </p>
        </div>
      </div>
    </div>
  );
};
