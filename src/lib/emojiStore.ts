import { useState, useEffect, useCallback } from 'react';

export const MOST_USED_EMOJIS: string[] = [
  '🔥', '😂', '❤️', '👍', '😍', '✨', '🎉', '💯', '👏', '🙌', '🥺', '😭'
];

export const DEFAULT_RECENT_EMOJIS: string[] = [
  '😂', '❤️', '🔥', '👍', '✨', '😍', '🎉', '👏'
];

export interface EmojiCategory {
  id: string;
  name: string;
  iconName: string;
  emojis: string[];
}

export const ALL_EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'faces',
    name: 'Smileys & Faces',
    iconName: 'Smile',
    emojis: [
      '😊', '😂', '🤣', '🥰', '😍', '😎', '😋', '🥳', '🤔', '🤤', 
      '😴', '🥱', '😇', '🤪', '🤠', '🤫', '🤐', '🤭', '😏', '😬', 
      '🤥', '🥺', '😭', '😱', '🤯', '😡', '🤬', '🤢', '🤩', '🤗'
    ],
  },
  {
    id: 'hands',
    name: 'Hands & Gestures',
    iconName: 'ThumbsUp',
    emojis: [
      '👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '🤙', '👊', '✊', 
      '🤛', '🤜', '👈', '👉', '👆', '👇', '✋', '🖐️', '🤘', '🤟', 
      '🙏', '💪', '👋', '✍️', '💅', '🫶'
    ],
  },
  {
    id: 'hearts',
    name: 'Hearts & Love',
    iconName: 'Heart',
    emojis: [
      '❤️', '💖', '💗', '💓', '💞', '💘', '💝', '💟', '🧡', '💛', 
      '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '💌', '❣️', '🔥', 
      '⭐', '🌟', '✨', '⚡', '💥', '💫'
    ],
  },
  {
    id: 'fun',
    name: 'Fun & Celebrations',
    iconName: 'Sparkles',
    emojis: [
      '🎉', '🎊', '🎈', '🎂', '🥂', '🍻', '🏆', '🥇', '🎯', '💯', 
      '🚀', '🍕', '🍔', '🍟', '🍦', '☕', '🎮', '🕹️', '🎵', '🎶', 
      '🎸', '🌈', '🍀', '☀️', '🌸', '👑', '💎', '🍿'
    ],
  },
  {
    id: 'objects',
    name: 'Objects & Symbols',
    iconName: 'Flame',
    emojis: [
      '💡', '🔔', '📢', '💬', '💭', '📱', '💻', '📷', '✈️', '🏝️', 
      '🚗', '🛵', '🚲', '⏰', '⏳', '🔑', '🔒', '🎁', '📦', '📌', 
      '✅', '❌', '⚠️', '⚡', '☀️', '🌙', '🪄', '🔮'
    ],
  },
];

const STORAGE_KEY = 'banter_recent_emojis_v1';
const EVENT_NAME = 'banter:emoji-used';

export function getRecentEmojis(): string[] {
  if (typeof window === 'undefined') return DEFAULT_RECENT_EMOJIS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RECENT_EMOJIS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 18);
    }
    return DEFAULT_RECENT_EMOJIS;
  } catch {
    return DEFAULT_RECENT_EMOJIS;
  }
}

export function recordRecentEmoji(emoji: string): void {
  if (!emoji || typeof window === 'undefined') return;
  try {
    const current = getRecentEmojis();
    // Move to front, remove duplicates
    const filtered = current.filter((e) => e !== emoji);
    const updated = [emoji, ...filtered].slice(0, 18);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch global event for instant sync across all open modals, trays, and bubbles
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { emoji, updated } }));
  } catch (err) {
    console.warn('Could not save recent emoji:', err);
  }
}

export function useRecentEmojis(): {
  recentEmojis: string[];
  trackEmoji: (emoji: string) => void;
  mostUsedEmojis: string[];
} {
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => getRecentEmojis());

  useEffect(() => {
    const handleEmojiEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ emoji: string; updated: string[] }>;
      if (customEvent.detail && Array.isArray(customEvent.detail.updated)) {
        setRecentEmojis(customEvent.detail.updated);
      } else {
        setRecentEmojis(getRecentEmojis());
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setRecentEmojis(getRecentEmojis());
      }
    };

    window.addEventListener(EVENT_NAME, handleEmojiEvent);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener(EVENT_NAME, handleEmojiEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const trackEmoji = useCallback((emoji: string) => {
    recordRecentEmoji(emoji);
  }, []);

  return {
    recentEmojis,
    trackEmoji,
    mostUsedEmojis: MOST_USED_EMOJIS,
  };
}
