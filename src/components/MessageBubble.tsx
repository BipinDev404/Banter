import React, { useState } from 'react';
import { ChatMessage } from '../types';
import { getAvatarForUser, TAPBACK_EMOJIS } from '../lib/avatars';
import { Reply } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  isSelf: boolean;
  onReact: (messageId: string, emoji: string) => void;
  onReplyTo: (userName: string, textSnippet: string) => void;
  isDarkMode?: boolean;
  allParticipantNames?: string[];
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

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSelf,
  onReact,
  onReplyTo,
  isDarkMode = false,
  allParticipantNames = [],
}) => {
  const [showTapbackPicker, setShowTapbackPicker] = useState(false);

  if (!message) return null;

  const safeUserName = message.userName || 'Anonymous';
  const avatar = getAvatarForUser(safeUserName, message.avatarId);
  const formattedTime = formatMessageTime(message.createdAt);

  // Helper to highlight participant names in bold, matching the iMessage reference
  const renderMessageContent = (text: string) => {
    if (!text) return null;

    // List of known names to highlight
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
    setShowTapbackPicker(false);
  };

  const hasReactions = Array.isArray(message.reactions) && message.reactions.length > 0;

  return (
    <div className={`flex flex-col relative group my-2.5 sm:my-3.5 select-text ${isSelf ? 'items-end' : 'items-start'}`}>
      {/* Floating Apple Tapback Picker Bar */}
      {showTapbackPicker && (
        <div
          className={`absolute -top-12 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-xl border animate-in zoom-in-95 duration-150 ${
            isSelf ? 'right-2' : 'left-9'
          } ${
            isDarkMode
              ? 'bg-neutral-800/95 border-neutral-700 text-white backdrop-blur-md'
              : 'bg-white/95 border-neutral-200 text-neutral-900 backdrop-blur-md'
          }`}
        >
          {TAPBACK_EMOJIS.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelectReaction(t.emoji)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:scale-125 transition-transform active:scale-95 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700"
              title={t.label}
            >
              <span>{t.emoji}</span>
            </button>
          ))}
          <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-700 mx-0.5" />
          <button
            onClick={() => {
              onReplyTo(safeUserName, message.message || '');
              setShowTapbackPicker(false);
            }}
            className="px-2 py-1 rounded-full text-xs font-medium text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-1 cursor-pointer"
            title="Inline Reply"
          >
            <Reply className="w-3.5 h-3.5" />
            <span>Reply</span>
          </button>
        </div>
      )}

      {/* Outgoing Message (Current User) */}
      {isSelf ? (
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-[78%] relative">
          {/* Reaction badges positioned on top of the bubble */}
          {hasReactions && (
            <div className="relative -mb-3 z-10 mr-3 flex items-center gap-0.5">
              <div
                onClick={() => setShowTapbackPicker(!showTapbackPicker)}
                className={`px-2 py-0.5 rounded-full border shadow-sm flex items-center gap-0.5 cursor-pointer select-none transition-transform hover:scale-105 active:scale-95 ${
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

          {/* Blue Bubble */}
          <div
            onDoubleClick={() => setShowTapbackPicker(!showTapbackPicker)}
            className="rounded-[20px] rounded-br-[4px] bg-[#007AFF] text-white px-4 py-2.5 shadow-xs relative cursor-pointer active:opacity-95"
            title="Double-click to react"
          >
            <p className="text-[15px] sm:text-[15.5px] leading-[1.36] break-words whitespace-pre-wrap font-normal tracking-[-0.015em]">
              {renderMessageContent(message.message || '')}
            </p>
          </div>

          {/* Timestamp and "Read" Receipt underneath sent message */}
          <div className="flex items-center justify-end gap-1.5 mt-1 mr-1 select-none">
            {formattedTime && (
              <span className="text-[10px] sm:text-[10.5px] text-neutral-400 dark:text-neutral-500 font-normal">
                {formattedTime}
              </span>
            )}
            <span className="text-[10px] text-neutral-300 dark:text-neutral-700">•</span>
            {message.isOptimistic ? (
              <span className="text-[10px] text-neutral-400 font-medium">Sending...</span>
            ) : (
              <span className="text-[10.5px] text-neutral-400 font-normal">Read</span>
            )}
          </div>
        </div>
      ) : (
        /* Incoming Message (Other Users) */
        <div className="flex items-end gap-2 max-w-[88%] sm:max-w-[82%] relative">
          {/* Memoji Avatar Circle on bottom-left */}
          <div
            className={`w-8 h-8 rounded-full ${avatar.bgColor} border border-black/5 dark:border-white/10 flex items-center justify-center text-lg shrink-0 shadow-xs select-none`}
            title={safeUserName}
          >
            <span>{avatar.emoji}</span>
          </div>

          <div className="flex flex-col items-start relative">
            {/* Sender Name above the bubble */}
            <span className="text-[11.5px] font-medium text-neutral-500 dark:text-neutral-400 mb-1 ml-1 select-none">
              {safeUserName}
            </span>

            {/* Reaction badges positioned on top of the incoming bubble */}
            {hasReactions && (
              <div className="relative -mb-3.5 z-10 ml-3 flex items-center gap-0.5">
                <div
                  onClick={() => setShowTapbackPicker(!showTapbackPicker)}
                  className={`px-2 py-0.5 rounded-full border shadow-sm flex items-center gap-0.5 cursor-pointer select-none transition-transform hover:scale-105 active:scale-95 ${
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

            {/* Apple Gray Bubble */}
            <div
              onDoubleClick={() => setShowTapbackPicker(!showTapbackPicker)}
              className={`rounded-[20px] rounded-bl-[4px] px-4 py-2.5 shadow-xs relative cursor-pointer active:opacity-95 ${
                isDarkMode
                  ? 'bg-[#26252A] text-neutral-100'
                  : 'bg-[#E9E9EB] text-neutral-900'
              }`}
              title="Double-click to react"
            >
              <p className="text-[15px] sm:text-[15.5px] leading-[1.36] break-words whitespace-pre-wrap font-normal tracking-[-0.015em]">
                {renderMessageContent(message.message || '')}
              </p>
            </div>

            {/* Timestamp underneath received message */}
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
  );
};
