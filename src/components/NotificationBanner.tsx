import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, ArrowRight, UserPlus, Sparkles } from 'lucide-react';
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

  return (
    <div className="fixed top-3 left-0 right-0 z-50 flex justify-center px-3 sm:px-4 pointer-events-none select-none">
      <AnimatePresence>
        {notification && (
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
                  avatarId={notification.avatarId}
                  name={notification.userName}
                  size="md"
                  showStatus={true}
                  status="online"
                />
                {notification.isFriend && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center text-[9px] font-bold shadow-xs">
                    ★
                  </span>
                )}
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold truncate">
                    {notification.userName}
                  </span>
                  {notification.isFriend && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                      Friend
                    </span>
                  )}
                  {notification.type === 'direct' && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 shrink-0">
                      Direct
                    </span>
                  )}
                  <span className="text-[10px] text-neutral-400 ml-auto shrink-0">
                    Just now
                  </span>
                </div>
                <p className="text-xs text-neutral-300 dark:text-neutral-300 line-clamp-1 font-normal break-words mt-0.5">
                  {notification.body}
                </p>
              </div>
            </div>

            {/* Action & Close */}
            <div className="flex items-center gap-1 shrink-0 ml-1">
              {notification.onAction && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    notification.onAction?.();
                    onDismiss();
                  }}
                  className="px-2.5 py-1 rounded-full bg-[#007AFF] hover:bg-[#0071E3] text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <span>Reply</span>
                  <ArrowRight className="w-3 h-3" />
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
