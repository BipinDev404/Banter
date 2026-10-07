import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, X, Plus, FileText, Loader2, Reply } from 'lucide-react';
import { ChatAttachment } from '../types';
import { processImageAttachment, processFileAttachment, formatFileSize } from '../lib/attachments';
import { ThemeAccent, getThemeOption } from '../lib/settings';

interface MessageInputProps {
  onSendMessage: (
    text: string,
    attachment?: ChatAttachment,
    replyTo?: { userName: string; snippet: string }
  ) => Promise<boolean>;
  disabled?: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
  replyTarget?: { userName: string; snippet?: string } | null;
  onClearReply?: () => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  isDarkMode?: boolean;
  themeAccent?: ThemeAccent;
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
  themeAccent = 'blue',
}) => {
  const themeOption = getThemeOption(themeAccent);
  const [text, setText] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount or reply change
  useEffect(() => {
    inputRef.current?.focus();
  }, [replyTarget]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setFileError(null);
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
      setFileError(err instanceof Error ? err.message : 'Failed to attach file');
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
    if ((!trimmed && !pendingAttachment) || isSending || disabled || isProcessingFile) return;

    const replyData = replyTarget
      ? { userName: replyTarget.userName, snippet: replyTarget.snippet || '' }
      : undefined;

    setIsSending(true);
    const success = await onSendMessage(trimmed, pendingAttachment || undefined, replyData);
    setIsSending(false);

    if (success) {
      setText('');
      setPendingAttachment(null);
      setFileError(null);
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

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          setIsProcessingFile(true);
          try {
            const attachment = await processImageAttachment(file);
            setPendingAttachment(attachment);
          } catch (err) {
            console.error('Paste image error:', err);
          } finally {
            setIsProcessingFile(false);
          }
          break;
        }
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setFileError(null);
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
      console.error('File drop error:', err);
      setFileError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const hasContent = text.trim().length > 0 || pendingAttachment !== null;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`shrink-0 z-20 relative border-t transition-all backdrop-blur-2xl pb-safe ${
        isDarkMode
          ? 'bg-black/85 border-white/10 text-white'
          : 'bg-white/90 border-black/5 text-neutral-900'
      } ${
        isDragOver ? 'ring-2 ring-blue-500/50 bg-blue-500/10' : ''
      }`}
    >
      {/* Subtle Apple top edge reflection */}
      <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent ${isDarkMode ? 'via-white/20' : 'via-black/10'} to-transparent pointer-events-none`} />

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept="image/*,.pdf,.doc,.docx,.txt,.json,.zip,.mp3"
        className="hidden"
      />

      {/* Error notification if any */}
      {(errorMessage || fileError) && (
        <div className="max-w-3xl mx-auto px-4 mt-2">
          <div className="px-3.5 py-2 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <span>{errorMessage || fileError}</span>
            <button
              onClick={() => {
                if (onClearError) onClearError();
                setFileError(null);
              }}
              className="text-red-500 dark:text-red-400 ml-2 font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Pending Attachment Preview Banner */}
      {pendingAttachment && (
        <div className="max-w-3xl mx-auto px-4 pt-2.5">
          <div className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-150 ${
            isDarkMode
              ? 'border-white/10 bg-[#1c1c1e] text-white'
              : 'border-black/5 bg-neutral-100 text-neutral-900 shadow-sm'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              {pendingAttachment.type === 'image' ? (
                <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-black/40">
                  <img
                    src={pendingAttachment.url}
                    alt={pendingAttachment.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 stroke-[2.2]" />
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold truncate">
                  {pendingAttachment.name}
                </span>
                <span className="text-[11px] text-neutral-400">
                  {formatFileSize(pendingAttachment.size)} • {pendingAttachment.type === 'image' ? 'Photo' : 'File'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPendingAttachment(null)}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isDarkMode
                  ? 'hover:bg-white/10 text-neutral-400 hover:text-white'
                  : 'hover:bg-black/5 text-neutral-500 hover:text-black'
              }`}
              title="Remove attachment"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Active Reply Banner Preview */}
      {replyTarget && (
        <div className="max-w-3xl mx-auto px-4 pt-2.5">
          <div className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-150 ${
            isDarkMode
              ? 'border-blue-500/30 bg-blue-950/40 text-white'
              : 'border-blue-200 bg-blue-50/80 text-neutral-900 shadow-sm'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Reply className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-blue-500 dark:text-blue-400 truncate">
                  Replying to {replyTarget.userName}
                </span>
                {replyTarget.snippet && (
                  <span className="text-xs text-neutral-600 dark:text-neutral-300 truncate font-normal italic">
                    &ldquo;{replyTarget.snippet}&rdquo;
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClearReply}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isDarkMode
                  ? 'hover:bg-white/10 text-neutral-400 hover:text-white'
                  : 'hover:bg-black/5 text-neutral-500 hover:text-black'
              }`}
              title="Cancel reply"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Processing Loader Indicator */}
      {isProcessingFile && (
        <div className="max-w-3xl mx-auto px-4 pt-2 text-xs text-blue-500 dark:text-blue-400 font-medium flex items-center gap-1.5 animate-in fade-in">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Processing attachment...</span>
        </div>
      )}

      {/* Main Input Form */}
      <form
        onSubmit={handleSubmit}
        className="px-3 sm:px-4 py-2.5 flex items-center gap-2 relative max-w-3xl mx-auto w-full"
      >
        {/* Attachment Plus Button with Apple Spring Touch */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending || isProcessingFile}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all select-none shrink-0 cursor-pointer shadow-xs active:scale-90 border ${
            isDarkMode
              ? 'bg-[#1c1c1e] hover:bg-[#2c2c2e] border-white/10 text-neutral-300 hover:text-white'
              : 'bg-neutral-100 hover:bg-neutral-200 border-black/5 text-neutral-700 hover:text-black'
          } disabled:opacity-40`}
          title="Add photo or file"
          aria-label="Add photo or file"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Capsule Input Field */}
        <div className={`flex-1 rounded-full px-4 py-2 flex items-center min-h-[42px] transition-all border ${
          isDarkMode
            ? 'border-white/10 bg-[#1c1c1e] text-white focus-within:border-[#007AFF] focus-within:ring-2 focus-within:ring-[#007AFF]/25'
            : 'border-black/5 bg-neutral-100 text-neutral-900 focus-within:border-[#007AFF] focus-within:ring-2 focus-within:ring-[#007AFF]/25'
        }`}>
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
            onPaste={handlePaste}
            disabled={disabled || isSending}
            placeholder={
              replyTarget
                ? `Replying to ${replyTarget.userName}...`
                : pendingAttachment
                ? 'Add a caption...'
                : disabled
                ? 'Reconnecting...'
                : 'Message'
            }
            maxLength={2000}
            className={`w-full bg-transparent text-[15px] focus:outline-none font-normal tracking-[-0.015em] ${
              isDarkMode ? 'text-white placeholder-neutral-500' : 'text-neutral-900 placeholder-neutral-400'
            }`}
            autoComplete="off"
            autoCorrect="on"
          />
        </div>

        {/* Circular Upward Arrow Send Button */}
        <button
          type="submit"
          disabled={!hasContent || disabled || isSending || isProcessingFile}
          className={`w-9 h-9 rounded-full flex items-center justify-center select-none shrink-0 shadow-md transition-all duration-150 cursor-pointer ${
            hasContent && !disabled && !isSending && !isProcessingFile
              ? 'bg-[#007AFF] text-white hover:bg-[#0071E3] active:scale-90'
              : isDarkMode
              ? 'bg-[#1c1c1e] border border-white/5 text-neutral-600 cursor-not-allowed opacity-50'
              : 'bg-neutral-200 border border-black/5 text-neutral-400 cursor-not-allowed opacity-50'
          }`}
          aria-label="Send message"
        >
          <ArrowUp className="w-5 h-5 stroke-[3]" />
        </button>
      </form>
    </div>
  );
};
