import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PrivateChatRequest } from '../types';
import { MessageSquare, Users, Check, UserPlus } from 'lucide-react';
import { getAvatarForUser, getGroupAvatar } from '../lib/avatars';
import { UserAvatar } from './UserAvatar';

interface PrivateChatConfirmationModalProps {
  isOpen: boolean;
  request: PrivateChatRequest | null;
  onAccept: () => void;
  onDecline: () => void;
  isDarkMode?: boolean;
}

export const PrivateChatConfirmationModal: React.FC<PrivateChatConfirmationModalProps> = ({
  isOpen,
  request,
  onAccept,
  onDecline,
  isDarkMode = true,
}) => {
  const senderAvatar = request
    ? getAvatarForUser(request.fromSessionId, request.fromUserName, request.fromAvatarId)
    : null;
  const isGroupInvite = request?.requestType === 'group';
  const groupAvatar =
    request && isGroupInvite
      ? getGroupAvatar(request.groupAvatarId, request.groupName || 'Group')
      : null;

  return (
    <AnimatePresence>
      {isOpen && request && senderAvatar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md select-none"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="private-req-title"
            initial={{ opacity: 0, scale: 0.95, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            className={`relative z-10 w-full max-w-sm rounded-[32px] border shadow-2xl p-5 sm:p-6 overflow-hidden transition-colors ${
              isDarkMode
                ? 'bg-[#1c1c1e] border-white/10 text-white'
                : 'bg-white border-black/10 text-neutral-900'
            } backdrop-blur-2xl`}
          >
            {/* Apple subtle top light catching highlight */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            {/* Top Icon Badge */}
            <div className="flex justify-center mb-3.5">
              {isGroupInvite && groupAvatar ? (
                <div className="relative">
                  <UserAvatar avatar={groupAvatar} size="lg" />
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#007AFF] text-white flex items-center justify-center border-2 border-[#1c1c1e]">
                    <Users className="w-3.5 h-3.5 stroke-[2.2]" />
                  </span>
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-[#007AFF]/15 text-[#007AFF] flex items-center justify-center shadow-xs border border-[#007AFF]/25">
                  <MessageSquare className="w-7 h-7 stroke-[2.2]" />
                </div>
              )}
            </div>

            {/* Modal Title */}
            <h3
              id="private-req-title"
              className={`text-lg font-bold text-center tracking-tight mb-1 ${
                isDarkMode ? 'text-white' : 'text-neutral-900'
              }`}
            >
              {isGroupInvite ? 'Group Invite Confirmation' : 'Private Chat Request'}
            </h3>

            {/* Request Details */}
            <div className="text-center mb-5">
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border my-2 ${
                  isDarkMode
                    ? 'bg-[#2c2c2e]/80 border-white/10 text-white'
                    : 'bg-neutral-100 border-black/5 text-neutral-900'
                }`}
              >
                <UserAvatar avatar={senderAvatar} size="xs" />
                <span className="text-xs font-bold">{request.fromUserName}</span>
              </div>

              {isGroupInvite ? (
                <p
                  className={`text-xs leading-relaxed max-w-xs mx-auto mt-1 ${
                    isDarkMode ? 'text-neutral-300' : 'text-neutral-600'
                  }`}
                >
                  invited you to join{' '}
                  <strong className={isDarkMode ? 'text-white' : 'text-neutral-900'}>
                    {request.groupName || 'a group'}
                  </strong>
                  .
                </p>
              ) : (
                <p
                  className={`text-xs leading-relaxed max-w-xs mx-auto mt-1 ${
                    isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  wants to start a direct 1-on-1 conversation with you.
                </p>
              )}

              <div className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-full bg-emerald-500/12 text-emerald-500 dark:text-emerald-400 text-[11px] font-semibold">
                <UserPlus className="w-3 h-3 stroke-[2.3]" />
                <span>Accepting automatically adds as friend</span>
              </div>
            </div>

            {/* Actions - Touch targets optimized for phone screens (min-h-[44px]) */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onDecline}
                className={`flex-1 min-h-[44px] py-2.5 px-4 rounded-2xl text-xs font-semibold border transition-all cursor-pointer active:scale-[0.98] ${
                  isDarkMode
                    ? 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300'
                    : 'bg-black/5 hover:bg-black/10 border-black/10 text-neutral-700'
                }`}
              >
                Decline
              </button>
              <button
                type="button"
                onClick={onAccept}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-2xl text-xs font-bold bg-[#007AFF] hover:bg-[#0071E3] text-white shadow-md transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{isGroupInvite ? 'Accept & Join' : 'Accept & Chat'}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
