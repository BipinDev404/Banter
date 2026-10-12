import { useState, useEffect, useCallback } from 'react';

export const MOST_USED_EMOJIS = [
  '❤️', '😂', '👍', '🔥', '🎉', '🥺', '🙌', '💯', '✨', '😍', '👏', '🚀'
];

export const ALL_EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys & Faces',
    icon: '😄',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
      '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
      '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
      '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓',
      '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦',
      '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
      '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿'
    ]
  },
  {
    id: 'gestures',
    name: 'Hands & Gestures',
    icon: '👍',
    emojis: [
      '👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋',
      '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✍️', '💅', '👊',
      '✊', '🤛', '🤜', '💪', '🦾', '👂', '👃', '👀', '👁️', '🧠'
    ]
  },
  {
    id: 'hearts',
    name: 'Hearts & Love',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌',
      '💋', '💍', '💎', '💐', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻'
    ]
  },
  {
    id: 'vibes',
    name: 'Fun, Celebrations & Vibes',
    icon: '🔥',
    emojis: [
      '🔥', '✨', '⭐', '🌟', '💫', '⚡', '💥', '💯', '🎯', '🚀',
      '🎉', '🎊', '🎈', '🎂', '🥂', '🍻', '🍺', '🍾', '🏆', '🥇',
      '🥈', '🥉', '👑', '🍕', '🍔', '🍟', '🌮', '🍣', '🍩', '🍪',
      '☕', '🍵', '🥤', '🎮', '🎵', '🎶', '🎸', '🎤', '🎧', '🌈',
      '☀️', '🌙', '🍀', '🐾', '⚽', '🏀', '🏈', '⚾', '🎾', '🥇'
    ]
  }
];

const RECENT_STORAGE_KEY = 'banter_recent_emojis_v1';
const RECENT_EVENT_NAME = 'banter_recent_emojis_changed';

export function getStoredRecentEmojis(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read recent emojis from storage:', err);
  }
  return MOST_USED_EMOJIS.slice(0, 8);
}

export function saveStoredRecentEmoji(emoji: string) {
  if (!emoji) return;
  try {
    const current = getStoredRecentEmojis();
    // Prepend emoji, remove duplicates, limit to 20
    const updated = [emoji, ...current.filter((e) => e !== emoji)].slice(0, 20);
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(RECENT_EVENT_NAME, { detail: updated }));
    }
  } catch (err) {
    console.error('Failed to save recent emoji:', err);
  }
}

/**
 * Shared hook that provides reactive synced recently used emojis
 * and most used emojis across all chat components.
 */
export function useRecentEmojis() {
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => getStoredRecentEmojis());

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setRecentEmojis(e.detail);
      } else {
        setRecentEmojis(getStoredRecentEmojis());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === RECENT_STORAGE_KEY) {
        setRecentEmojis(getStoredRecentEmojis());
      }
    };

    window.addEventListener(RECENT_EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(RECENT_EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const recordEmojiUse = useCallback((emoji: string) => {
    saveStoredRecentEmoji(emoji);
    setRecentEmojis((prev) => [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 20));
  }, []);

  return {
    recentEmojis,
    mostUsedEmojis: MOST_USED_EMOJIS,
    recordEmojiUse,
  };
}
