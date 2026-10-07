import React from 'react';
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
  if (!isOpen || !data) return null;

  const avatar = getAvatarForUser(
    data.targetSessionId,
    data.targetUserName,
    data.targetAvatarId
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full max-w-sm rounded-[28px] border p-6 overflow-hidden animate-in zoom-in-95 duration-150 transition-all ${
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
          className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors cursor-pointer active:scale-90 ${
            isDarkMode
              ? 'text-neutral-400 hover:text-white hover:bg-white/10'
              : 'text-neutral-400 hover:text-neutral-900 hover:bg-black/5'
          }`}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Center Content */}
        <div className="flex flex-col items-center text-center mt-1">
          {/* Top Badge Icon */}
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-xs border ${
              data.type === 'accepted'
                ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
                : 'bg-blue-500/15 border-blue-500/25 text-[#007AFF]'
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
          <h3 className="text-lg font-bold tracking-tight mb-1">
            {data.type === 'incoming' && 'New Friend Request'}
            {data.type === 'sent' && 'Friend Request Sent'}
            {data.type === 'accepted' && 'You Are Now Friends!'}
          </h3>

          {/* Subtitle / User Card */}
          <div
            className={`p-3 rounded-2xl border flex items-center gap-3 my-3 w-full text-left ${
              isDarkMode
                ? 'bg-[#2c2c2e]/70 border-white/5'
                : 'bg-neutral-100 border-black/5'
            }`}
          >
            <UserAvatar avatar={avatar} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate">
                {data.targetUserName}
              </p>
              <p className="text-[11px] text-neutral-400 truncate">
                {data.type === 'incoming' && 'Sent you a friend request'}
                {data.type === 'sent' && 'Request pending approval'}
                {data.type === 'accepted' && 'Connected & ready to chat'}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-neutral-400 mb-5 leading-relaxed px-1">
            {data.type === 'incoming' &&
              `Would you like to accept ${data.targetUserName}'s friend request to chat together?`}
            {data.type === 'sent' &&
              `A friend request has been sent to ${data.targetUserName}. They will see a popup to connect.`}
            {data.type === 'accepted' &&
              `You and ${data.targetUserName} can now send messages anytime.`}
          </p>

          {/* Actions */}
          <div className="w-full flex items-center gap-2">
            {data.type === 'incoming' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onDecline?.();
                    onClose();
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 border ${
                    isDarkMode
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300'
                      : 'bg-black/5 hover:bg-black/10 border-black/5 text-neutral-700'
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
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#007AFF] hover:bg-[#0071E3] text-white transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Accept</span>
                </button>
              </>
            ) : data.type === 'accepted' && onStartChat ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className={`py-2.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 border ${
                    isDarkMode
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300'
                      : 'bg-black/5 hover:bg-black/10 border-black/5 text-neutral-700'
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
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#007AFF] hover:bg-[#0071E3] text-white transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>Chat Now</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#007AFF] hover:bg-[#0071E3] text-white transition-all cursor-pointer active:scale-95 shadow-md"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
