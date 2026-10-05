import React, { useState, useEffect } from 'react';
import { ChatMessage } from '../types';
import { X, Reply, Copy, Edit2, Trash2, Check, Plus } from 'lucide-react';
import { TAPBACK_EMOJIS } from '../lib/avatars';

interface MessageActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: ChatMessage | null;
  isSelf: boolean;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onEdit: (newText: string) => void;
  onDelete: () => void;
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
  isDarkMode = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');

  useEffect(() => {
    if (message) {
      setEditText(message.message || '');
      setIsEditing(false);
      setCopied(false);
      setShowCustomInput(false);
      setCustomEmoji('');
    }
  }, [message]);

  if (!isOpen || !message) return null;

  const handleCopy = async () => {
    if (message.message) {
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

  const handleCustomEmojiSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (customEmoji.trim()) {
      onReact(customEmoji.trim());
      setCustomEmoji('');
      setShowCustomInput(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm rounded-3xl p-5 shadow-2xl border transition-all animate-in zoom-in-95 duration-200 ${
          isDarkMode
            ? 'bg-[#1C1D22] border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Chat Options
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Snippet Card */}
        <div
          className={`p-3.5 rounded-2xl mb-4 text-sm leading-relaxed border ${
            isDarkMode
              ? 'bg-neutral-900/90 border-neutral-800 text-neutral-200'
              : 'bg-neutral-50 border-neutral-200/80 text-neutral-800'
          }`}
        >
          <div className="text-[11px] font-semibold text-blue-500 mb-1">
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
                    ? 'bg-neutral-800 border-neutral-700 text-white'
                    : 'bg-white border-neutral-300 text-neutral-900'
                }`}
                autoFocus
              />
              <div className="flex items-center justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!editText.trim()}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.message || '(Image / Attachment)'}</p>
          )}
        </div>

        {/* Quick Reaction Bar & Custom Keyboard Emoji Picker */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center justify-around py-2 px-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
            {TAPBACK_EMOJIS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  onReact(t.emoji);
                  onClose();
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:scale-125 transition-transform cursor-pointer"
                title={t.label}
              >
                <span>{t.emoji}</span>
              </button>
            ))}
            {/* Custom Emoji Keyboard Button */}
            <button
              type="button"
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer shadow-2xs"
              title="Type custom emoji from keyboard"
            >
              <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Custom Keyboard Emoji Field */}
          {showCustomInput && (
            <form onSubmit={handleCustomEmojiSubmit} className="flex items-center gap-2 animate-in fade-in zoom-in-95">
              <input
                type="text"
                value={customEmoji}
                onChange={(e) => setCustomEmoji(e.target.value)}
                placeholder="Type or paste any emoji from keyboard..."
                className={`flex-1 px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode
                    ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500'
                    : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder-neutral-400'
                }`}
                autoFocus
              />
              <button
                type="submit"
                disabled={!customEmoji.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-xs"
              >
                React
              </button>
            </form>
          )}
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
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-colors cursor-pointer ${
                isDarkMode
                  ? 'hover:bg-neutral-800 text-neutral-200'
                  : 'hover:bg-neutral-100 text-neutral-700'
              }`}
            >
              <Reply className="w-4 h-4 text-blue-500" />
              <span>Reply to message</span>
            </button>

            {/* Copy Action */}
            {message.message && (
              <button
                onClick={handleCopy}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-colors cursor-pointer ${
                  isDarkMode
                    ? 'hover:bg-neutral-800 text-neutral-200'
                    : 'hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4 text-neutral-400" />
                )}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
              </button>
            )}

            {/* Edit Action (if self) */}
            {isSelf && message.message && (
              <button
                onClick={() => setIsEditing(true)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-colors cursor-pointer ${
                  isDarkMode
                    ? 'hover:bg-neutral-800 text-neutral-200'
                    : 'hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <Edit2 className="w-4 h-4 text-amber-500" />
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
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Message</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
