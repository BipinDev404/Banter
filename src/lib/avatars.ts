// Colorful, expressive avatars randomized deterministically by Session ID or Username

export interface AvatarProfile {
  id: string;
  name: string;
  emoji: string;
  bgColor: string;
  textColor?: string;
}

export const PRESET_AVATARS: AvatarProfile[] = [
  { id: 'alex', name: 'Alex', emoji: '🧑🏽', bgColor: 'bg-[#F2DFD3]' },
  { id: 'sarah', name: 'Sarah', emoji: '👩🏼', bgColor: 'bg-[#E5E0FA]' },
  { id: 'danny', name: 'Danny', emoji: '🧔🏻', bgColor: 'bg-[#DFEAF8]' },
  { id: 'taylor', name: 'Taylor', emoji: '👩🏽', bgColor: 'bg-[#FFE6D9]' },
  { id: 'jordan', name: 'Jordan', emoji: '🧑🏻‍🦱', bgColor: 'bg-[#E3F2DF]' },
  { id: 'sam', name: 'Sam', emoji: '🧑🏼', bgColor: 'bg-[#FFF0D4]' },
  { id: 'marco', name: 'Marco', emoji: '👨🏽', bgColor: 'bg-[#FEE2E2]' },
  { id: 'maya', name: 'Maya', emoji: '👧🏽', bgColor: 'bg-[#F5D0FE]' },
  { id: 'fox', name: 'Fox', emoji: '🦊', bgColor: 'bg-[#FFEDD5]' },
  { id: 'panda', name: 'Panda', emoji: '🐼', bgColor: 'bg-[#E2E8F0]' },
];

export const COLORFUL_AVATARS: AvatarProfile[] = [
  { id: 'c_fox', name: 'Fox', emoji: '🦊', bgColor: 'bg-[#FFEDD5]' },
  { id: 'c_panda', name: 'Panda', emoji: '🐼', bgColor: 'bg-[#F1F5F9]' },
  { id: 'c_lion', name: 'Lion', emoji: '🦁', bgColor: 'bg-[#FEF08A]' },
  { id: 'c_koala', name: 'Koala', emoji: '🐨', bgColor: 'bg-[#E2E8F0]' },
  { id: 'c_tiger', name: 'Tiger', emoji: '🐯', bgColor: 'bg-[#FED7AA]' },
  { id: 'c_unicorn', name: 'Unicorn', emoji: '🦄', bgColor: 'bg-[#FBCFE8]' },
  { id: 'c_dolphin', name: 'Dolphin', emoji: '🐬', bgColor: 'bg-[#BAE6FD]' },
  { id: 'c_owl', name: 'Owl', emoji: '🦉', bgColor: 'bg-[#E9D5FF]' },
  { id: 'c_penguin', name: 'Penguin', emoji: '🐧', bgColor: 'bg-[#E0F2FE]' },
  { id: 'c_butterfly', name: 'Butterfly', emoji: '🦋', bgColor: 'bg-[#DDD6FE]' },
  { id: 'c_bear', name: 'Teddy', emoji: '🐻', bgColor: 'bg-[#FDE68A]' },
  { id: 'c_cat', name: 'Mochi', emoji: '🐱', bgColor: 'bg-[#FEF9C3]' },
  { id: 'c_dog', name: 'Pup', emoji: '🐶', bgColor: 'bg-[#FFEDD5]' },
  { id: 'c_rabbit', name: 'Bunny', emoji: '🐰', bgColor: 'bg-[#FCE7F3]' },
  { id: 'c_astro', name: 'Cosmo', emoji: '🧑‍🚀', bgColor: 'bg-[#C7D2FE]' },
  { id: 'c_rocker', name: 'Star', emoji: '🧑‍🎤', bgColor: 'bg-[#F5D0FE]' },
  { id: 'c_wizard', name: 'Mage', emoji: '🧙', bgColor: 'bg-[#E9D5FF]' },
  { id: 'c_artist', name: 'Artist', emoji: '🎨', bgColor: 'bg-[#FED7AA]' },
  { id: 'c_sparkles', name: 'Sparkle', emoji: '✨', bgColor: 'bg-[#FEF08A]' },
  { id: 'c_fire', name: 'Blaze', emoji: '⚡', bgColor: 'bg-[#FDE047]' },
  { id: 'c_flower', name: 'Petal', emoji: '🌸', bgColor: 'bg-[#FBCFE8]' },
  { id: 'c_avocado', name: 'Avocado', emoji: '🥑', bgColor: 'bg-[#BBF7D0]' },
  { id: 'c_rocket', name: 'Rocket', emoji: '🚀', bgColor: 'bg-[#BFDBFE]' },
  { id: 'c_octopus', name: 'Inky', emoji: '🐙', bgColor: 'bg-[#FECDD3]' },
];

/**
 * Assigns a randomized colorful avatar deterministically based on
 * the session ID or username so each user gets a vibrant, consistent personal icon.
 */
export function getAvatarForUser(
  primaryKey?: string | null,
  userName?: string | null,
  avatarId?: string
): AvatarProfile {
  if (avatarId) {
    const found =
      PRESET_AVATARS.find((a) => a.id === avatarId) ||
      COLORFUL_AVATARS.find((a) => a.id === avatarId);
    if (found) return found;
  }

  // Combine primary key (e.g. sessionId or userId) and userName into a stable seed
  const key = (primaryKey || '').trim();
  const name = (userName || '').trim();
  const seed = key || name || 'banter_user';

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }

  const index = Math.abs(hash) % COLORFUL_AVATARS.length;
  return COLORFUL_AVATARS[index];
}

export const TAPBACK_EMOJIS = [
  { id: 'heart', emoji: '💖', label: 'Love' },
  { id: 'thumbsup', emoji: '👍', label: 'Like' },
  { id: 'thumbsdown', emoji: '👎', label: 'Dislike' },
  { id: 'haha', emoji: '😂', label: 'Haha' },
  { id: 'exclamation', emoji: '‼️', label: 'Emphasize' },
  { id: 'question', emoji: '❓', label: 'Question' },
];
