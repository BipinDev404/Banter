import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PrivateChatRequest } from '../types';
import { MessageSquare, Check } from 'lucide-react';
import { getAvatarForUser } from '../lib/avatars';
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
  const avatar = request ? getAvatarForUser(request.fromSessionId, request.fromUserName, request.fromAvatarId) : null;

  return (
    <AnimatePresence>
      {isOpen && request && avatar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="private-req-title"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className={`relative z-10 w-full max-w-sm rounded-[28px] border shadow-2xl p-6 overflow-hidden transition-colors ${
              isDarkMode
                ? 'bg-[#1c1c1e] border-white/10 text-white'
                : 'bg-white border-black/10 text-neutral-900'
            } backdrop-blur-2xl`}
          >
            {/* Apple subtle top light catching highlight */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            {/* Top Icon Badge */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-[#007AFF] flex items-center justify-center shadow-xs border border-blue-500/20">
                <MessageSquare className="w-7 h-7 stroke-[2.2]" />
              </div>
            </div>

            {/* Modal Title */}
            <h3 id="private-req-title" className="text-lg font-bold text-center tracking-tight mb-1">
              Chat Request
            </h3>

            {/* Request Details */}
            <div className="text-center mb-5">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border my-2 ${
                isDarkMode ? 'bg-[#2c2c2e] border-white/10 text-white' : 'bg-neutral-100 border-black/5 text-neutral-900'
              }`}>
                <UserAvatar avatar={avatar} size="xs" />
                <span className="text-xs font-bold">
                  {request.fromUserName}
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto mt-1">
                wants to start a conversation with you.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onDecline}
                className={`flex-1 py-2.5 px-4 rounded-2xl text-xs font-semibold border transition-colors cursor-pointer ${
                  isDarkMode
                    ? 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                    : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Decline
              </button>
              <button
                type="button"
                onClick={onAccept}
                className="flex-1 py-2.5 px-4 rounded-2xl text-xs font-semibold bg-[#007AFF] hover:bg-[#0071E3] text-white shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Accept Chat</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
