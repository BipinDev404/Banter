import React from 'react';
import { ChatMessage } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
  isSelf: boolean;
}

// Consistent subtle color based on username
function getSenderColor(name: string): string {
  const colors = [
    'text-sky-400',
    'text-emerald-400',
    'text-amber-400',
    'text-violet-400',
    'text-rose-400',
    'text-cyan-400',
    'text-teal-400',
    'text-pink-400',
    'text-indigo-400',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

function formatTime(timestamp: number): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isSelf }) => {
  const timeStr = formatTime(message.createdAt);
  const senderColor = getSenderColor(message.userName);

  if (isSelf) {
    return (
      <div className="flex flex-col items-end my-1.5 group">
        <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tr-xs bg-indigo-600 text-white px-4 py-2.5 shadow-sm shadow-indigo-950/40 relative">
          <p className="text-[14.5px] sm:text-[15px] leading-relaxed break-words whitespace-pre-wrap select-text font-normal tracking-[-0.012em]">
            {message.message}
          </p>
          <div className="flex items-center justify-end gap-1.5 mt-1 select-none">
            <span className="text-[10.5px] font-mono font-medium tracking-tight tabular-nums text-indigo-200/80">
              {timeStr}
            </span>
            {message.isOptimistic && (
              <span className="text-[10px] font-mono text-indigo-200/60">· sending</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start my-1.5 group">
      <span className={`text-[12px] font-display font-semibold tracking-tight mb-1 ml-1 ${senderColor}`}>
        {message.userName}
      </span>
      <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tl-xs bg-neutral-900 border border-neutral-800 text-neutral-100 px-4 py-2.5 shadow-sm shadow-black/40">
        <p className="text-[14.5px] sm:text-[15px] leading-relaxed break-words whitespace-pre-wrap select-text font-normal tracking-[-0.012em]">
          {message.message}
        </p>
        <div className="flex items-center justify-end gap-1 mt-1 select-none">
          <span className="text-[10.5px] font-mono font-medium tracking-tight tabular-nums text-neutral-500">
            {timeStr}
          </span>
        </div>
      </div>
    </div>
  );
};
