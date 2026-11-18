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
  const [hasUnreadBelow, setHasUnreadBelow] = useState(false);
  const [unreadSender, setUnreadSender] = useState<string | null>(null);
  const isFirstLoadRef = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);

  // Single active reaction box across the entire chat
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);

  // Close reaction box on click outside
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

  const contentRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevTypingSessionIdsRef = useRef<Set<string>>(new Set());
  const recentTypingTimestampsRef = useRef<Map<string, number>>(new Map());
  const morphedMessageIdsRef = useRef<Set<string>>(new Set());

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior });
    } else {
      bottomRef.current?.scrollIntoView({ behavior });
    }
    isNearBottomRef.current = true;
    setHasUnreadBelow(false);
    setUnreadSender(null);
  }, []);

  // Keep chat pinned smoothly to bottom when container or content height animates (typing indicator, new message, mobile keyboard)
  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      if (isNearBottomRef.current) {
        container.scrollTop = container.scrollHeight;
      }
    });
    observer.observe(container);
    if (content) observer.observe(content);
    return () => observer.disconnect();
  }, [loading]);

  const safeMessages = Array.isArray(messages) ? messages : [];

  // Synchronously suppress stale typing indicator if the sender just delivered a message,
  // preventing the typing box and message box from overlapping or bouncing up and down.
  const now = Date.now();
  const recentMessagesWindow = safeMessages.slice(-6);
  const visibleTypingUsers = (typingUsers || []).filter((typer) => {
    if (!typer || typeof typer.userName !== 'string' || !typer.userName.trim()) return false;
    const justSentByTyper = recentMessagesWindow.some(
      (m) =>
        m &&
        m.userId === typer.sessionId &&
        now - (m.createdAt || 0) < 4000 &&
        typer.lastTyped <= (m.createdAt || now) + 600
    );
    return !justSentByTyper;
  });

  // Track which latest message replaced an active typing indicator so it morphs cleanly in place
  const latestMessage = safeMessages.length > 0 ? safeMessages[safeMessages.length - 1] : null;
  let replacedTypingThisRender = false;
  if (
    latestMessage &&
    latestMessage.id !== lastMessageIdRef.current &&
    !isFirstLoadRef.current
  ) {
    const lastTypedAt = recentTypingTimestampsRef.current.get(latestMessage.userId);
    const wasTypingRecently =
      prevTypingSessionIdsRef.current.has(latestMessage.userId) ||
      (typeof lastTypedAt === 'number' && now - lastTypedAt < 1800);

    if (wasTypingRecently) {
      morphedMessageIdsRef.current.add(latestMessage.id);
      replacedTypingThisRender = true;
      recentTypingTimestampsRef.current.delete(latestMessage.userId);
    }
  }

  // Update typing session memory after computing handoff
  useEffect(() => {
    const currentNow = Date.now();
    const nextSet = new Set<string>();
    (visibleTypingUsers || []).forEach((u) => {
      nextSet.add(u.sessionId);
      recentTypingTimestampsRef.current.set(u.sessionId, currentNow);
    });
    prevTypingSessionIdsRef.current = nextSet;

    // Prune stale entries older than 3s
    recentTypingTimestampsRef.current.forEach((ts, key) => {
      if (currentNow - ts > 3000) {
        recentTypingTimestampsRef.current.delete(key);
      }
    });
  }, [typingUsers, messages]);

  // Handle auto-scrolling & new message detection
  useEffect(() => {
    if (loading && (!messages || messages.length === 0)) return;

    if (isFirstLoadRef.current && messages && messages.length > 0) {
      scrollToBottom('auto');
      isFirstLoadRef.current = false;
      if (messages[messages.length - 1]) {
        lastMessageIdRef.current = messages[messages.length - 1].id;
      }
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const latestMsg = messages[messages.length - 1];
    if (!latestMsg) return;

    const isNewMessage = latestMsg.id !== lastMessageIdRef.current;
    if (isNewMessage) {
      lastMessageIdRef.current = latestMsg.id;

      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;

      // Rule 1: If current user sent this message, ALWAYS pin to bottom cleanly
      if (latestMsg.userId === currentUserId) {
        isNearBottomRef.current = true;
        setHasUnreadBelow(false);
        setUnreadSender(null);
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        });
      } else {
        // Rule 2: If another user sent a message, keep pinned if near bottom without competing smooth scroll
        if (distanceFromBottom < 180 || isNearBottomRef.current) {
          isNearBottomRef.current = true;
          requestAnimationFrame(() => {
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
          });
        } else {
          // Scrolled up: do NOT jump! Indicate new message below
          setHasUnreadBelow(true);
          setUnreadSender(latestMsg.userName || 'New Message');
        }
      }
    }
  }, [messages, loading, currentUserId, scrollToBottom]);

  // Keep bottom aligned smoothly when typing indicator appears near bottom
  useEffect(() => {
    if (visibleTypingUsers.length > 0) {
      const container = containerRef.current;
      if (container) {
        const distanceFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
        if (distanceFromBottom < 260) {
          isNearBottomRef.current = true;
          requestAnimationFrame(() => {
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
          });
        }
      }
    }
  }, [visibleTypingUsers.length]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    isNearBottomRef.current = distanceFromBottom < 80;

    if (distanceFromBottom < 80) {
      if (hasUnreadBelow) {
        setHasUnreadBelow(false);
        setUnreadSender(null);
      }
      setShowScrollBottom(false);
    } else {
      setShowScrollBottom(distanceFromBottom > 240 || hasUnreadBelow);
    }
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
      <div className={`flex-1 min-h-0 flex flex-col items-center justify-center p-6 text-neutral-400 ${isDarkMode ? 'bg-black' : 'bg-[#F2F2F7]'}`}>
        <Loader2 className="w-6 h-6 animate-spin text-[#007AFF] mb-2" />
        <span className="text-xs font-medium tracking-tight">Connecting to chat...</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ overflowAnchor: 'none' }}
      className={`flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-8 py-4 relative transition-colors ${
        isDarkMode ? 'bg-black text-white' : 'bg-[#F2F2F7] text-neutral-900'
      }`}
    >
      {/* Floating System Notice Banner: Non-layout shifting overlay */}
      {activeNotice && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none">
          <div
            key={activeNotice.id}
            className={`pointer-events-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium shadow-lg border backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 ${
              isDarkMode
                ? 'border-white/10 bg-[#1c1c1e]/90 text-neutral-200'
                : 'border-black/5 bg-white/95 text-neutral-800 shadow-md'
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

      <div ref={contentRef} className="max-w-3xl mx-auto w-full flex flex-col min-h-full">
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

        {/* Message Stack + Integrated Typing Indicator */}
        <div className="flex-1 flex flex-col justify-end space-y-1 mt-auto">
          <AnimatePresence initial={false}>
            {safeMessages.map((msg, index) => {
              if (!msg) return null;
              const prevMsg = index > 0 ? safeMessages[index - 1] : null;
              const isSelf = msg.userId === currentUserId;
              const isMorphedFromTyping = morphedMessageIdsRef.current.has(msg.id);

              const showDateDivider =
                !prevMsg ||
                Math.abs((msg.createdAt || 0) - (prevMsg?.createdAt || 0)) > 30 * 60 * 1000;

              return (
                <motion.div
                  key={msg.id || index}
                  initial={
                    isMorphedFromTyping
                      ? { opacity: 0.45, scale: 0.86, y: 2 }
                      : { opacity: 0, y: 8, scale: 0.97 }
                  }
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.14 } }}
                  transition={
                    isMorphedFromTyping
                      ? { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
                      : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
                  }
                  style={{
                    transformOrigin: isSelf ? 'bottom right' : 'bottom left',
                  }}
                >
                  {showDateDivider && msg.createdAt && (
                    <div className="flex justify-center my-4 select-none">
                      <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                        {formatDividerDate(msg.createdAt)}
                      </span>
                    </div>
                  )}

                  <MessageBubble
                    message={msg}
                    isSelf={isSelf}
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
              );
            })}
          </AnimatePresence>

          <TypingIndicator
            typingUsers={visibleTypingUsers}
            isDarkMode={isDarkMode}
            instantExit={replacedTypingThisRender}
          />
        </div>

        <div ref={bottomRef} className="h-4 shrink-0" />
      </div>

      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className={`fixed bottom-24 right-6 sm:right-10 px-3.5 py-2 rounded-full shadow-2xl border active:scale-95 transition-all cursor-pointer z-30 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-3 backdrop-blur-xl ${
            hasUnreadBelow
              ? 'bg-[#007AFF] text-white border-blue-400/40 shadow-blue-500/30'
              : isDarkMode
              ? 'border-white/10 bg-[#1c1c1e]/90 hover:bg-[#2c2c2e] text-white'
              : 'border-black/5 bg-white/90 hover:bg-white text-neutral-800 shadow-lg'
          }`}
          aria-label="Scroll to newest message"
        >
          {hasUnreadBelow ? (
            <>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
              <span className="text-xs font-extrabold tracking-tight">
                {unreadSender ? `New msg from ${unreadSender}` : 'New Messages'}
              </span>
              <ArrowDown className="w-3.5 h-3.5 stroke-[3]" />
            </>
          ) : (
            <ArrowDown className="w-4 h-4 stroke-[2.5]" />
          )}
        </button>
      )}
    </div>
  );
};
