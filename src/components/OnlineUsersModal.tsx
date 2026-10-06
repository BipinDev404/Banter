import React, { useEffect } from 'react';
import { X, Lock, UserPlus, UserCheck, Sparkles } from 'lucide-react';
import { AvatarProfile } from '../lib/avatars';
import { UserAvatar } from './UserAvatar';

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
  isFriend?: (sessionId: string) => boolean;
  onSendFriendRequest?: (sessionId: string, userName: string, avatarId?: string) => void;
  isDarkMode?: boolean;
}

export const OnlineUsersModal: React.FC<OnlineUsersModalProps> = ({
  isOpen,
  onClose,
  users = [],
  onRequestPrivateChat,
  isFriend,
  onSendFriendRequest,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="online-users-title"
        className={`relative z-10 w-full max-w-sm rounded-[32px] border shadow-2xl p-5 overflow-hidden animate-in zoom-in-95 duration-150 transition-all ${
          isDarkMode
            ? 'bg-[#18191D]/95 border-white/10 text-white'
            : 'bg-white/95 border-black/10 text-neutral-900'
        } backdrop-blur-2xl`}
      >
        {/* Apple subtle top light catching highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10 mb-3">
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
            className={`p-1.5 rounded-full transition-colors cursor-pointer active:scale-90 ${
              isDarkMode
                ? 'text-neutral-400 hover:text-white hover:bg-white/10'
                : 'text-neutral-500 hover:text-black hover:bg-black/5'
            }`}
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User List with Apple Vector Avatars */}
        <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1 -mr-1">
          {users.length === 0 ? (
            <div className="py-8 text-center text-neutral-400 text-xs font-medium">
              No users currently online
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.sessionId}
                className={`flex items-center justify-between p-2.5 rounded-2xl transition-all border ${
                  user.isSelf
                    ? isDarkMode
                      ? 'bg-neutral-800/70 border-white/10'
                      : 'bg-blue-50/70 border-blue-100/80 shadow-2xs'
                    : isDarkMode
                    ? 'bg-white/5 border-transparent hover:bg-white/10'
                    : 'bg-black/2 border-transparent hover:bg-black/5'
                }`}
              >
                {/* Left: Avatar + Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <UserAvatar avatar={user.avatar} size="sm" isOnline={true} showOnlineBadge={true} />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold truncate text-neutral-900 dark:text-neutral-100">
                        {user.userName}
                      </span>
                      {user.isSelf && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#007AFF] text-white">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-400">
                      Active now
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                {user.isSelf ? (
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0 mr-1" />
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {isFriend?.(user.sessionId) ? (
                      <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-500/10">
                        <UserCheck className="w-3 h-3 stroke-[2.5]" />
                        <span className="hidden sm:inline">Friend</span>
                      </span>
                    ) : (
                      onSendFriendRequest && (
                        <button
                          type="button"
                          onClick={() => onSendFriendRequest(user.sessionId, user.userName, user.avatar.id)}
                          className="p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 active:scale-90 transition-all cursor-pointer"
                          title={`Add ${user.userName} as friend`}
                        >
                          <UserPlus className="w-3.5 h-3.5 stroke-[2.2]" />
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onRequestPrivateChat?.(user.sessionId, user.userName);
                        onClose();
                      }}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0071E3] active:scale-95 text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                      title={`Direct message ${user.userName}`}
                    >
                      <Lock className="w-3 h-3 stroke-[2.2]" />
                      <span>Message</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer info note */}
        <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10 text-center">
          <p className="text-[11px] text-neutral-400 font-medium">
            Active participants in chat room
          </p>
        </div>
      </div>
    </div>
  );
};
