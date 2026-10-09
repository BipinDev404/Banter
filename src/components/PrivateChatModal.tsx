import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, ChatAttachment, PrivateChatRoom } from '../types';
import { getAvatarForUser } from '../lib/avatars';
import { X, MessageSquare, Plus, ArrowUp, Loader2, LogOut, Shield } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { processImageAttachment, processFileAttachment, formatFileSize } from '../lib/attachments';
import { UserAvatar } from './UserAvatar';

interface PrivateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: PrivateChatRoom | null;
  messages: ChatMessage[];
  onSendMessage: (
    text: string,
    attachment?: ChatAttachment,
    replyTo?: { userName: string; snippet: string }
  ) => Promise<boolean>;
  onReact: (messageId: string, emoji: string) => void;
  currentUserId: string;
  currentUserName: string;
  isDarkMode?: boolean;
}

export const PrivateChatModal: React.FC<PrivateChatModalProps> = ({
  isOpen,
  onClose,
  room,
  messages = [],
  onSendMessage,
  onReact,
  currentUserId,
  currentUserName,
  isDarkMode = false,
}) => {
  const [text, setText] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{ userName: string; snippet?: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const partnerAvatar = room ? getAvatarForUser(room.partnerSessionId, room.partnerName, room.partnerAvatarId) : null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsProcessingFile(true);

    try {
      let attachment: ChatAttachment;
      if (file.type.startsWith('image/')) {
        attachment = await processImageAttachment(file);
      } else {
        attachment = await processFileAttachment(file);
      }
      setPendingAttachment(attachment);
    } catch (err) {
      console.error('File process error:', err);
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if ((!trimmed && !pendingAttachment) || isSending || isProcessingFile) return;

    inputRef.current?.focus();

    const replyData = replyTarget
      ? { userName: replyTarget.userName, snippet: replyTarget.snippet || '' }
      : undefined;

    setIsSending(true);
    const success = await onSendMessage(trimmed, pendingAttachment || undefined, replyData);
    setIsSending(false);

    if (success) {
      setText('');
      setPendingAttachment(null);
      setReplyTarget(null);
      inputRef.current?.focus();
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  };

  const handleReplyTo = (userName: string, textSnippet: string) => {
    setReplyTarget({ userName, snippet: textSnippet });
  };

  return (
    <AnimatePresence>
      {isOpen && room && partnerAvatar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-black/70 backdrop-blur-md select-none"
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt,.zip"
            className="hidden"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className={`relative z-10 w-full max-w-xl h-full sm:h-[90vh] sm:rounded-[32px] flex flex-col overflow-hidden shadow-2xl border transition-colors ${
              isDarkMode
                ? 'bg-[#121316] border-neutral-800 text-white'
                : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
        {/* Private Chat Header */}
        <div
          className={`px-4 py-3.5 border-b flex items-center justify-between shrink-0 select-none ${
            isDarkMode
              ? 'bg-[#1A1B20]/90 border-neutral-800'
              : 'bg-neutral-50/95 border-neutral-200/80'
          } backdrop-blur-xl`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar avatar={partnerAvatar} size="md" isOnline={true} showOnlineBadge={true} />

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold truncate tracking-tight">
                  {room.partnerName}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 flex items-center gap-1 border border-blue-500/20">
                  <MessageSquare className="w-3 h-3 stroke-[2.5]" />
                  <span>Chat</span>
                </span>
              </div>
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-500" />
                <span>1-on-1 Encrypted Session</span>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
              isDarkMode
                ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                : 'bg-neutral-200/80 text-neutral-700 hover:bg-neutral-300'
            }`}
            title="Leave Private Chat"
          >
            <LogOut className="w-4 h-4 stroke-[2.2]" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>

        {/* Private Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          <div className="min-h-full flex flex-col justify-end space-y-3">
            {messages.length === 0 ? (
              <div className="flex-1" />
            ) : (
              <div className="mt-auto flex flex-col space-y-3">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isSelf={msg.userId === currentUserId}
                    onReact={onReact}
                    onReplyTo={handleReplyTo}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Pending Attachment Banner */}
        {pendingAttachment && (
          <div className="px-4 pt-2">
            <div
              className={`p-2 rounded-2xl border flex items-center justify-between gap-3 ${
                isDarkMode ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-100 border-neutral-200 text-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-semibold truncate">{pendingAttachment.name}</span>
                <span className="text-[10px] text-neutral-400">{formatFileSize(pendingAttachment.size)}</span>
              </div>
              <button
                type="button"
                onClick={() => setPendingAttachment(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Reply Target Banner */}
        {replyTarget && (
          <div className="px-4 pt-2">
            <div
              className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 ${
                isDarkMode ? 'bg-blue-950/40 border-blue-800/60 text-white' : 'bg-blue-50 border-blue-200 text-neutral-900'
              }`}
            >
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-blue-500">Replying to {replyTarget.userName}</span>
                {replyTarget.snippet && <span className="text-xs text-neutral-400 truncate italic">&ldquo;{replyTarget.snippet}&rdquo;</span>}
              </div>
              <button
                type="button"
                onClick={() => setReplyTarget(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-3.5 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || isProcessingFile}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer ${
              isDarkMode ? 'bg-neutral-800 text-neutral-300 hover:text-white' : 'bg-neutral-200 text-neutral-700 hover:text-neutral-900'
            }`}
            title="Attach file or photo"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Message ${room.partnerName}...`}
            className={`flex-1 rounded-full px-4 py-2 text-sm focus:outline-none transition-colors border ${
              isDarkMode
                ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500 focus:border-blue-500'
                : 'bg-neutral-100 border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-blue-500'
            }`}
          />

          <button
            type="submit"
            onMouseDown={(e) => e.preventDefault()}
            disabled={(!text.trim() && !pendingAttachment) || isSending || isProcessingFile}
            className="w-9 h-9 rounded-full bg-[#007AFF] hover:bg-[#0071E3] text-white flex items-center justify-center disabled:opacity-40 transition-all cursor-pointer shadow-xs active:scale-90"
          >
            {isProcessingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4.5 h-4.5 stroke-[3]" />}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
  );
};
