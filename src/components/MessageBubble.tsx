import React, { useState, useRef } from 'react';
import { ChatMessage } from '../types';
import { getAvatarForUser, TAPBACK_EMOJIS } from '../lib/avatars';
import { Reply, FileText, Download, Maximize2, Smile, Plus } from 'lucide-react';
import { formatFileSize } from '../lib/attachments';

interface MessageBubbleProps {
  message: ChatMessage;
  isSelf: boolean;
  onReact: (messageId: string, emoji: string) => void;
  onReplyTo: (userName: string, textSnippet: string) => void;
  onOpenImage?: (url: string, name: string) => void;
  onOpenActionsModal?: (message: ChatMessage) => void;
  isDarkMode?: boolean;
  allParticipantNames?: string[];
  showTapbackPicker?: boolean;
  onToggleTapbackPicker?: () => void;
  onCloseTapbackPicker?: () => void;
}

function formatMessageTime(timestamp?: number): string {
  if (!timestamp) return '';
  try {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function extractReplyData(message: ChatMessage) {
  if (message.replyTo && message.replyTo.userName) {
    return {
      replyTo: message.replyTo,
      cleanText: message.message,
    };
  }

  // Legacy format check if text starts with Replying to...
  if (message.message && message.message.startsWith('Replying to ')) {
    const lines = message.message.split('\n');
    const firstLine = lines[0];
    const restText = lines.slice(1).join('\n');

    const match = firstLine.match(/Replying to ([^":]+)(?:\s*"([^"]+)")?:?/);
    if (match) {
      return {
        replyTo: {
          userName: match[1].trim(),
          snippet: match[2] || '',
        },
        cleanText: restText.trim() || message.message,
      };
    }
  }

  return { replyTo: null, cleanText: message.message };
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSelf,
  onReact,
  onReplyTo,
  onOpenImage,
  onOpenActionsModal,
  isDarkMode = false,
  allParticipantNames = [],
  showTapbackPicker: showTapbackPickerProp,
  onToggleTapbackPicker,
  onCloseTapbackPicker,
}) => {
  const [internalShowTapbackPicker, setInternalShowTapbackPicker] = useState(false);
  const [showFloatingCustomInput, setShowFloatingCustomInput] = useState(false);
  const [floatingCustomEmoji, setFloatingCustomEmoji] = useState('');
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const triggeredReplyRef = useRef(false);

  if (!message) return null;

  const showTapbackPicker =
    showTapbackPickerProp !== undefined ? showTapbackPickerProp : internalShowTapbackPicker;

  const togglePicker = () => {
    if (onToggleTapbackPicker) {
      onToggleTapbackPicker();
    } else {
      setInternalShowTapbackPicker((prev) => !prev);
    }
  };

  const closePicker = () => {
    setShowFloatingCustomInput(false);
    setFloatingCustomEmoji('');
    if (onCloseTapbackPicker) {
      onCloseTapbackPicker();
    } else {
      setInternalShowTapbackPicker(false);
    }
  };

  const safeUserName = message.userName || 'Anonymous';
  const avatar = getAvatarForUser(message.userId || safeUserName, safeUserName, message.avatarId);
  const formattedTime = formatMessageTime(message.createdAt);
  const attachment = message.attachment;

  // Long press handler: Holding for 350ms opens Message Options Modal (including on images & files)
  const startLongPress = (clientX: number, clientY: number) => {
    triggeredReplyRef.current = false;
    touchStartRef.current = { x: clientX, y: clientY };

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(25);
        } catch {}
      }
      onOpenActionsModal?.(message);
      touchStartRef.current = null;
    }, 350);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Touch Handlers for Slide-to-Reply and Long-Press
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startLongPress(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
      cancelLongPress();
    }

    // Horizontal slide gesture
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) < 130) {
      const clampedX = Math.max(-90, Math.min(90, deltaX));
      setDragX(clampedX);
      setIsDragging(true);

      if (Math.abs(clampedX) > 50 && !triggeredReplyRef.current) {
        triggeredReplyRef.current = true;
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(15);
          } catch {}
        }
      }
    }
  };

  const handleTouchEnd = () => {
    cancelLongPress();
    if (triggeredReplyRef.current || Math.abs(dragX) > 50) {
      onReplyTo(safeUserName, message.message || '');
    }
    setIsDragging(false);
    setDragX(0);
    touchStartRef.current = null;
  };

  // Mouse Handlers for Desktop Slide-to-Reply and Long-Press
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    startLongPress(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = e.clientX - touchStartRef.current.x;
    const deltaY = e.clientY - touchStartRef.current.y;

    if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
      cancelLongPress();
    }

    if (e.buttons === 1 && Math.abs(deltaX) > Math.abs(deltaY)) {
      const clampedX = Math.max(-90, Math.min(90, deltaX));
      setDragX(clampedX);
      setIsDragging(true);

      if (Math.abs(clampedX) > 50 && !triggeredReplyRef.current) {
        triggeredReplyRef.current = true;
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(15);
          } catch {}
        }
      }
    }
  };

  const handleMouseUp = () => {
    cancelLongPress();
    if (triggeredReplyRef.current || Math.abs(dragX) > 50) {
      onReplyTo(safeUserName, message.message || '');
    }
    setIsDragging(false);
    setDragX(0);
    touchStartRef.current = null;
  };

  const handleFloatingCustomSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (floatingCustomEmoji.trim()) {
      onReact(message.id, floatingCustomEmoji.trim());
      closePicker();
    }
  };

  // Helper to highlight participant names in bold
  const renderMessageContent = (text: string) => {
    if (!text) return null;

    const namesToHighlight = Array.from(
      new Set(['Danny', 'Alex', 'Sarah', 'Taylor', 'Sam', 'Marco', ...allParticipantNames])
    ).filter(Boolean);

    if (namesToHighlight.length === 0) {
      return text;
    }

    try {
      const pattern = new RegExp(`\\b(${namesToHighlight.join('|')})\\b`, 'gi');
      const parts = text.split(pattern);

      return parts.map((part, index) => {
        const match = namesToHighlight.find(
          (n) => n.toLowerCase() === part.toLowerCase()
        );
        if (match) {
          return (
            <strong key={index} className="font-bold tracking-tight">
              {part}
            </strong>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      });
    } catch {
      return text;
    }
  };

  const handleSelectReaction = (emoji: string) => {
    if (!message.id) return;
    onReact(message.id, emoji);
    closePicker();
  };

  const hasReactions = Array.isArray(message.reactions) && message.reactions.length > 0;
  const isSwipeTriggered = Math.abs(dragX) > 50;
  const { replyTo: quotedReply, cleanText } = extractReplyData(message);

  return (
    <div className={`flex flex-col relative group my-2.5 sm:my-3.5 select-none no-native-callout ${isSelf ? 'items-end' : 'items-start'}`}>
      {/* Floating Single Reaction Picker Box */}
      {showTapbackPicker && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute -top-12 z-30 flex flex-col items-center gap-1.5 p-1.5 rounded-2xl shadow-2xl border animate-in zoom-in-75 slide-in-from-bottom-2 duration-200 ease-out origin-bottom ${
            isSelf ? 'right-2' : 'left-9'
          } ${
            isDarkMode
              ? 'bg-neutral-900/95 border-neutral-700/80 text-white backdrop-blur-md'
              : 'bg-white/95 border-neutral-200/90 text-neutral-900 backdrop-blur-md'
          }`}
        >
          <div className="flex items-center gap-1">
            {TAPBACK_EMOJIS.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectReaction(t.emoji)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:scale-125 transition-transform active:scale-90 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title={t.label}
              >
                <span>{t.emoji}</span>
              </button>
            ))}

            {/* Plus Custom Keyboard Emoji Button */}
            <button
              onClick={() => setShowFloatingCustomInput(!showFloatingCustomInput)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-transform cursor-pointer"
              title="Type custom emoji from keyboard"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-700 mx-0.5" />
            <button
              onClick={() => {
                onReplyTo(safeUserName, message.message || '');
                closePicker();
              }}
              className="px-2 py-1 rounded-full text-xs font-medium text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-1 cursor-pointer transition-colors"
              title="Inline Reply"
            >
              <Reply className="w-3.5 h-3.5" />
              <span>Reply</span>
            </button>
          </div>

          {/* Floating Custom Keyboard Emoji Input */}
          {showFloatingCustomInput && (
            <form onSubmit={handleFloatingCustomSubmit} className="flex items-center gap-1.5 px-1 py-1 w-full animate-in fade-in">
              <input
                type="text"
                value={floatingCustomEmoji}
                onChange={(e) => setFloatingCustomEmoji(e.target.value)}
                placeholder="Keyboard emoji..."
                className={`w-32 px-2 py-1 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  isDarkMode
                    ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500'
                    : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder-neutral-400'
                }`}
                autoFocus
              />
              <button
                type="submit"
                disabled={!floatingCustomEmoji.trim()}
                className="px-2.5 py-1 rounded-xl bg-blue-500 text-white text-[11px] font-semibold disabled:opacity-50 cursor-pointer"
              >
                React
              </button>
            </form>
          )}
        </div>
      )}

      {/* Slide-to-Reply Drag Container */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpenActionsModal?.(message);
        }}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
        className="relative flex items-center w-full max-w-full touch-pan-y"
      >
        {/* Slide-to-reply Indicator Circle */}
        {dragX !== 0 && (
          <div
            className={`absolute flex items-center justify-center transition-all ${
              isSelf ? 'left-[-40px]' : 'right-[-40px]'
            }`}
            style={{
              opacity: Math.min(1, Math.abs(dragX) / 35),
              transform: `scale(${Math.min(1.2, 0.6 + Math.abs(dragX) / 70)})`,
            }}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-xs ${
                isSwipeTriggered
                  ? 'bg-[#007AFF] text-white scale-110 shadow-md ring-2 ring-blue-400/50'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
              }`}
            >
              <Reply className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Outgoing Message (Current User) */}
        {isSelf ? (
          <div className="flex flex-col items-end max-w-[85%] sm:max-w-[78%] relative ml-auto">
            {/* Reaction badges positioned on top of the bubble */}
            {hasReactions && (
              <div className="relative -mb-3 z-10 mr-3 flex items-center gap-0.5">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePicker();
                  }}
                  className={`px-2 py-0.5 rounded-full border shadow-xs flex items-center gap-0.5 cursor-pointer select-none transition-transform hover:scale-105 active:scale-95 ${
                    isDarkMode
                      ? 'bg-neutral-800 border-neutral-700 text-neutral-100'
                      : 'bg-white border-neutral-200/90 text-neutral-800'
                  }`}
                >
                  {message.reactions!.map((emoji, idx) => (
                    <span key={idx} className="text-sm">
                      {emoji}
                    </span>
                  ))}
                </div>
                {/* Apple reaction speech tail dots */}
                <div className="flex flex-col items-center -ml-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-neutral-700' : 'bg-neutral-300'}`} />
                  <span className={`w-1 h-1 rounded-full mt-0.5 ${isDarkMode ? 'bg-neutral-700' : 'bg-neutral-300'}`} />
                </div>
              </div>
            )}

            {/* Action Smile Trigger Button for Outgoing Message */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePicker();
              }}
              className={`absolute -left-8 top-1.5 p-1 rounded-full text-neutral-400 hover:text-blue-500 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer ${
                showTapbackPicker ? 'opacity-100 text-blue-500' : 'opacity-0 group-hover:opacity-100'
              }`}
              title="React or reply"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Blue Bubble Container */}
            <div
              onContextMenu={(e) => e.preventDefault()}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenActionsModal?.(message);
              }}
              className="rounded-[22px] rounded-br-[4px] bg-[#007AFF] text-white p-3 shadow-xs relative cursor-pointer active:opacity-95 overflow-hidden flex flex-col gap-1.5 select-none [webkit-touch-callout:none]"
              title="Hold or double-click for options, drag to reply"
            >
              {/* Attachment Rendering with Thinner Border */}
              {attachment && (
                <div className="mb-0.5">
                  {attachment.type === 'image' ? (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenImage?.(attachment.url, attachment.name);
                      }}
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onOpenActionsModal?.(message);
                      }}
                      className="relative rounded-2xl overflow-hidden max-w-full max-h-[280px] bg-black/10 group/img border-[0.5px] border-white/20 shadow-xs cursor-pointer select-none [webkit-touch-callout:none]"
                    >
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        className="w-full h-full object-cover max-h-[280px] transition-transform duration-200 group-hover/img:scale-105 pointer-events-auto select-none"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-5 h-5 drop-shadow-md" />
                      </div>
                    </div>
                  ) : (
                    <a
                      href={attachment.url}
                      download={attachment.name}
                      onClick={(e) => e.stopPropagation()}
                      onContextMenu={(e) => e.preventDefault()}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onOpenActionsModal?.(message);
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/15 hover:bg-white/25 transition-colors border-[0.5px] border-white/20 text-white min-w-[200px]"
                    >
                      <FileText className="w-6 h-6 shrink-0" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-bold truncate">{attachment.name}</span>
                        <span className="text-[10px] opacity-80">{formatFileSize(attachment.size)}</span>
                      </div>
                      <Download className="w-4 h-4 shrink-0 opacity-80" />
                    </a>
                  )}
                </div>
              )}

              {/* Distinct Quoted Reply Box (UP) */}
              {quotedReply && (
                <div className="mb-1.5 p-2.5 rounded-xl bg-black/20 border-l-[3px] border-white text-white flex flex-col gap-0.5 text-xs shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/90">
                    <Reply className="w-3 h-3 stroke-[2.5]" />
                    <span>Replying to {quotedReply.userName}</span>
                  </div>
                  {quotedReply.snippet && (
                    <span className="truncate opacity-85 italic font-normal text-[11.5px]">
                      &ldquo;{quotedReply.snippet}&rdquo;
                    </span>
                  )}
                </div>
              )}

              {/* Text Content */}
              {cleanText && (
                <p className="text-[15px] sm:text-[15.5px] leading-[1.36] break-words whitespace-pre-wrap font-normal tracking-[-0.015em] px-1 select-text">
                  {renderMessageContent(cleanText)}
                </p>
              )}
            </div>

            {/* Down Timestamp and Read/Delivered Receipt underneath sent message */}
            <div className="flex items-center justify-end gap-1.5 mt-1 mr-1 select-none">
              {formattedTime && (
                <span className="text-[10px] sm:text-[10.5px] text-neutral-400 dark:text-neutral-500 font-normal">
                  {formattedTime}
                </span>
              )}
              <span className="text-[10px] text-neutral-300 dark:text-neutral-700">•</span>
              {message.isOptimistic ? (
                <span className="text-[10px] text-neutral-400 font-medium">Sending...</span>
              ) : message.isRead ? (
                <span
                  className="text-[10.5px] text-[#007AFF] dark:text-[#3da0ff] font-semibold flex items-center gap-0.5 cursor-default transition-colors"
                  title={
                    message.readBy && message.readBy.length > 0
                      ? `Seen by ${message.readBy.join(', ')}`
                      : 'Seen by other users'
                  }
                >
                  Read
                </span>
              ) : (
                <span
                  className="text-[10.5px] text-neutral-400 dark:text-neutral-500 font-normal transition-colors"
                  title="Delivered. Waiting for others to load the chat."
                >
                  Delivered
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Incoming Message (Other Users) */
          <div className="flex items-start gap-2.5 max-w-[88%] sm:max-w-[82%] relative">
            {/* Profile Pic Avatar */}
            <div
              className={`w-8.5 h-8.5 rounded-full ${avatar.bgColor} border border-black/5 dark:border-white/10 flex items-center justify-center text-lg shrink-0 shadow-2xs select-none mt-0.5`}
              title={safeUserName}
            >
              <span>{avatar.emoji}</span>
            </div>

            <div className="flex flex-col items-start relative min-w-0">
              {/* Sender Name above the bubble */}
              <span className="text-[11.5px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1 ml-1 select-none">
                {safeUserName}
              </span>

              {/* Reaction badges positioned on top of the incoming bubble */}
              {hasReactions && (
                <div className="relative -mb-3.5 z-10 ml-3 flex items-center gap-0.5">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePicker();
                    }}
                    className={`px-2 py-0.5 rounded-full border shadow-xs flex items-center gap-0.5 cursor-pointer select-none transition-transform hover:scale-105 active:scale-95 ${
                      isDarkMode
                        ? 'bg-neutral-800 border-neutral-700 text-neutral-100'
                        : 'bg-white border-neutral-200/90 text-neutral-800'
                    }`}
                  >
                    {message.reactions!.map((emoji, idx) => (
                      <span key={idx} className="text-sm">
                        {emoji}
                      </span>
                    ))}
                  </div>
                  {/* Connecting tail circles */}
                  <div className="flex flex-col items-center -ml-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-neutral-700' : 'bg-neutral-300'}`} />
                    <span className={`w-1 h-1 rounded-full mt-0.5 ${isDarkMode ? 'bg-neutral-700' : 'bg-neutral-300'}`} />
                  </div>
                </div>
              )}

              {/* Action Smile Trigger Button for Incoming Message */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePicker();
                }}
                className={`absolute -right-8 top-6 p-1 rounded-full text-neutral-400 hover:text-blue-500 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer ${
                  showTapbackPicker ? 'opacity-100 text-blue-500' : 'opacity-0 group-hover:opacity-100'
                }`}
                title="React or reply"
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* Apple Gray Bubble Container */}
              <div
                onContextMenu={(e) => e.preventDefault()}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenActionsModal?.(message);
                }}
                className={`rounded-[22px] rounded-tl-[4px] p-3 shadow-xs relative cursor-pointer active:opacity-95 flex flex-col gap-1.5 select-none [webkit-touch-callout:none] ${
                  isDarkMode
                    ? 'bg-[#26252A] text-neutral-100'
                    : 'bg-[#E9E9EB] text-neutral-900'
                }`}
                title="Hold or double-click for options, drag to reply"
              >
                {/* Attachment Rendering with Thinner Border */}
                {attachment && (
                  <div className="mb-0.5">
                    {attachment.type === 'image' ? (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenImage?.(attachment.url, attachment.name);
                        }}
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onOpenActionsModal?.(message);
                        }}
                        className="relative rounded-2xl overflow-hidden max-w-full max-h-[280px] bg-black/10 group/img border-[0.5px] border-black/10 dark:border-white/10 shadow-xs cursor-pointer select-none [webkit-touch-callout:none]"
                      >
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          onContextMenu={(e) => e.preventDefault()}
                          onDragStart={(e) => e.preventDefault()}
                          className="w-full h-full object-cover max-h-[280px] transition-transform duration-200 group-hover/img:scale-105 pointer-events-auto select-none"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 className="w-5 h-5 drop-shadow-md" />
                        </div>
                      </div>
                    ) : (
                      <a
                        href={attachment.url}
                        download={attachment.name}
                        onClick={(e) => e.stopPropagation()}
                        onContextMenu={(e) => e.preventDefault()}
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onOpenActionsModal?.(message);
                        }}
                        className={`flex items-center gap-3 p-2.5 rounded-2xl border-[0.5px] transition-colors min-w-[200px] ${
                          isDarkMode
                            ? 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
                            : 'bg-black/5 hover:bg-black/10 border-black/10 text-neutral-900'
                        }`}
                      >
                        <FileText className="w-6 h-6 shrink-0 text-blue-500" />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-bold truncate">{attachment.name}</span>
                          <span className="text-[10px] opacity-75">{formatFileSize(attachment.size)}</span>
                        </div>
                        <Download className="w-4 h-4 shrink-0 opacity-75" />
                      </a>
                    )}
                  </div>
                )}

                {/* Distinct Quoted Reply Box (UP) */}
                {quotedReply && (
                  <div className={`mb-1.5 p-2.5 rounded-xl border-l-[3px] border-[#007AFF] flex flex-col gap-0.5 text-xs shadow-2xs ${
                    isDarkMode ? 'bg-black/30 text-neutral-200' : 'bg-black/5 text-neutral-800'
                  }`}>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#007AFF]">
                      <Reply className="w-3 h-3 stroke-[2.5]" />
                      <span>Replying to {quotedReply.userName}</span>
                    </div>
                    {quotedReply.snippet && (
                      <span className="truncate opacity-85 italic font-normal text-[11.5px]">
                        &ldquo;{quotedReply.snippet}&rdquo;
                      </span>
                    )}
                  </div>
                )}

                {/* Text Content */}
                {cleanText && (
                  <p className="text-[15px] sm:text-[15.5px] leading-[1.36] break-words whitespace-pre-wrap font-normal tracking-[-0.015em] px-1 select-text">
                    {renderMessageContent(cleanText)}
                  </p>
                )}
              </div>

              {/* Down Timestamp underneath received message */}
              {formattedTime && (
                <div className="flex items-center mt-1 ml-1 select-none">
                  <span className="text-[10px] sm:text-[10.5px] text-neutral-400 dark:text-neutral-500 font-normal">
                    {formattedTime}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
