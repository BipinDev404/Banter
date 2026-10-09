import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '../types';
import { X, Reply, Copy, Edit2, Trash2, Check, UserPlus } from 'lucide-react';
import { TAPBACK_REACTIONS, renderReactionIcon } from '../lib/avatars';

interface MessageActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: ChatMessage | null;
  isSelf: boolean;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onEdit: (newText: string) => void;
  onDelete: () => void;
  isFriend?: boolean;
  onAddFriend?: () => void;
  isDarkMode?: boolean;
}

export const MessageActionsModal: React.FC<MessageActionsModalProps> = ({
  isOpen,
  onClose,
  message,
  isSelf,
  onReply,
  onReact,
  onEdit,
  onDelete,
  isFriend = false,
  onAddFriend,
  isDarkMode = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (message) {
      setEditText(message.message || '');
      setIsEditing(false);
      setCopied(false);
    }
  }, [message]);

  const handleCopy = async () => {
    if (message?.message) {
      try {
        await navigator.clipboard.writeText(message.message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onEdit(editText.trim());
      setIsEditing(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md select-none"
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className={`w-full max-w-sm rounded-[28px] p-5 shadow-2xl border transition-colors backdrop-blur-2xl relative overflow-hidden ${
              isDarkMode
                ? 'border-white/10 bg-[#1c1c1e] text-white'
                : 'border-black/10 bg-white text-neutral-900 shadow-xl'
            }`}
          >
            {/* Apple subtle top light catching highlight */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent pointer-events-none" />

            {/* Header with Title and Close Button */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/5 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Message Options
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Snippet Card */}
            <div
              className={`p-3.5 rounded-2xl mb-4 text-sm leading-relaxed border ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 text-neutral-200'
                  : 'bg-neutral-50 border-black/5 text-neutral-800'
              }`}
            >
              <div className="text-[11px] font-bold text-blue-500 mb-1">
                {message.userName || 'Anonymous'}
              </div>
              {isEditing ? (
                <div className="flex flex-col gap-2 mt-1">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className={`w-full p-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode
                        ? 'bg-neutral-800 border-white/10 text-white'
                        : 'bg-white border-neutral-300 text-neutral-900'
                    }`}
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={!editText.trim()}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 cursor-pointer shadow-xs active:scale-95"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap break-words">{message.message || '(Image / Attachment)'}</p>
              )}
            </div>

            {/* Quick Reaction Bar with Apple Pill Icons */}
            <div className="flex items-center justify-around py-2.5 px-2 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 mb-4 backdrop-blur-md">
              {TAPBACK_REACTIONS.map((t) => (
                <motion.button
                  key={t.id}
                  whileHover={{ scale: 1.3, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 400 }}
                  onClick={() => {
                    onReact(t.id);
                    onClose();
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:bg-white dark:hover:bg-white/15 shadow-2xs transition-colors"
                  title={t.name}
                >
                  {renderReactionIcon(t.id, 'text-xl')}
                </motion.button>
              ))}
            </div>

            {/* Action Buttons List */}
            {!isEditing && (
              <div className="flex flex-col gap-1.5">
                {/* Reply Action */}
                <button
                  onClick={() => {
                    onReply();
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all cursor-pointer active:scale-98 ${
                    isDarkMode
                      ? 'hover:bg-white/10 text-neutral-200'
                      : 'hover:bg-black/5 text-neutral-700'
                  }`}
                >
                  <Reply className="w-4 h-4 text-blue-500 stroke-[2.5]" />
                  <span>Reply to message</span>
                </button>

                {/* Copy Action */}
                {message.message && (
                  <button
                    onClick={handleCopy}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all cursor-pointer active:scale-98 ${
                      isDarkMode
                        ? 'hover:bg-white/10 text-neutral-200'
                        : 'hover:bg-black/5 text-neutral-700'
                    }`}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                    ) : (
                      <Copy className="w-4 h-4 text-neutral-400 stroke-[2.2]" />
                    )}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
                  </button>
                )}

                {/* Add Friend Action (if another user) */}
                {!isSelf && onAddFriend && !isFriend && (
                  <button
                    onClick={() => {
                      onAddFriend();
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all cursor-pointer active:scale-98 ${
                      isDarkMode
                        ? 'hover:bg-white/10 text-neutral-200'
                        : 'hover:bg-black/5 text-neutral-700'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 text-emerald-500 stroke-[2.2]" />
                    <span>Add {message.userName} as Friend</span>
                  </button>
                )}

                {/* Edit Action (if self) */}
                {isSelf && message.message && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all cursor-pointer active:scale-98 ${
                      isDarkMode
                        ? 'hover:bg-white/10 text-neutral-200'
                        : 'hover:bg-black/5 text-neutral-700'
                    }`}
                  >
                    <Edit2 className="w-4 h-4 text-amber-500 stroke-[2.2]" />
                    <span>Edit Message</span>
                  </button>
                )}

                {/* Delete Action (if self) */}
                {isSelf && (
                  <button
                    onClick={() => {
                      onDelete();
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-all cursor-pointer active:scale-98"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2.2]" />
                    <span>Delete Message</span>
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
