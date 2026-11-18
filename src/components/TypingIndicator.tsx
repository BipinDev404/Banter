import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TypingUser } from '../types';
import { getAvatarForUser } from '../lib/avatars';
import { UserAvatar } from './UserAvatar';

interface TypingIndicatorProps {
  typingUsers?: TypingUser[];
  isDarkMode?: boolean;
  instantExit?: boolean;
}

const typingRowVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: {
      height: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
      opacity: { duration: 0.18, ease: 'easeOut' as const },
    },
  },
  exit: (isInstant: boolean) => ({
    opacity: 0,
    height: 0,
    transition: isInstant
      ? { duration: 0.01 }
      : {
          height: { duration: 0.18, ease: [0.4, 0, 1, 1] as const },
          opacity: { duration: 0.12, ease: 'easeIn' as const },
        },
  }),
};

const typingBubbleVariants = {
  hidden: { scale: 0.9, y: 6 },
  visible: {
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: (isInstant: boolean) => ({
    scale: isInstant ? 0.96 : 0.9,
    y: isInstant ? 0 : 4,
    transition: { duration: isInstant ? 0.01 : 0.14 },
  }),
};

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers = [],
  isDarkMode = false,
  instantExit = false,
}) => {
  const validTypers = (typingUsers || []).filter(
    (u) => u && typeof u.userName === 'string' && u.userName.trim().length > 0
  );

  const firstUser = validTypers[0];
  const secondUser = validTypers[1];
  const firstUserName = firstUser?.userName || 'Someone';
  const secondUserName = secondUser?.userName || 'Someone';

  const label =
    validTypers.length === 1
      ? `${firstUserName} is typing`
      : validTypers.length === 2
      ? `${firstUserName} and ${secondUserName} are typing`
      : `${firstUserName} and ${validTypers.length - 1} others are typing`;

  const avatar = firstUser
    ? getAvatarForUser(firstUser.sessionId || firstUserName, firstUserName)
    : null;

  return (
    <AnimatePresence initial={false} custom={instantExit}>
      {validTypers.length > 0 && avatar && (
        <motion.div
          key="typing-indicator-row"
          custom={instantExit}
          variants={typingRowVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="overflow-hidden select-none"
        >
          <motion.div
            custom={instantExit}
            variants={typingBubbleVariants}
            style={{ transformOrigin: 'bottom left' }}
            className="flex items-start gap-2.5 my-2 sm:my-2.5"
          >
            {/* User Avatar aligned identically with MessageBubble */}
            <UserAvatar avatar={avatar} size="sm" className="mt-0.5 shrink-0" />

            <div className="flex flex-col items-start min-w-0">
              {/* Sender label */}
              <span className="text-[11.5px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1 ml-1 select-none tracking-tight">
                {label}
              </span>

              {/* Apple-style typing bubble aligned identically with incoming message bubble */}
              <div
                className={`rounded-[20px] rounded-tl-[4px] px-4 py-3 shadow-xs flex items-center gap-1.5 border-[0.5px] transition-colors ${
                  isDarkMode
                    ? 'bg-[#242426] text-neutral-100 border-white/10'
                    : 'bg-[#E9E9EB] text-neutral-900 border-black/5'
                }`}
                aria-live="polite"
                aria-label={label}
              >
                <span className={`typing-dot ${isDarkMode ? 'bg-neutral-300' : 'bg-neutral-600'}`} />
                <span className={`typing-dot ${isDarkMode ? 'bg-neutral-300' : 'bg-neutral-600'}`} />
                <span className={`typing-dot ${isDarkMode ? 'bg-neutral-300' : 'bg-neutral-600'}`} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
