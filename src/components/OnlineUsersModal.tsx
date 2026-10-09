import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, UserPlus, UserCheck, Sparkles } from 'lucide-react';
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
  isDarkMode = true,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md select-none"
        >
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="online-users-title"
            initial={{ opacity: 0, scale: 0.95, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            className={`relative z-10 w-full max-w-sm rounded-[32px] border shadow-2xl p-5 overflow-hidden transition-colors backdrop-blur-2xl ${
              isDarkMode
                ? 'border-white/10 bg-[#1c1c1e] text-white'
                : 'border-black/10 bg-white text-neutral-900 shadow-xl'
            }`}
          >
            {/* Apple subtle top light catching highlight */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            {/* Header */}
            <div className={`flex items-center justify-between pb-3 border-b mb-3 ${
              isDarkMode ? 'border-white/10' : 'border-black/5'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 id="online-users-title" className={`text-base font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                  Online Now
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 dark:text-emerald-300">
                  {users.length}
                </span>
              </div>

              <button
                onClick={onClose}
                className={`p-1.5 rounded-full transition-colors cursor-pointer active:scale-90 ${
                  isDarkMode
                    ? 'text-neutral-400 hover:text-white hover:bg-white/10'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-black/5'
                }`}
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User List */}
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
                          ? 'bg-[#2c2c2e] border-white/10'
                          : 'bg-neutral-100 border-black/5'
                        : isDarkMode
                        ? 'bg-white/5 border-transparent hover:bg-white/10'
                        : 'bg-neutral-50 border-black/5 hover:bg-neutral-100'
                    }`}
                  >
                    {/* Left: Avatar + Name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar avatar={user.avatar} size="sm" isOnline={true} showOnlineBadge={true} />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-semibold truncate ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
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
                      <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mr-1" />
                    ) : (
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {isFriend?.(user.sessionId) ? (
                          <span className="text-[11px] font-semibold text-emerald-500 dark:text-emerald-400 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15">
                            <UserCheck className="w-3 h-3 stroke-[2.5]" />
                            <span className="hidden sm:inline">Friend</span>
                          </span>
                        ) : (
                          onSendFriendRequest && (
                            <button
                              type="button"
                              onClick={() => onSendFriendRequest(user.sessionId, user.userName, user.avatar.id)}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold active:scale-95 transition-all flex items-center gap-1 cursor-pointer ${
                                isDarkMode
                                  ? 'bg-white/10 hover:bg-white/15 text-neutral-200'
                                  : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'
                              }`}
                              title="Send friend request"
                            >
                              <UserPlus className="w-3 h-3 stroke-[2]" />
                              <span>Add</span>
                            </button>
                          )
                        )}

                        {onRequestPrivateChat && (
                          <button
                            type="button"
                            onClick={() => onRequestPrivateChat(user.sessionId, user.userName)}
                            className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-[#007AFF] hover:bg-[#0071E3] text-white active:scale-95 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Start conversation"
                          >
                            <MessageSquare className="w-3 h-3 stroke-[2.2]" />
                            <span>Chat</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
