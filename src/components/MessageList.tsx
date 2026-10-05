import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChatMessage, SystemNotification, TypingUser } from '../types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ArrowDown, Loader2, UserPlus, UserMinus } from 'lucide-react';
import { BanterLogo } from './BanterLogo';

interface MessageListProps {
  messages: ChatMessage[];
  systemNotifications: SystemNotification[];
  currentUserId: string;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onReact: (messageId: string, emoji: string) => void;
  onReplyTo: (userName: string, textSnippet: string) => void;
  typingUsers?: TypingUser[];
  isDarkMode?: boolean;
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
  typingUsers = [],
  isDarkMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isFirstLoadRef = useRef(true);

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

    // Box disappears after exactly 2 seconds, then immediately shows the next one in queue
    timerRef.current = setTimeout(() => {
      displayNext();
    }, 2000);
  }, []);

  // Ingest incoming system notifications into sequential queue
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

  // Clean up timer on unmount
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

  // Distinct participant names in this chat for mention highlighting (safely guarded)
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-neutral-400">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
        <span className="text-xs font-medium tracking-tight">Connecting to chat...</span>
      </div>
    );
  }

  const safeMessages = Array.isArray(messages) ? messages : [];

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`flex-1 overflow-y-auto px-4 sm:px-8 py-4 relative ${
        isDarkMode ? 'bg-[#121316] text-white' : 'bg-white text-neutral-900'
      }`}
    >
      <div className="max-w-3xl mx-auto w-full flex flex-col space-y-1 min-h-full">
        {/* Top Activity Banner: Exactly ONE join/leave notification box that disappears in 2 sec */}
        {activeNotice && (
          <div className="sticky top-1 z-20 flex justify-center pb-2 pointer-events-none select-none">
            <div
              key={activeNotice.id}
              className={`pointer-events-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium shadow-xs border transition-all backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 ${
                isDarkMode
                  ? 'bg-neutral-900/90 border-neutral-700/70 text-neutral-200'
                  : 'bg-white/95 border-neutral-200/90 text-neutral-700'
              }`}
            >
              {activeNotice.type === 'join' || activeNotice.text.toLowerCase().includes('joined') ? (
                <span className="flex items-center gap-1 text-emerald-500">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
              className={`text-xs font-medium px-3.5 py-1.5 rounded-full border transition-colors cursor-pointer ${
                isDarkMode
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:text-black'
              }`}
            >
              Load Earlier Messages
            </button>
          </div>
        )}

        {/* Empty State when no messages exist */}
        {safeMessages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center my-auto py-16 text-center select-none">
            <BanterLogo className="w-16 h-16 mb-3 drop-shadow-sm" />
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              No messages yet
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs">
              Send a message below to start the conversation!
            </p>
          </div>
        ) : (
          /* Render messages with intelligent iOS date dividers */
          safeMessages.map((msg, index) => {
            if (!msg) return null;
            const prevMsg = index > 0 ? safeMessages[index - 1] : null;

            // Show date divider if first message or if gap is > 30 minutes
            const showDateDivider =
              !prevMsg ||
              Math.abs((msg.createdAt || 0) - (prevMsg?.createdAt || 0)) > 30 * 60 * 1000;

            return (
              <React.Fragment key={msg.id || index}>
                {showDateDivider && msg.createdAt && (
                  <div className="flex justify-center my-4 select-none">
                    <span className="text-[11.5px] font-medium text-neutral-400 dark:text-neutral-500 tracking-tight">
                      {formatDividerDate(msg.createdAt)}
                    </span>
                  </div>
                )}

                <MessageBubble
                  message={msg}
                  isSelf={msg.userId === currentUserId}
                  onReact={onReact}
                  onReplyTo={onReplyTo}
                  isDarkMode={isDarkMode}
                  allParticipantNames={participantNames}
                />
              </React.Fragment>
            );
          })
        )}

        {/* Real-time Typing Indicator (at bottom right before bottomRef) */}
        <TypingIndicator typingUsers={typingUsers} isDarkMode={isDarkMode} />

        <div ref={bottomRef} className="h-3" />
      </div>

      {/* Floating scroll to bottom button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className={`fixed bottom-24 right-8 p-2.5 rounded-full shadow-lg border transition-all cursor-pointer z-30 flex items-center justify-center animate-in fade-in ${
            isDarkMode
              ? 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700'
              : 'bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-100'
          }`}
          aria-label="Scroll to newest message"
        >
          <ArrowDown className="w-4 h-4 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};
