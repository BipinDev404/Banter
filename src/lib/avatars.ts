// High-fidelity Memoji / iOS Avatar helper for authentic iMessage look

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
  { id: 'bear', name: 'Teddy', emoji: '🐻', bgColor: 'bg-[#E2E8F0]' },
  { id: 'cat', name: 'Mochi', emoji: '🐱', bgColor: 'bg-[#FEF08A]' },
];

export function getAvatarForUser(userName?: string | null, avatarId?: string): AvatarProfile {
  if (avatarId) {
    const found = PRESET_AVATARS.find((a) => a.id === avatarId);
    if (found) return found;
  }

  const safeName = (userName || 'Anonymous').trim();

  // Deterministic fallback based on hash of name
  let hash = 0;
  for (let i = 0; i < safeName.length; i++) {
    hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PRESET_AVATARS.length;
  return PRESET_AVATARS[index];
}

export const TAPBACK_EMOJIS = [
  { id: 'heart', emoji: '💖', label: 'Love' },
  { id: 'thumbsup', emoji: '👍', label: 'Like' },
  { id: 'thumbsdown', emoji: '👎', label: 'Dislike' },
  { id: 'haha', emoji: '😂', label: 'Haha' },
  { id: 'exclamation', emoji: '‼️', label: 'Emphasize' },
  { id: 'question', emoji: '❓', label: 'Question' },
];
