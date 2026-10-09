import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, SystemNotification, TypingUser } from '../types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ArrowDown, Loader2, UserPlus, UserMinus } from 'lucide-react';
import { BanterLogo } from './BanterLogo';
import { AppSettings, ChatBgPattern } from '../lib/settings';

interface MessageListProps {
  messages: ChatMessage[];
  systemNotifications: SystemNotification[];
  currentUserId: string;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onReact: (messageId: string, emoji: string) => void;
  onReplyTo: (userName: string, textSnippet: string) => void;
  onOpenImage?: (url: string, name: string) => void;
  onOpenActionsModal?: (message: ChatMessage) => void;
  typingUsers?: TypingUser[];
  isDarkMode?: boolean;
  settings?: AppSettings;
}

function getPatternClass(pattern?: ChatBgPattern, isDark?: boolean): string {
  switch (pattern) {
    case 'doodle':
      return isDark
        ? 'bg-[#121316] text-white bg-[radial-gradient(#ffffff18_1px,transparent_1px)] [background-size:16px_16px]'
        : 'bg-[#F9FAFB] text-neutral-900 bg-[radial-gradient(#00000010_1px,transparent_1px)] [background-size:16px_16px]';
    case 'grid':
      return isDark
        ? 'bg-[#121316] text-white bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] [background-size:24px_24px]'
        : 'bg-[#F9FAFB] text-neutral-900 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] [background-size:24px_24px]';
    case 'dots':
      return isDark
        ? 'bg-[#121316] text-white bg-[radial-gradient(#3b82f630_1.5px,transparent_1.5px)] [background-size:20px_20px]'
        : 'bg-[#F9FAFB] text-neutral-900 bg-[radial-gradient(#007aff20_1.5px,transparent_1.5px)] [background-size:20px_20px]';
    case 'dark-oled':
      return 'bg-black text-white';
    case 'warm-paper':
      return isDark ? 'bg-[#1C1917] text-[#F5F5F4]' : 'bg-[#FAF7F2] text-[#292524]';
    case 'gradient':
      return isDark
        ? 'bg-gradient-to-b from-[#1E1B4B]/30 via-[#121316] to-[#121316] text-white'
        : 'bg-gradient-to-b from-blue-50/80 via-white to-white text-neutral-900';
    case 'clean':
    default:
      return isDark ? 'bg-[#121316] text-white' : 'bg-white text-neutral-900';
  }
}

// Format timestamps into Apple-style "Yesterday 11:35 AM", "Today 8:04 AM", or "Oct 4, 11:35 AM"
function formatDividerDate(timestamp: number): string {
  try {
    const msgDate = new Date(timestamp);
    const now = new Date();

    const isToday =
      msgDate.getDate() === now.getDate() &&
      msgDate.getMonth() === now.getMonth() &&
      msgDate.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      msgDate.getDate() === yesterday.getDate() &&
      msgDate.getMonth() === yesterday.getMonth() &&
      msgDate.getFullYear() === yesterday.getFullYear();

    const timeStr = msgDate.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });

    if (isToday) {
      return `Today ${timeStr}`;
    }
    if (isYesterday) {
      return `Yesterday ${timeStr}`;
    }

    const monthStr = msgDate.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
    return `${monthStr} ${timeStr}`;
  } catch {
    return '';
  }
}

