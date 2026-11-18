import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Users, Check, Clock, X } from 'lucide-react';
import { GroupItem } from '../types';
import { getGroupAvatar } from '../lib/avatars';
import { UserAvatar } from './UserAvatar';

interface JoinLinkModalProps {
  isOpen: boolean;
  group: GroupItem | null;
  currentName: string;
  onJoin: (displayName: string) => Promise<void> | void;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const JoinLinkModal: React.FC<JoinLinkModalProps> = ({
  isOpen,
  group,
  currentName,
  onJoin,
  onClose,
  isDarkMode = true,
}) => {
  const [nameInput, setNameInput] = useState(currentName);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNameInput(currentName);
      setIsJoining(false);
    }
  }, [isOpen, currentName]);

  const groupAvatar = group ? getGroupAvatar(group.avatarId, group.name) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nameInput.trim() || currentName;
    if (!clean) return;
    setIsJoining(true);
    try {
      await onJoin(clean);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && group && groupAvatar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md select-none"
        >
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="join-link-title"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className={`relative z-10 w-full max-w-sm rounded-[28px] border shadow-2xl p-6 overflow-hidden transition-colors backdrop-blur-2xl ${
              isDarkMode
                ? 'bg-[#1c1c1e] border-white/10 text-white'
                : 'bg-white border-black/10 text-neutral-900 shadow-xl'
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <button
              type="button"
              onClick={onClose}
              className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors cursor-pointer ${
                isDarkMode
                  ? 'text-neutral-400 hover:text-white hover:bg-white/10'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-black/5'
              }`}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center mb-5">
              <div className="relative mb-3">
                <UserAvatar avatar={groupAvatar} size="xl" />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#007AFF] text-white flex items-center justify-center border-2 border-[#1c1c1e]">
                  <Link2 className="w-3.5 h-3.5" />
                </span>
              </div>
              <h3 id="join-link-title" className="text-lg font-bold tracking-tight">
                Join &ldquo;{group.name}&rdquo;
              </h3>
              <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
                {group.isTemporary ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Temporary Group Chat • Created by {group.creatorName}</span>
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5 text-[#007AFF]" />
                    <span>Group Chat • {group.members.length} members</span>
                  </>
                )}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Your Name in This Group
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={20}
                  placeholder="Enter your name..."
                  className={`w-full px-4 py-3 text-sm font-semibold rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#007AFF]/25 ${
                    isDarkMode
                      ? 'bg-[#2c2c2e] border-white/10 text-white placeholder-neutral-500'
                      : 'bg-neutral-100 border-black/5 text-neutral-900 placeholder-neutral-400'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex-1 py-2.5 px-4 rounded-2xl text-xs font-semibold border cursor-pointer ${
                    isDarkMode
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300'
                      : 'bg-black/5 hover:bg-black/10 border-black/10 text-neutral-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoining || !nameInput.trim()}
                  className="flex-[1.4] py-2.5 px-4 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{isJoining ? 'Joining...' : 'Join Chat'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
