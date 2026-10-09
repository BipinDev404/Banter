import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '../types';
import { getAvatarForUser, TAPBACK_REACTIONS, renderReactionIcon } from '../lib/avatars';
import { Reply, FileText, Download, Maximize2, Smile, Mic, Play, Pause } from 'lucide-react';
import { formatFileSize } from '../lib/attachments';
import { ThemeAccent, getThemeOption } from '../lib/settings';
import { UserAvatar } from './UserAvatar';

const VOICE_WAVEFORM_BARS = [
  35, 65, 40, 85, 100, 50, 75, 30, 90, 60, 45, 80, 95, 40, 70, 55, 30, 85, 60, 40, 75, 50, 90, 35
];

interface VoiceNotePlayerProps {
  audioUrl: string;
  isSelf: boolean;
  isDarkMode?: boolean;
}

const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ audioUrl, isSelf, isDarkMode = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn('Audio playback note:', err));
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const speeds: (1 | 1.5 | 2)[] = [1, 1.5, 2];
    const nextIndex = (speeds.indexOf(speed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`flex flex-col gap-2 p-2.5 rounded-2xl select-none min-w-[220px] max-w-[280px] ${
        isSelf
          ? 'bg-white/15 text-white border-[0.5px] border-white/25 shadow-xs'
          : isDarkMode
          ? 'bg-[#1c1d22] text-white border-[0.5px] border-white/10 shadow-xs'
          : 'bg-white text-neutral-900 border-[0.5px] border-black/10 shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Play/Pause Button with WhatsApp Blue Mic Badge */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={togglePlay}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-md ${
              isSelf
                ? 'bg-white text-[#007AFF] hover:bg-neutral-100'
                : 'bg-[#007AFF] text-white hover:bg-[#0071E3]'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Blue Mic Badge */}
          <div
            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 shadow-xs ${
              isSelf
                ? 'border-[#007AFF] bg-white text-[#007AFF]'
                : 'border-white dark:border-[#1c1d22] bg-[#007AFF] text-white'
            }`}
          >
            <Mic className="w-2.5 h-2.5 stroke-[2.5]" />
          </div>
        </div>

        {/* Waveform Visualization & Time */}
        <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
          {/* Interactive Seekable Waveform */}
          <div
            onClick={handleSeek}
            className="flex items-center gap-[2.5px] h-7 cursor-pointer py-1 group/wave"
            title="Click to seek"
          >
            {VOICE_WAVEFORM_BARS.map((heightPercent, idx) => {
              const barProgress = idx / VOICE_WAVEFORM_BARS.length;
              const isPlayed = barProgress <= progress;
              return (
                <div
                  key={idx}
                  style={{ height: `${heightPercent}%` }}
                  className={`w-[3px] rounded-full transition-all duration-150 ${
                    isPlayed
                      ? isSelf
                        ? 'bg-white'
                        : 'bg-[#007AFF]'
                      : isSelf
                      ? 'bg-white/35 group-hover/wave:bg-white/50'
                      : isDarkMode
                      ? 'bg-white/20 group-hover/wave:bg-white/30'
                      : 'bg-black/15 group-hover/wave:bg-black/25'
                  }`}
                />
              );
            })}
          </div>

          {/* Time & Playback Speed */}
          <div className="flex items-center justify-between text-[11px] font-semibold tracking-tight">
            <span
              className={
                isSelf
                  ? 'text-white/90 font-mono'
                  : isDarkMode
                  ? 'text-neutral-400 font-mono'
                  : 'text-neutral-500 font-mono'
              }
            >
              {isPlaying ? formatTime(currentTime) : formatTime(duration || 0)}
            </span>

            <button
              type="button"
              onClick={cycleSpeed}
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                isSelf
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'bg-blue-500/10 text-[#007AFF] hover:bg-blue-500/20'
              }`}
              title="Playback speed"
            >
              {speed}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  message: ChatMessage;
  isSelf: boolean;
  onReact: (messageId: string, emoji: string) => void;
  onReplyTo: (userName: string, textSnippet: string) => void;
  onOpenImage?: (url: string, name: string) => void;
  onOpenActionsModal?: (message: ChatMessage) => void;
  isDarkMode?: boolean;
  themeAccent?: ThemeAccent;
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
  themeAccent = 'blue',
  allParticipantNames = [],
  showTapbackPicker: showTapbackPickerProp,
  onToggleTapbackPicker,
  onCloseTapbackPicker,
}) => {
  const themeOption = getThemeOption(themeAccent);
  const [internalShowTapbackPicker, setInternalShowTapbackPicker] = useState(false);
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

  const getMessageSnippet = (msg: ChatMessage) => {
    const textPart = msg.message?.trim() || '';
    if (msg.attachment) {
      const attachLabel = msg.attachment.type === 'image' ? 'Photo' : msg.attachment.name;
      return textPart ? `${textPart} (${attachLabel})` : attachLabel;
    }
    return textPart;
  };

  // Long press handler
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
      togglePicker();
      touchStartRef.current = null;
    }, 350);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Touch Handlers
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
      onReplyTo(safeUserName, getMessageSnippet(message));
    }
    setIsDragging(false);
    setDragX(0);
    touchStartRef.current = null;
  };

  // Mouse Handlers
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
      onReplyTo(safeUserName, getMessageSnippet(message));
    }
    setIsDragging(false);
    setDragX(0);
    touchStartRef.current = null;
  };

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
            <strong key={index} className="font-semibold tracking-tight">
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

  const handleSelectReaction = (reactionId: string) => {
    if (!message.id) return;
    onReact(message.id, reactionId);
    closePicker();
  };

  const hasReactions = Array.isArray(message.reactions) && message.reactions.length > 0;
  const isSwipeTriggered = Math.abs(dragX) > 50;
  const { replyTo: quotedReply, cleanText } = extractReplyData(message);

  return (
    <div className={`flex flex-col relative group my-2 sm:my-3 select-none no-native-callout ${isSelf ? 'items-end' : 'items-start'}`}>
      {/* Floating Apple Tapback Reaction Pill with Vector Icons */}
      <AnimatePresence>
        {showTapbackPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.75, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.75, y: 12 }}
            transition={{ type: 'spring', damping: 22, stiffness: 420 }}
            onClick={(e) => e.stopPropagation()}
            className={`absolute -top-14 z-30 flex items-center gap-1 p-1.5 rounded-full border shadow-[0_12px_32px_rgba(0,0,0,0.32)] origin-bottom ${
              isSelf ? 'right-2' : 'left-10'
            } ${
              isDarkMode
                ? 'bg-[#1C1D22]/95 border-white/15 text-white shadow-black/70'
                : 'bg-white/95 border-black/10 text-neutral-900 shadow-neutral-400/30'
            } backdrop-blur-2xl`}
          >
            {TAPBACK_REACTIONS.map((t) => (
              <motion.button
                key={t.id}
                whileHover={{ scale: 1.35, y: -3 }}
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', damping: 16, stiffness: 400 }}
                onClick={() => handleSelectReaction(t.id)}
                className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                  isDarkMode ? 'hover:bg-white/15' : 'hover:bg-black/5'
                }`}
                title={t.name}
              >
                {renderReactionIcon(t.id, 'text-xl')}
              </motion.button>
            ))}

            <div className={`w-px h-5 mx-0.5 ${isDarkMode ? 'bg-neutral-700/80' : 'bg-neutral-300'}`} />
            <button
              onClick={() => {
                onReplyTo(safeUserName, getMessageSnippet(message));
                closePicker();
              }}
              className="px-3 py-1 rounded-full text-xs font-semibold text-[#007AFF] hover:bg-[#007AFF]/10 flex items-center gap-1 cursor-pointer transition-colors"
              title="Inline Reply"
            >
              <Reply className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Reply</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
            {/* Reaction badges with Apple Pill Design */}
            {hasReactions && (
              <div className="relative -mb-3 z-10 mr-3.5 flex items-center gap-0.5 select-none">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePicker();
                  }}
                  className={`px-2.5 py-0.5 rounded-full border shadow-sm flex items-center gap-1 cursor-pointer select-none transition-all hover:scale-108 active:scale-95 ${
                    isDarkMode
                      ? 'bg-[#2c2c2e]/95 border-white/15 text-neutral-100 shadow-black/40'
                      : 'bg-white/95 border-black/10 text-neutral-900 shadow-neutral-400/20'
                  } backdrop-blur-md`}
                >
                  {message.reactions!.map((reactionKey, idx) => (
                    <span key={idx} className="flex items-center">
                      {renderReactionIcon(reactionKey, 'text-xs sm:text-sm')}
                    </span>
                  ))}
                  {message.reactions!.length > 1 && (
                    <span className="text-[10px] font-bold opacity-75 ml-0.5">
                      {message.reactions!.length}
                    </span>
                  )}
                </div>
                {/* Apple Double-Tail Dots */}
                <div className="flex flex-col items-center -ml-1">
                  <span className={`w-1.5 h-1.5 rounded-full border ${isDarkMode ? 'bg-[#2c2c2e] border-white/10' : 'bg-white border-black/10'}`} />
                  <span className={`w-1 h-1 rounded-full -mt-0.5 border ${isDarkMode ? 'bg-[#2c2c2e] border-white/10' : 'bg-white border-black/10'}`} />
                </div>
              </div>
            )}

            {/* Smile Trigger Button */}
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

            {/* Sent Bubble Container with Apple Geometry & Inner Border */}
            <div
              onContextMenu={(e) => e.preventDefault()}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenActionsModal?.(message);
              }}
              style={{ backgroundColor: themeOption.hex }}
              className="rounded-[20px] rounded-br-[4px] text-white p-3 shadow-sm relative cursor-pointer active:opacity-95 overflow-hidden flex flex-col gap-1.5 select-none [webkit-touch-callout:none] border-[0.5px] border-white/20"
              title="Hold or double-click for options, drag to reply"
            >
              {/* Attachment Rendering */}
              {attachment && (
                <div className="mb-0.5">
                  {attachment.type === 'image' ? (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenImage?.(attachment.url, attachment.name);
                      }}
                      className="relative rounded-[16px] overflow-hidden max-w-full max-h-[280px] bg-black/10 group/img border-[0.5px] border-white/20 shadow-xs cursor-pointer select-none"
                    >
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="w-full h-full object-cover max-h-[280px] transition-transform duration-200 group-hover/img:scale-105 pointer-events-auto select-none"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-5 h-5 drop-shadow-md" />
                      </div>
                    </div>
                  ) : attachment.type === 'audio' ? (
                    <VoiceNotePlayer audioUrl={attachment.url} isSelf={true} isDarkMode={isDarkMode} />
                  ) : (
                    <a
                      href={attachment.url}
                      download={attachment.name}
                      onClick={(e) => e.stopPropagation()}
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

              {/* Quoted Reply Box */}
              {quotedReply && (
                <div className="mb-1 p-2.5 rounded-xl bg-black/20 border-l-[3px] border-white text-white flex flex-col gap-0.5 text-xs shadow-2xs">
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
                <p className="text-[15px] sm:text-[15.5px] leading-[1.38] break-words whitespace-pre-wrap font-normal tracking-[-0.015em] px-1 select-text">
                  {renderMessageContent(cleanText)}
                </p>
              )}
            </div>

            {/* Apple Timestamp and Status */}
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
                <span className="text-[10.5px] text-[#007AFF] dark:text-[#3da0ff] font-semibold flex items-center gap-0.5">
                  Read
                </span>
              ) : (
                <span className="text-[10.5px] text-neutral-400 dark:text-neutral-500 font-normal">
                  Delivered
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Incoming Message (Other Users) */
          <div className="flex items-start gap-2.5 max-w-[88%] sm:max-w-[82%] relative">
            {/* Apple Vector Icon Avatar */}
            <UserAvatar avatar={avatar} size="sm" className="mt-0.5" />

            <div className="flex flex-col items-start relative min-w-0">
              {/* Sender Name */}
              <span className="text-[11.5px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1 ml-1 select-none">
                {safeUserName}
              </span>

              {/* Reaction badges with Apple Pill Design */}
              {hasReactions && (
                <div className="relative -mb-3 z-10 ml-3.5 flex items-center gap-0.5 select-none">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePicker();
                    }}
                    className={`px-2.5 py-0.5 rounded-full border shadow-sm flex items-center gap-1 cursor-pointer select-none transition-all hover:scale-108 active:scale-95 ${
                      isDarkMode
                        ? 'bg-[#2c2c2e]/95 border-white/15 text-neutral-100 shadow-black/40'
                        : 'bg-white/95 border-black/10 text-neutral-900 shadow-neutral-400/20'
                    } backdrop-blur-md`}
                  >
                    {message.reactions!.map((reactionKey, idx) => (
                      <span key={idx} className="flex items-center">
                        {renderReactionIcon(reactionKey, 'text-xs sm:text-sm')}
                      </span>
                    ))}
                    {message.reactions!.length > 1 && (
                      <span className="text-[10px] font-bold opacity-75 ml-0.5">
                        {message.reactions!.length}
                      </span>
                    )}
                  </div>
                  {/* Apple Double-Tail Dots */}
                  <div className="flex flex-col items-center -ml-1">
                    <span className={`w-1.5 h-1.5 rounded-full border ${isDarkMode ? 'bg-[#2c2c2e] border-white/10' : 'bg-white border-black/10'}`} />
                    <span className={`w-1 h-1 rounded-full -mt-0.5 border ${isDarkMode ? 'bg-[#2c2c2e] border-white/10' : 'bg-white border-black/10'}`} />
                  </div>
                </div>
              )}

              {/* Action Smile Trigger Button */}
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

              {/* Bubble Container with Apple Neutral Glass */}
              <div
                onContextMenu={(e) => e.preventDefault()}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenActionsModal?.(message);
                }}
                className={`rounded-[20px] rounded-tl-[4px] p-3 shadow-xs relative cursor-pointer active:opacity-95 flex flex-col gap-1.5 select-none [webkit-touch-callout:none] border-[0.5px] ${
                  isDarkMode
                    ? 'bg-[#242426] text-neutral-100 border-white/10'
                    : 'bg-[#E9E9EB] text-neutral-900 border-black/5'
                }`}
                title="Hold or double-click for options, drag to reply"
              >
                {/* Attachment Rendering */}
                {attachment && (
                  <div className="mb-0.5">
                    {attachment.type === 'image' ? (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenImage?.(attachment.url, attachment.name);
                        }}
                        className="relative rounded-[16px] overflow-hidden max-w-full max-h-[280px] bg-black/10 group/img border-[0.5px] border-black/10 dark:border-white/10 shadow-xs cursor-pointer select-none"
                      >
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="w-full h-full object-cover max-h-[280px] transition-transform duration-200 group-hover/img:scale-105 pointer-events-auto select-none"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 className="w-5 h-5 drop-shadow-md" />
                        </div>
                      </div>
                    ) : attachment.type === 'audio' ? (
                      <VoiceNotePlayer audioUrl={attachment.url} isSelf={false} isDarkMode={isDarkMode} />
                    ) : (
                      <a
                        href={attachment.url}
                        download={attachment.name}
                        onClick={(e) => e.stopPropagation()}
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

                {/* Quoted Reply Box */}
                {quotedReply && (
                  <div className={`mb-1 p-2.5 rounded-xl border-l-[3px] border-[#007AFF] flex flex-col gap-0.5 text-xs shadow-2xs ${
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
                  <p className="text-[15px] sm:text-[15.5px] leading-[1.38] break-words whitespace-pre-wrap font-normal tracking-[-0.015em] px-1 select-text">
                    {renderMessageContent(cleanText)}
                  </p>
                )}
              </div>

              {/* Timestamp */}
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
