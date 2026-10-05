import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => Promise<boolean>;
  disabled?: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  errorMessage,
  onClearError,
}) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSending || disabled) return;

    setIsSending(true);
    const success = await onSendMessage(trimmed);
    setIsSending(false);

    if (success) {
      setText('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const charCount = text.length;
  const isNearLimit = charCount > 400;

  return (
    <div className="shrink-0 border-t border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md px-4 sm:px-6 py-3 pb-safe z-10">
      {errorMessage && (
        <div className="mb-2 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-center justify-between animate-in fade-in">
          <span>{errorMessage}</span>
          {onClearError && (
            <button
              onClick={onClearError}
              className="text-red-400 hover:text-red-200 ml-2 text-xs font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-4xl mx-auto relative">
        <div className="flex-1 relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (errorMessage && onClearError) onClearError();
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSending}
            placeholder={disabled ? "Offline..." : "Message..."}
            maxLength={500}
            className="w-full pl-4 pr-16 py-3 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm sm:text-base text-white placeholder-neutral-500 focus:outline-none transition-all disabled:opacity-50 tracking-[-0.011em]"
            autoComplete="off"
            autoCorrect="on"
          />

          {isNearLimit && (
            <span
              className={`absolute right-3.5 text-[11px] font-mono tabular-nums select-none ${
                charCount >= 490 ? 'text-red-400 font-bold' : 'text-neutral-400'
              }`}
            >
              {charCount}/500
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={!text.trim() || disabled || isSending}
          className="h-11 px-4 sm:px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-display font-bold text-sm tracking-tight flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0 select-none shadow-sm shadow-indigo-950/50"
          aria-label="Send message"
        >
          <span className="hidden sm:inline">Send</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
