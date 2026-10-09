import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, UserCheck, MessageSquare, Check } from 'lucide-react';
import { getAvatarForUser } from '../lib/avatars';
import { UserAvatar } from './UserAvatar';

export type FriendAlertType = 'incoming' | 'sent' | 'accepted';

export interface FriendAlertData {
  type: FriendAlertType;
  targetSessionId?: string;
  targetUserName: string;
  targetAvatarId?: string;
  requestId?: string;
}

interface FriendAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: FriendAlertData | null;
  onAccept?: () => void;
  onDecline?: () => void;
  onStartChat?: () => void;
  isDarkMode?: boolean;
}

export const FriendAlertModal: React.FC<FriendAlertModalProps> = ({
  isOpen,
  onClose,
  data,
  onAccept,
  onDecline,
  onStartChat,
  isDarkMode = true,
}) => {
  const avatar = data
    ? getAvatarForUser(
        data.targetSessionId,
        data.targetUserName,
        data.targetAvatarId
      )
    : null;

  return (
    <AnimatePresence>
      {isOpen && data && avatar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md select-none"
        >
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            className={`relative z-10 w-full max-w-sm rounded-[32px] border p-5 sm:p-6 overflow-hidden transition-colors ${
              isDarkMode
                ? 'bg-[#1c1c1e] border-white/10 text-white shadow-2xl'
                : 'bg-white border-black/10 text-neutral-900 shadow-xl'
            } backdrop-blur-2xl`}
          >
            {/* Apple subtle top light catching highlight */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 p-2 rounded-full transition-colors cursor-pointer active:scale-90 ${
                isDarkMode
                  ? 'text-neutral-400 hover:text-white hover:bg-white/10'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-black/5'
              }`}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Center Content */}
            <div className="flex flex-col items-center text-center mt-0.5">
              {/* Top Badge Icon */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5 shadow-sm border ${
                  data.type === 'accepted'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500 dark:text-emerald-400'
                    : 'bg-[#007AFF]/15 border-[#007AFF]/30 text-[#007AFF]'
                }`}
              >
                {data.type === 'accepted' ? (
                  <UserCheck className="w-7 h-7 stroke-[2.2]" />
                ) : data.type === 'sent' ? (
                  <Check className="w-7 h-7 stroke-[2.5]" />
                ) : (
                  <UserPlus className="w-7 h-7 stroke-[2.2]" />
                )}
              </div>

              {/* Title */}
              <h3 className={`text-lg font-bold tracking-tight mb-1 ${
                isDarkMode ? 'text-white' : 'text-neutral-900'
              }`}>
                {data.type === 'incoming' && 'New Friend Request'}
                {data.type === 'sent' && 'Friend Request Sent'}
                {data.type === 'accepted' && 'You Are Now Friends!'}
              </h3>

              {/* User Card */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center gap-3.5 my-3.5 w-full text-left ${
                  isDarkMode
                    ? 'bg-[#2c2c2e]/80 border-white/10 text-white'
                    : 'bg-neutral-100/90 border-black/5 text-neutral-900'
                }`}
              >
                <UserAvatar avatar={avatar} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate">
                    {data.targetUserName}
                  </p>
                  <p className={`text-[11px] truncate mt-0.5 ${
                    isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                  }`}>
                    {data.type === 'incoming' && 'Sent you a friend request'}
                    {data.type === 'sent' && 'Request pending approval'}
                    {data.type === 'accepted' && 'Connected & ready to chat'}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className={`text-xs mb-5 leading-relaxed px-1 ${
                isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
              }`}>
                {data.type === 'incoming' &&
                  `Would you like to accept ${data.targetUserName}'s request to connect and chat anytime?`}
                {data.type === 'sent' &&
                  `A friend request has been sent to ${data.targetUserName}. They will see a notification to accept.`}
                {data.type === 'accepted' &&
                  `You and ${data.targetUserName} can now exchange direct messages and invite each other to group chats.`}
              </p>

              {/* Actions - Touch targets optimized for phone screens (min-h-[44px]) */}
              <div className="w-full flex items-center gap-2.5">
                {data.type === 'incoming' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onDecline?.();
                        onClose();
                      }}
                      className={`flex-1 min-h-[44px] py-2.5 px-4 rounded-2xl text-xs font-semibold transition-all cursor-pointer active:scale-[0.98] border ${
                        isDarkMode
                          ? 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300'
                          : 'bg-black/5 hover:bg-black/10 border-black/10 text-neutral-700'
                      }`}
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onAccept?.();
                        onClose();
                      }}
                      className="flex-1 min-h-[44px] py-2.5 px-4 rounded-2xl text-xs font-bold bg-[#007AFF] hover:bg-[#0071E3] text-white transition-all cursor-pointer active:scale-[0.98] shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Accept Request</span>
                    </button>
                  </>
                ) : data.type === 'accepted' && onStartChat ? (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      className={`min-h-[44px] py-2.5 px-4 rounded-2xl text-xs font-semibold transition-all cursor-pointer active:scale-[0.98] border ${
                        isDarkMode
                          ? 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300'
                          : 'bg-black/5 hover:bg-black/10 border-black/10 text-neutral-700'
                      }`}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onStartChat();
                        onClose();
                      }}
                      className="flex-1 min-h-[44px] py-2.5 px-4 rounded-2xl text-xs font-bold bg-[#007AFF] hover:bg-[#0071E3] text-white transition-all cursor-pointer active:scale-[0.98] shadow-md flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-4 h-4 stroke-[2.2]" />
                      <span>Start Chat</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl text-xs font-bold bg-[#007AFF] hover:bg-[#0071E3] text-white transition-all cursor-pointer active:scale-[0.98] shadow-md"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
