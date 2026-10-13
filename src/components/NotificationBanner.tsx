import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Reply, UserPlus, Sparkles } from 'lucide-react';
import { getAvatarForUser } from '../lib/avatars';
import { UserAvatar } from './UserAvatar';

export interface InAppPushNotification {
  id: string;
  title: string;
  body: string;
  userName: string;
  avatarId?: string;
  isFriend?: boolean;
  type?: 'message' | 'direct' | 'friend_request';
  onAction?: () => void;
}

interface NotificationBannerProps {
  notification: InAppPushNotification | null;
  onDismiss: () => void;
  isDarkMode?: boolean;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notification,
  onDismiss,
  isDarkMode = true,
}) => {
  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  const avatar = notification
    ? getAvatarForUser(undefined, notification.userName, notification.avatarId)
    : null;

  return (
    <div className="fixed top-3 left-0 right-0 z-50 flex justify-center px-3 sm:px-4 pointer-events-none select-none">
      <AnimatePresence>
        {notification && avatar && (
          <motion.div
            initial={{ opacity: 0, y: -45, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.94 }}
            transition={{ type: 'spring', damping: 24, stiffness: 380 }}
            className={`pointer-events-auto w-full max-w-md rounded-[24px] p-3.5 sm:p-4 shadow-2xl backdrop-blur-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              isDarkMode
                ? 'bg-[#1c1c1e]/95 border-white/15 text-white shadow-black/80'
                : 'bg-white/95 border-black/10 text-neutral-900 shadow-xl'
            }`}
            onClick={() => {
              if (notification.onAction) {
                notification.onAction();
              }
              onDismiss();
            }}
          >
            {/* Avatar & Message Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative shrink-0">
                <UserAvatar
                  avatar={avatar}
                  size="md"
                  showOnlineBadge={true}
                  isOnline={true}
                />
                {notification.isFriend && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center text-[9px] font-bold shadow-xs">
                    ★
                  </span>
                )}
              </div>

              <div className="flex flex-col justify-center min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-bold truncate leading-none">
                      {notification.userName}
                    </span>
                    {notification.isFriend && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0 leading-none flex items-center">
                        Friend
                      </span>
                    )}
                    {notification.type === 'direct' && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 shrink-0 leading-none flex items-center">
                        Direct
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-[10.5px] font-medium text-neutral-400 dark:text-neutral-400 shrink-0 self-center leading-none">
                    Just now
                  </span>
                </div>
                <p className="text-xs text-neutral-300 dark:text-neutral-300 line-clamp-1 font-normal break-words mt-1 leading-tight">
                  {notification.body}
                </p>
              </div>
            </div>

            {/* Action & Close */}
            <div className="flex items-center gap-1.5 shrink-0 ml-1">
              {notification.onAction && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    notification.onAction?.();
                    onDismiss();
                  }}
                  className="w-8 h-8 rounded-full bg-[#007AFF] hover:bg-[#0071E3] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90 shrink-0"
                  title="Reply"
                  aria-label="Reply"
                >
                  <Reply className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
