import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, X } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => Promise<boolean>;
  disabled?: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
  replyTarget?: { userName: string; snippet?: string } | null;
  onClearReply?: () => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  isDarkMode?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  errorMessage,
  onClearError,
  replyTarget,
  onClearReply,
  onTyping,
  onStopTyping,
  isDarkMode = false,
}) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount or reply change
  useEffect(() => {
    inputRef.current?.focus();
  }, [replyTarget]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSending || disabled) return;

    const fullMessage = replyTarget
      ? `${replyTarget.userName} ${trimmed}`
      : trimmed;

    setIsSending(true);
    const success = await onSendMessage(fullMessage);
    setIsSending(false);

    if (success) {
      setText('');
      if (onStopTyping) onStopTyping();
      if (onClearReply) onClearReply();
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Backspace' && text === '' && replyTarget && onClearReply) {
      onClearReply();
    }
  };

  const hasContent = text.trim().length > 0;

  return (
    <div
      className={`shrink-0 z-20 transition-colors ${
        isDarkMode
          ? 'bg-[#141518]/90 border-neutral-800/80'
          : 'bg-white/95 border-neutral-200/80'
      } backdrop-blur-xl border-t pb-safe`}
    >
      {/* Error notification if any */}
      {errorMessage && (
        <div className="max-w-3xl mx-auto px-4 mt-2">
          <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center justify-between animate-in fade-in">
            <span>{errorMessage}</span>
            {onClearError && (
              <button
                onClick={onClearError}
                className="text-red-600 dark:text-red-400 ml-2 font-semibold cursor-pointer"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Input Form */}
      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 flex items-center gap-2.5 relative max-w-3xl mx-auto w-full"
      >
        {/* Capsule Input Field */}
        <div
          className={`flex-1 rounded-full px-4 py-2 flex items-center min-h-[42px] transition-colors border ${
            isDarkMode
              ? 'bg-neutral-800 border-neutral-700 text-white focus-within:border-blue-500'
              : 'bg-[#E9E9EB] border-transparent text-neutral-900 focus-within:border-blue-400 focus-within:bg-white shadow-2xs'
          }`}
        >
          {/* Active Reply Tag */}
          {replyTarget && (
            <div className="flex items-center gap-1.5 mr-2 bg-blue-500/15 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full text-[13px] font-bold select-none shrink-0">
              <span>{replyTarget.userName}</span>
              <button
                type="button"
                onClick={onClearReply}
                className="hover:opacity-75 cursor-pointer"
                title="Cancel reply"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          )}

          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => {
              const val = e.target.value;
              setText(val);
              if (val.trim().length > 0) {
                if (onTyping) onTyping();
              } else {
                if (onStopTyping) onStopTyping();
              }
              if (errorMessage && onClearError) onClearError();
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSending}
            placeholder={
              replyTarget
                ? `Replying to ${replyTarget.userName}...`
                : disabled
                ? 'Reconnecting...'
                : 'Message...'
            }
            maxLength={500}
            className="w-full bg-transparent text-[15px] focus:outline-none placeholder-neutral-400 font-normal tracking-[-0.015em]"
            autoComplete="off"
            autoCorrect="on"
          />
        </div>

        {/* Circular Upward Arrow Send Button */}
        <button
          type="submit"
          disabled={!hasContent || disabled || isSending}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all select-none shrink-0 shadow-xs cursor-pointer ${
            hasContent && !disabled && !isSending
              ? 'bg-[#007AFF] text-white hover:bg-[#0071E3] active:scale-90'
              : isDarkMode
              ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
          }`}
          aria-label="Send message"
        >
          <ArrowUp className="w-4.5 h-4.5 stroke-[3]" />
        </button>
      </form>
    </div>
  );
};
