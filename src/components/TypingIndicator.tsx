import React from 'react';
import { TypingUser } from '../types';
import { getAvatarForUser } from '../lib/avatars';
import { UserAvatar } from './UserAvatar';

interface TypingIndicatorProps {
  typingUsers?: TypingUser[];
  isDarkMode?: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers = [],
  isDarkMode = false,
}) => {
  // Filter for valid items with a string userName
  const validTypers = (typingUsers || []).filter(
    (u) => u && typeof u.userName === 'string' && u.userName.trim().length > 0
  );

  if (validTypers.length === 0) return null;

  const firstUser = validTypers[0];
  const secondUser = validTypers[1];

  const firstUserName = firstUser?.userName || 'Someone';
  const secondUserName = secondUser?.userName || 'Someone';

  // Single or multiple user label
  const label =
    validTypers.length === 1
      ? `${firstUserName} is typing...`
      : validTypers.length === 2
      ? `${firstUserName} and ${secondUserName} are typing...`
      : `${firstUserName} and ${validTypers.length - 1} others are typing...`;

  const avatar = getAvatarForUser(firstUser?.sessionId || firstUserName, firstUserName);

  return (
    <div className="flex flex-col items-start my-2 animate-in fade-in slide-in-from-bottom-2 duration-200 select-none">
      {/* Sender name label */}
      <span className="text-[11.5px] font-medium text-neutral-400 dark:text-neutral-500 mb-1 ml-10">
        {label}
      </span>

      <div className="flex items-end gap-2">
        {/* Real Vector Icon Avatar */}
        <UserAvatar avatar={avatar} size="sm" />

        {/* Authentic Apple iMessage Typing Bubble with animated wave dots */}
        <div
          className={`rounded-[18px] rounded-bl-[4px] px-3.5 py-2.5 shadow-xs flex items-center gap-1.5 transition-colors ${
            isDarkMode
              ? 'bg-[#26252A] text-neutral-100'
              : 'bg-[#E9E9EB] text-neutral-900'
          }`}
          aria-live="polite"
          aria-label={label}
        >
          <span className={`typing-dot ${isDarkMode ? 'bg-neutral-300' : 'bg-neutral-500'}`} />
          <span className={`typing-dot ${isDarkMode ? 'bg-neutral-300' : 'bg-neutral-500'}`} />
          <span className={`typing-dot ${isDarkMode ? 'bg-neutral-300' : 'bg-neutral-500'}`} />
        </div>
      </div>
    </div>
  );
};
