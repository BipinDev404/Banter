import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  return (
    <AnimatePresence>
      {validTypers.length > 0 && (() => {
        const firstUser = validTypers[0];
        const secondUser = validTypers[1];

        const firstUserName = firstUser?.userName || 'Someone';
        const secondUserName = secondUser?.userName || 'Someone';

        // Label clearly stating who is typing
        const label =
          validTypers.length === 1
            ? `${firstUserName} is typing...`
            : validTypers.length === 2
            ? `${firstUserName} and ${secondUserName} are typing...`
            : `${firstUserName} and ${validTypers.length - 1} others are typing...`;

        const avatar = getAvatarForUser(firstUser?.sessionId || firstUserName, firstUserName);

        return (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="flex flex-col items-start my-2.5 ml-1 select-none"
          >
            {/* Sender label */}
            <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 mb-1 ml-10 tracking-tight">
              {label}
            </span>

            <div className="flex items-end gap-2">
              {/* User Avatar */}
              <UserAvatar avatar={avatar} size="sm" />

              {/* Apple-style typing bubble with wave dots */}
              <div
                className={`rounded-[20px] rounded-bl-[4px] px-4 py-2.5 shadow-xs flex items-center gap-1.5 transition-colors ${
                  isDarkMode
                    ? 'bg-[#26252A] text-neutral-100 border border-white/5'
                    : 'bg-[#E9E9EB] text-neutral-900 border border-black/5'
                }`}
                aria-live="polite"
                aria-label={label}
              >
                <span className={`typing-dot ${isDarkMode ? 'bg-neutral-200' : 'bg-neutral-600'}`} />
                <span className={`typing-dot ${isDarkMode ? 'bg-neutral-200' : 'bg-neutral-600'}`} />
                <span className={`typing-dot ${isDarkMode ? 'bg-neutral-200' : 'bg-neutral-600'}`} />
              </div>
            </div>
          </motion.div>
        );
      })()}
    </AnimatePresence>
  );
};
