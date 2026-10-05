import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, SystemNotification } from '../types';
import { MessageBubble } from './MessageBubble';
import { ArrowDown, Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
  systemNotifications: SystemNotification[];
  currentUserId: string;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  systemNotifications,
  currentUserId,
  loading,
  hasMore,
  onLoadMore,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isFirstLoadRef = useRef(true);

  // Auto-scroll logic: scroll to bottom on initial load and when near bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (loading && messages.length === 0) return;

    if (isFirstLoadRef.current && messages.length > 0) {
      scrollToBottom('auto');
      isFirstLoadRef.current = false;
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Check if user is scrolled near bottom (within 150px)
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 160) {
      scrollToBottom('smooth');
    }
  }, [messages, loading]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollBottom(distanceFromBottom > 240);
  };

  // Combine messages and recent system notifications into a chronological stream
  const combinedStream = React.useMemo(() => {
    type StreamItem =
      | { type: 'message'; data: ChatMessage; timestamp: number }
      | { type: 'notification'; data: SystemNotification; timestamp: number };

    const items: StreamItem[] = messages.map((m) => ({
      type: 'message',
      data: m,
      timestamp: m.createdAt,
    }));

    // Only include system notifications that occurred after the earliest message or within last 10 minutes
    const cutoff = messages.length > 0 ? messages[0].createdAt : Date.now() - 600000;
    systemNotifications.forEach((n) => {
      if (n.timestamp >= cutoff) {
        items.push({
          type: 'notification',
          data: n,
          timestamp: n.timestamp,
        });
      }
    });

    items.sort((a, b) => a.timestamp - b.timestamp);
    return items;
  }, [messages, systemNotifications]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-neutral-400">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500 mb-2" />
        <span className="text-sm font-medium tracking-tight">Connecting to Banter...</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-sm px-6 py-8 rounded-2xl bg-neutral-900/40 border border-neutral-800/60">
          <h2 className="text-2xl font-extrabold text-white mb-1.5 font-display tracking-tight text-balance">
            Welcome to Banter
          </h2>
          <p className="text-neutral-400 text-sm mb-4 font-normal">
            You&apos;re early.
          </p>
          <p className="text-xs text-indigo-400 font-display font-semibold tracking-wide uppercase">
            Start the conversation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-1 relative"
    >
      {/* Load older messages button if available */}
      {hasMore && (
        <div className="flex justify-center pb-3">
          <button
            onClick={onLoadMore}
            className="text-xs font-medium tracking-tight text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
          >
            Load older messages
          </button>
        </div>
      )}

      {/* Message and system notice list */}
      {combinedStream.map((item) => {
        if (item.type === 'notification') {
          return (
            <div
              key={item.data.id}
              className="flex justify-center my-2 text-[11px] font-mono font-medium tracking-tight text-neutral-500 select-none"
            >
              <span>{item.data.text}</span>
            </div>
          );
        }

        const msg = item.data;
        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            isSelf={msg.userId === currentUserId}
          />
        );
      })}

      <div ref={bottomRef} className="h-1" />

      {/* Floating scroll to bottom button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="fixed bottom-20 right-6 p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 shadow-lg border border-neutral-700/80 transition-all cursor-pointer z-20 flex items-center justify-center animate-in fade-in"
          aria-label="Scroll to newest message"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