export const MessageList: React.FC<MessageListProps> = ({
  messages = [],
  systemNotifications = [],
  currentUserId,
  loading,
  hasMore,
  onLoadMore,
  onReact,
  onReplyTo,
  onOpenImage,
  onOpenActionsModal,
  typingUsers = [],
  isDarkMode = true,
  settings,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isFirstLoadRef = useRef(true);

  // Single active reaction box across the entire chat
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);

  // Close reaction box on click outside or scroll
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveReactionMsgId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Queue to guarantee only ONE join/leave notification box displays at a time for exactly 2 seconds
  const [activeNotice, setActiveNotice] = useState<SystemNotification | null>(null);
  const queueRef = useRef<SystemNotification[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isDisplayingRef = useRef(false);

  const displayNext = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (queueRef.current.length === 0) {
      setActiveNotice(null);
      isDisplayingRef.current = false;
      return;
    }

    isDisplayingRef.current = true;
    const next = queueRef.current.shift()!;
    setActiveNotice(next);

    timerRef.current = setTimeout(() => {
      displayNext();
    }, 2000);
  }, []);

  useEffect(() => {
    let hasNew = false;
    (systemNotifications || []).forEach((n) => {
      if (n && n.id && !seenIdsRef.current.has(n.id)) {
        seenIdsRef.current.add(n.id);
        queueRef.current.push(n);
        hasNew = true;
      }
    });

    if (hasNew && !isDisplayingRef.current) {
      displayNext();
    }
  }, [systemNotifications, displayNext]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (loading && (!messages || messages.length === 0)) return;

    if (isFirstLoadRef.current && messages && messages.length > 0) {
      scrollToBottom('auto');
      isFirstLoadRef.current = false;
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 180) {
      scrollToBottom('smooth');
    }
  }, [messages, loading, typingUsers]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollBottom(distanceFromBottom > 240);
  };

  const participantNames = React.useMemo(() => {
    const names = new Set<string>();
    (messages || []).forEach((m) => {
      if (!m || typeof m.userName !== 'string') return;
      const clean = m.userName.trim();
      if (!clean) return;
      const firstWord = clean.split(' ')[0];
      if (firstWord) names.add(firstWord);
      names.add(clean);
    });
    return Array.from(names);
  }, [messages]);

  if (loading && (!messages || messages.length === 0)) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center p-6 text-neutral-400 ${isDarkMode ? 'bg-black' : 'bg-[#F2F2F7]'}`}>
        <Loader2 className="w-6 h-6 animate-spin text-[#007AFF] mb-2" />
        <span className="text-xs font-medium tracking-tight">Connecting to chat...</span>
      </div>
    );
  }

  const safeMessages = Array.isArray(messages) ? messages : [];

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`flex-1 overflow-y-auto px-4 sm:px-8 py-4 relative transition-colors ${
        isDarkMode ? 'bg-black text-white' : 'bg-[#F2F2F7] text-neutral-900'
      }`}
    >
      <div className="max-w-3xl mx-auto w-full flex flex-col space-y-1 min-h-full">
        {/* Top Activity Banner: Apple notification capsule */}
        {activeNotice && (
          <div className="sticky top-1 z-20 flex justify-center pb-2 pointer-events-none select-none">
            <div
              key={activeNotice.id}
              className={`pointer-events-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium shadow-md border backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 ${
                isDarkMode
                  ? 'border-white/10 bg-[#1c1c1e]/90 text-neutral-200'
                  : 'border-black/5 bg-white/95 text-neutral-800 shadow-sm'
              }`}
            >
              {activeNotice.type === 'join' || activeNotice.text.toLowerCase().includes('joined') ? (
                <span className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                </span>
              ) : (
                <span className="flex items-center gap-1 text-neutral-400">
                  <UserMinus className="w-3.5 h-3.5" />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                </span>
              )}
              <span>{activeNotice.text}</span>
            </div>
          </div>
        )}

        {/* Load older messages button if available */}
        {hasMore && (
          <div className="flex justify-center pb-2">
            <button
              onClick={onLoadMore}
              className={`text-xs font-medium px-4 py-1.5 rounded-full border transition-all cursor-pointer active:scale-95 ${
                isDarkMode
                  ? 'border-white/10 bg-[#1c1c1e] hover:bg-[#2c2c2e] text-neutral-300 hover:text-white'
                  : 'border-black/5 bg-white hover:bg-neutral-100 text-neutral-700 hover:text-black shadow-xs'
              }`}
            >
              Load Earlier Messages
            </button>
          </div>
        )}

        {/* Empty State when no messages exist */}
        {safeMessages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center my-auto py-16 text-center select-none">
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-3 ${
              isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'
            }`}>
              <BanterLogo className="w-8 h-8 drop-shadow-sm" />
            </div>
            <h3 className="text-base font-semibold">
              No messages yet
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs">
              Send a message below to start the conversation!
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {safeMessages.map((msg, index) => {
              if (!msg) return null;
              const prevMsg = index > 0 ? safeMessages[index - 1] : null;

              const showDateDivider =
                !prevMsg ||
                Math.abs((msg.createdAt || 0) - (prevMsg?.createdAt || 0)) > 30 * 60 * 1000;

              return (
                <React.Fragment key={msg.id || index}>
                  {showDateDivider && msg.createdAt && (
                    <motion.div
                      layout="position"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ type: 'spring', damping: 26, stiffness: 380 }}
                      className="flex justify-center my-4 select-none"
                      style={{ willChange: 'transform, opacity' }}
                    >
                      <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                        {formatDividerDate(msg.createdAt)}
                      </span>
                    </motion.div>
                  )}

                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96, y: -12 }}
                    transition={{
                      layout: { type: 'spring', damping: 28, stiffness: 380 },
                      opacity: { duration: 0.18, ease: 'easeOut' },
                      scale: { type: 'spring', damping: 24, stiffness: 380 },
                      y: { type: 'spring', damping: 24, stiffness: 380 },
                    }}
                    style={{ willChange: 'transform, opacity' }}
                  >
                    <MessageBubble
                      message={msg}
                      isSelf={msg.userId === currentUserId}
                      themeAccent="blue"
                      onReact={(msgId, emoji) => {
                        onReact(msgId, emoji);
                        setActiveReactionMsgId(null);
                      }}
                      onReplyTo={(userName, textSnippet) => {
                        onReplyTo(userName, textSnippet);
                        setActiveReactionMsgId(null);
                      }}
                      onOpenImage={onOpenImage}
                      onOpenActionsModal={onOpenActionsModal}
                      isDarkMode={isDarkMode}
                      allParticipantNames={participantNames}
                      showTapbackPicker={activeReactionMsgId === msg.id}
                      onToggleTapbackPicker={() => {
                        setActiveReactionMsgId((prev) => (prev === msg.id ? null : msg.id));
                      }}
                      onCloseTapbackPicker={() => setActiveReactionMsgId(null)}
                    />
                  </motion.div>
                </React.Fragment>
              );
            })}
          </AnimatePresence>
        )}

        <TypingIndicator typingUsers={typingUsers} isDarkMode={isDarkMode} />
        <div ref={bottomRef} className="h-3" />
      </div>

      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className={`fixed bottom-24 right-8 p-2.5 rounded-full shadow-2xl border active:scale-95 transition-all cursor-pointer z-30 flex items-center justify-center animate-in fade-in backdrop-blur-md ${
            isDarkMode
              ? 'border-white/10 bg-[#1c1c1e]/90 hover:bg-[#2c2c2e] text-white'
              : 'border-black/5 bg-white/90 hover:bg-white text-neutral-800 shadow-lg'
          }`}
          aria-label="Scroll to newest message"
        >
          <ArrowDown className="w-4 h-4 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};
