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
      className={`shrink-0 z-20 relative border-t transition-all ${
        isDarkMode
          ? 'bg-[#141518]/85 border-white/10 text-white'
          : 'bg-white/85 border-black/5 text-neutral-900'
      } backdrop-blur-2xl pb-safe ${
        isDragOver ? 'ring-2 ring-blue-500/50 bg-blue-500/5' : ''
      }`}
    >
      {/* Subtle Apple top edge reflection */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent pointer-events-none" />

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
          <div className="px-3.5 py-2 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <span>{errorMessage || fileError}</span>
            <button
              onClick={() => {
                if (onClearError) onClearError();
                setFileError(null);
              }}
              className="text-red-600 dark:text-red-400 ml-2 font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Pending Attachment Preview Banner */}
      {pendingAttachment && (
        <div className="max-w-3xl mx-auto px-4 pt-2.5">
          <div
            className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-150 ${
              isDarkMode
                ? 'bg-neutral-800/80 border-white/10 text-white'
                : 'bg-neutral-100/90 border-black/5 text-neutral-800 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {pendingAttachment.type === 'image' ? (
                <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-black/10 bg-black/5">
                  <img
                    src={pendingAttachment.url}
                    alt={pendingAttachment.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
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
              className="p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 transition-colors cursor-pointer"
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
          <div
            className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-150 ${
              isDarkMode
                ? 'bg-blue-950/40 border-blue-800/60 text-white'
                : 'bg-blue-50/90 border-blue-200/90 text-neutral-900 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                <Reply className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-blue-500 truncate">
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
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer"
              title="Cancel reply"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Processing Loader Indicator */}
      {isProcessingFile && (
        <div className="max-w-3xl mx-auto px-4 pt-2 text-xs text-blue-500 font-medium flex items-center gap-1.5 animate-in fade-in">
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
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all select-none shrink-0 cursor-pointer shadow-xs active:scale-90 ${
            isDarkMode
              ? 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
              : 'bg-[#E9E9EB] text-neutral-700 hover:text-neutral-900 hover:bg-neutral-300'
          }`}
          title="Add photo or file"
          aria-label="Add photo or file"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Capsule Input Field */}
        <div
          className={`flex-1 rounded-[22px] px-4 py-2 flex items-center min-h-[42px] transition-all border ${
            isDarkMode
              ? 'bg-neutral-800/90 border-white/10 text-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
              : 'bg-[#E9E9EB]/90 border-transparent text-neutral-900 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-400/20 shadow-xs'
          }`}
        >
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
                : 'Message...'
            }
            maxLength={2000}
            className="w-full bg-transparent text-[15px] focus:outline-none placeholder-neutral-400 font-normal tracking-[-0.015em]"
            autoComplete="off"
            autoCorrect="on"
          />
        </div>

        {/* Circular Upward Arrow Send Button */}
        <button
          type="submit"
          disabled={!hasContent || disabled || isSending || isProcessingFile}
          style={
            hasContent && !disabled && !isSending && !isProcessingFile
              ? { backgroundColor: themeOption.hex }
              : undefined
          }
          className={`w-9 h-9 rounded-full flex items-center justify-center select-none shrink-0 shadow-sm transition-all duration-150 cursor-pointer ${
            hasContent && !disabled && !isSending && !isProcessingFile
              ? 'text-white hover:brightness-105 active:scale-90'
              : isDarkMode
              ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
          }`}
          aria-label="Send message"
        >
          <ArrowUp className="w-5 h-5 stroke-[3]" />
        </button>
      </form>
    </div>
  );
};
