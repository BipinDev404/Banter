import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '../types';
import {
  X,
  Reply,
  Copy,
  Edit3,
  Trash2,
  Check,
  UserPlus,
  Info,
  Smile,
  Clock,
  CheckCheck,
  AlertTriangle,
  Heart,
  ThumbsUp,
  Flame,
  Sparkles,
} from 'lucide-react';
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

const EMOJI_CATEGORIES = [
  {
    name: 'Popular Reactions',
    id: 'popular',
    emojis: ['😂', '❤️', '👍', '🔥', '🎉', '👏', '🙌', '💯', '🥺', '😭', '😡', '🤩', '✨', '🚀', '😍', '🙏', '🤯', '😱'],
  },
  {
    name: 'Faces & Expressions',
    id: 'faces',
    emojis: ['😊', '🥰', '😍', '😎', '🤔', '🤣', '🥳', '🤤', '😋', '😴', '🥱', '😇', '🤪', '🤠', '🤫', '🤐', '🤭', '😏', '😬', '🤥'],
  },
  {
    name: 'Gestures & Hands',
    id: 'gestures',
    emojis: ['👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '🤙', '👊', '✊', '🤛', '🤜', '👈', '👉', '👆', '👇', '✋', '🖐️', '🤘', '🤟', '🙏'],
  },
  {
    name: 'Hearts & Vibes',
    id: 'hearts',
    emojis: ['❤️', '💖', '💗', '💓', '💞', '💘', '💝', '💟', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '💌', '🔥', '⭐', '🌟', '✨', '⚡', '💥'],
  },
  {
    name: 'Celebrations & Fun',
    id: 'fun',
    emojis: ['🎉', '🎊', '🎈', '🎂', '🥂', '🍻', '🏆', '🥇', '🎯', '💯', '🚀', '🍕', '🍔', '☕', '🎮', '🎵', '🎸', '🌈', '🍀', '☀️'],
  },
];

function formatFullDateTime(timestamp?: number): string {
  if (!timestamp) return 'Just now';
  try {
    const d = new Date(timestamp);
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'Recent';
  }
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
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAllEmojis, setShowAllEmojis] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('popular');
  const [showInfoDetails, setShowInfoDetails] = useState(false);

  useEffect(() => {
    if (message) {
      setEditText(message.message || '');
      setIsEditing(false);
      setIsConfirmingDelete(false);
      setCopied(false);
      setShowAllEmojis(false);
      setShowInfoDetails(false);
    }
  }, [message]);

  if (!isOpen || !message) return null;

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
    const trimmed = editText.trim();
    if (trimmed) {
      onEdit(trimmed);
      setIsEditing(false);
      onClose();
    }
  };

  const handleTriggerReact = (emoji: string) => {
    onReact(emoji);
    onClose();
  };

  const characterCount = message.message ? message.message.length : 0;
  const wordCount = message.message ? message.message.trim().split(/\s+/).filter(Boolean).length : 0;
  const activeEmojis = message.reactions || [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md select-none"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: 'spring', damping: 26, stiffness: 360 }}
          className={`w-full max-w-md rounded-[30px] p-5 sm:p-6 shadow-2xl border transition-colors backdrop-blur-2xl relative overflow-hidden max-h-[90vh] flex flex-col ${
            isDarkMode
              ? 'border-white/10 bg-[#1c1c1e]/98 text-white'
              : 'border-black/10 bg-white/98 text-neutral-900 shadow-xl'
          }`}
        >
          {/* Subtle top light highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/5 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Info className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Message Features & Options</h3>
                <span className="text-[10px] text-neutral-400 font-medium">
                  {isSelf ? 'Sent by you' : `From ${message.userName || 'Anonymous'}`}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 pr-1 space-y-4">
            {/* Message Snippet Card / Rename & Edit Box */}
            <div
              className={`p-3.5 rounded-2xl border text-sm leading-relaxed transition-all ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 text-neutral-200'
                  : 'bg-neutral-50 border-black/5 text-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-blue-500 mb-1.5">
                <span>{message.userName || 'Anonymous'}</span>
                <span className="text-neutral-400 font-normal text-[10px]">
                  {formatFullDateTime(message.createdAt)}
                </span>
              </div>

              {isEditing ? (
                /* Inline Rename / Edit Message Input */
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span className="font-semibold text-blue-500 flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5" />
                      Rename / Edit Message Text:
                    </span>
                    <span className="text-[10.5px] font-mono">{editText.length}/2000</span>
                  </div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    className={`w-full p-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed ${
                      isDarkMode
                        ? 'bg-neutral-800 border-white/10 text-white placeholder-neutral-500'
                        : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400'
                    }`}
                    placeholder="Enter updated message content..."
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer active:scale-95 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={!editText.trim()}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#007AFF] text-white hover:bg-[#0071E3] disabled:opacity-50 cursor-pointer shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      Save & Rename
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="whitespace-pre-wrap break-words font-normal">
                    {message.message || (message.attachment ? `[${message.attachment.type}] ${message.attachment.name}` : '(No text)')}
                  </p>
                  {message.attachment && (
                    <div className="mt-2 text-xs font-semibold text-blue-500 flex items-center gap-1">
                      <span>Attachment: {message.attachment.name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Emoji Reactions & Like Section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold tracking-wider uppercase text-neutral-400 flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-blue-500" />
                  Emoji Reactions & Likes
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllEmojis((prev) => !prev)}
                  className="text-xs font-bold text-[#007AFF] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  {showAllEmojis ? 'Simple Bar' : 'Browse All Emojis'}
                </button>
              </div>

              {/* Apple Pill Tapback Quick Bar */}
              <div className="flex items-center justify-around py-2 px-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-md">
                {TAPBACK_REACTIONS.map((t) => {
                  const isReacted = activeEmojis.includes(t.id) || activeEmojis.includes(t.emoji);
                  return (
                    <motion.button
                      key={t.id}
                      whileHover={{ scale: 1.25, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleTriggerReact(t.id)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                        isReacted
                          ? 'bg-blue-500/20 ring-2 ring-blue-500 shadow-xs'
                          : 'hover:bg-white dark:hover:bg-white/15'
                      }`}
                      title={t.name}
                    >
                      {renderReactionIcon(t.id, 'text-xl')}
                    </motion.button>
                  );
                })}
              </div>

              {/* Expandable Full Emoji Palette */}
              {showAllEmojis && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex flex-col gap-2.5"
                >
                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                    {EMOJI_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-full whitespace-nowrap font-semibold cursor-pointer transition-all ${
                          selectedCategory === cat.id
                            ? 'bg-[#007AFF] text-white shadow-xs'
                            : 'bg-black/5 dark:bg-white/10 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  {/* Emoji Grid */}
                  <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5 max-h-44 overflow-y-auto p-1">
                    {EMOJI_CATEGORIES.find((c) => c.id === selectedCategory)?.emojis.map((emoji, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleTriggerReact(emoji)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-lg hover:bg-white dark:hover:bg-white/15 hover:scale-125 active:scale-95 transition-all cursor-pointer"
                        title={`React with ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Delete Confirmation Box */}
            {isConfirmingDelete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 rounded-2xl border border-red-500/20 bg-red-500/10 flex flex-col gap-2.5"
              >
                <div className="flex items-center gap-2 text-red-500 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Delete message permanently?</span>
                </div>
                <p className="text-[11.5px] text-neutral-400">
                  This message will be removed from the chat for everyone.
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete();
                      onClose();
                    }}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Confirm Delete
                  </button>
                </div>
              </motion.div>
            )}

            {/* Action Buttons List */}
            {!isEditing && !isConfirmingDelete && (
              <div className="flex flex-col gap-1 pt-1">
                {/* 1. Reply Action */}
                <button
                  type="button"
                  onClick={() => {
                    onReply();
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-98 ${
                    isDarkMode
                      ? 'hover:bg-white/10 text-neutral-200'
                      : 'hover:bg-black/5 text-neutral-700'
                  }`}
                >
                  <Reply className="w-4 h-4 text-blue-500 stroke-[2.5]" />
                  <span>Reply to this message</span>
                </button>

                {/* 2. Copy Action */}
                {message.message && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-98 ${
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

                {/* 3. Rename / Edit Action (Author Only) */}
                {isSelf && message.message && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-98 ${
                      isDarkMode
                        ? 'hover:bg-white/10 text-neutral-200'
                        : 'hover:bg-black/5 text-neutral-700'
                    }`}
                  >
                    <Edit3 className="w-4 h-4 text-amber-500 stroke-[2.2]" />
                    <span>Rename / Edit Message</span>
                  </button>
                )}

                {/* 4. Delete Action (Author Only) */}
                {isSelf && (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-all cursor-pointer active:scale-98"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2.2]" />
                    <span>Delete Message</span>
                  </button>
                )}

                {/* 5. Add Friend Action (If other user) */}
                {!isSelf && onAddFriend && !isFriend && (
                  <button
                    type="button"
                    onClick={() => {
                      onAddFriend();
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-98 ${
                      isDarkMode
                        ? 'hover:bg-white/10 text-neutral-200'
                        : 'hover:bg-black/5 text-neutral-700'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 text-emerald-500 stroke-[2.2]" />
                    <span>Add {message.userName} as Friend</span>
                  </button>
                )}

                {/* 6. Toggle Message Details Info Card */}
                <button
                  type="button"
                  onClick={() => setShowInfoDetails((prev) => !prev)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-98 ${
                    isDarkMode
                      ? 'hover:bg-white/10 text-neutral-200'
                      : 'hover:bg-black/5 text-neutral-700'
                  }`}
                >
                  <Info className="w-4 h-4 text-neutral-400 stroke-[2.2]" />
                  <span>{showInfoDetails ? 'Hide Message Details' : 'Message Details & Info (i)'}</span>
                </button>
              </div>
            )}

            {/* Detailed Message Info Panel */}
            {showInfoDetails && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3.5 rounded-2xl border text-xs flex flex-col gap-2 ${
                  isDarkMode
                    ? 'bg-neutral-800/60 border-white/10 text-neutral-300'
                    : 'bg-neutral-100 border-black/5 text-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-2">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Sent Time
                  </span>
                  <span className="font-semibold text-right">{formatFullDateTime(message.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-2">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <CheckCheck className="w-3.5 h-3.5" /> Status
                  </span>
                  <span className="font-semibold text-blue-500">
                    {message.isOptimistic ? 'Sending...' : message.isRead ? 'Read' : 'Delivered'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Content Statistics</span>
                  <span className="font-mono text-[11px]">
                    {characterCount} chars • {wordCount} words
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
