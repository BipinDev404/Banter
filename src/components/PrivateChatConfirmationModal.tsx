import React from 'react';
import { PrivateChatRequest } from '../types';
import { Lock, Check } from 'lucide-react';
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
  isDarkMode = false,
}) => {
  if (!isOpen || !request) return null;

  const avatar = getAvatarForUser(request.fromSessionId, request.fromUserName, request.fromAvatarId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="private-req-title"
        className={`relative z-10 w-full max-w-sm rounded-[28px] border shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-150 transition-colors ${
          isDarkMode
            ? 'bg-[#18191D]/95 border-neutral-800 text-white'
            : 'bg-white/95 border-neutral-200 text-neutral-900'
        } backdrop-blur-xl`}
      >
        {/* Top Icon Badge */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-xs border border-blue-500/20">
            <Lock className="w-7 h-7 stroke-[2.2]" />
          </div>
        </div>

        {/* Modal Title */}
        <h3 id="private-req-title" className="text-lg font-bold text-center tracking-tight mb-1">
          Direct Chat Request
        </h3>

        {/* Request Details */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 my-2">
            <UserAvatar avatar={avatar} size="xs" />
            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              {request.fromUserName}
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs mx-auto mt-1">
            wants to start a direct 1-on-1 real-time conversation with you.
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
      </div>
    </div>
  );
};
