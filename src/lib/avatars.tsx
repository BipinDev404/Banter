import React from 'react';
import {
  Heart,
  ThumbsUp,
  ThumbsDown,
  Laugh,
  Flame,
  Star,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  User,
} from 'lucide-react';

export interface AvatarProfile {
  id: string;
  name: string;
  initial: string;
  gender: 'male' | 'female' | 'group';
  clayId: string;
  gradient: string;
  bgColor: string; // Hex color fallback
  description: string;
}

export const AVATAR_PALETTE: AvatarProfile[] = [
  { id: 'h_alex', name: 'Alex', initial: 'A', gender: 'male', clayId: 'h_alex', gradient: 'from-blue-500 to-indigo-600', bgColor: '#007AFF', description: 'Techie' },
  { id: 'h_sarah', name: 'Sarah', initial: 'S', gender: 'female', clayId: 'h_sarah', gradient: 'from-pink-500 to-purple-600', bgColor: '#EC4899', description: 'Designer' },
  { id: 'h_marco', name: 'Marco', initial: 'M', gender: 'male', clayId: 'h_marco', gradient: 'from-emerald-400 to-teal-600', bgColor: '#10B981', description: 'Architect' },
  { id: 'h_taylor', name: 'Taylor', initial: 'T', gender: 'female', clayId: 'h_taylor', gradient: 'from-purple-500 to-indigo-600', bgColor: '#8B5CF6', description: 'Creator' },
  { id: 'h_dennis', name: 'Dennis', initial: 'D', gender: 'male', clayId: 'h_dennis', gradient: 'from-orange-500 to-amber-600', bgColor: '#F97316', description: 'Gamer' },
  { id: 'h_lisa', name: 'Lisa', initial: 'L', gender: 'female', clayId: 'h_lisa', gradient: 'from-cyan-400 to-blue-600', bgColor: '#06B6D4', description: 'Adventurer' },
  { id: 'h_sam', name: 'Sam', initial: 'S', gender: 'male', clayId: 'h_sam', gradient: 'from-indigo-500 to-blue-700', bgColor: '#6366F1', description: 'Musician' },
  { id: 'h_maya', name: 'Maya', initial: 'M', gender: 'female', clayId: 'h_maya', gradient: 'from-fuchsia-500 to-purple-600', bgColor: '#D946EF', description: 'Artist' },
  { id: 'h_david', name: 'David', initial: 'D', gender: 'male', clayId: 'h_david', gradient: 'from-sky-400 to-blue-600', bgColor: '#0EA5E9', description: 'Strategist' },
  { id: 'h_chloe', name: 'Chloe', initial: 'C', gender: 'female', clayId: 'h_chloe', gradient: 'from-rose-500 to-pink-600', bgColor: '#F43F5E', description: 'Photographer' },
  { id: 'h_leo', name: 'Leo', initial: 'L', gender: 'male', clayId: 'h_leo', gradient: 'from-red-500 to-rose-700', bgColor: '#EF4444', description: 'Traveler' },
  { id: 'h_zara', name: 'Zara', initial: 'Z', gender: 'female', clayId: 'h_zara', gradient: 'from-violet-600 to-purple-800', bgColor: '#7C3AED', description: 'Founder' },
  { id: 'h_ryan', name: 'Ryan', initial: 'R', gender: 'male', clayId: 'h_ryan', gradient: 'from-slate-500 to-zinc-700', bgColor: '#64748B', description: 'Developer' },
  { id: 'h_emma', name: 'Emma', initial: 'E', gender: 'female', clayId: 'h_emma', gradient: 'from-teal-400 to-emerald-600', bgColor: '#14B8A6', description: 'Explorer' },
  { id: 'h_noah', name: 'Noah', initial: 'N', gender: 'male', clayId: 'h_noah', gradient: 'from-yellow-400 to-amber-600', bgColor: '#EAB308', description: 'Skater' },
  { id: 'h_zoe', name: 'Zoe', initial: 'Z', gender: 'female', clayId: 'h_zoe', gradient: 'from-amber-400 to-orange-500', bgColor: '#FF8A65', description: 'Blogger' },
  { id: 'h_kai', name: 'Kai', initial: 'K', gender: 'male', clayId: 'h_kai', gradient: 'from-green-500 to-emerald-700', bgColor: '#22C55E', description: 'Athlete' },
  { id: 'h_nina', name: 'Nina', initial: 'N', gender: 'female', clayId: 'h_nina', gradient: 'from-rose-400 to-red-600', bgColor: '#FF6B6B', description: 'Student' },
  { id: 'g_squad', name: 'Banter Squad', initial: 'G', gender: 'group', clayId: 'g_squad', gradient: 'from-purple-600 to-indigo-800', bgColor: '#7E57C2', description: 'Group Chat' },
  { id: 'g_party', name: 'Party Pack', initial: 'P', gender: 'group', clayId: 'g_party', gradient: 'from-teal-500 to-emerald-700', bgColor: '#26A69A', description: 'Party Group' },
];

export const CLAY_CHARACTER_AVATARS = AVATAR_PALETTE;
export const REAL_ICON_AVATARS = AVATAR_PALETTE;

/**
 * Assigns a 3D human character avatar deterministically based on
 * primaryKey (sessionId/userId) and userName so EVERY user gets a unique 3D human character.
 */
export function getAvatarForUser(
  primaryKey?: string | null,
  userName?: string | null,
  avatarId?: string
): AvatarProfile {
  const cleanName = (userName || '').trim();
  const initial = cleanName ? cleanName.charAt(0).toUpperCase() : '?';

  // If explicit 3D human avatar selected
  if (avatarId) {
    const found = AVATAR_PALETTE.find((a) => a.id === avatarId || a.clayId === avatarId);
    if (found) {
      return { ...found, initial };
    }
  }

  // Combine primaryKey AND userName into a stable, distinct hash seed
  const key = (primaryKey || '').trim();
  const seed = key && cleanName ? `${key}_${cleanName}` : key || cleanName || 'banter_user';

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }

  // Exclude group avatars for individual users
  const userAvatars = AVATAR_PALETTE.filter((a) => a.gender !== 'group');
  const index = Math.abs(hash) % userAvatars.length;
  const base = userAvatars[index];

  return {
    ...base,
    initial,
  };
}

export function getGroupAvatar(avatarId?: string, groupName?: string): AvatarProfile {
  const groupAvatars = AVATAR_PALETTE.filter((a) => a.gender === 'group');

  if (avatarId) {
    const found = AVATAR_PALETTE.find((g) => g.id === avatarId);
    if (found) return found;
  }

  const cleanName = (groupName || 'Group').trim();
  const initial = cleanName ? cleanName.charAt(0).toUpperCase() : 'G';

  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }

  const index = Math.abs(hash) % groupAvatars.length;
  const base = groupAvatars[index];

  return {
    ...base,
    initial,
  };
}

export interface TapbackReaction {
  id: string;
  emoji: string;
  name: string;
  iconName: string;
  colorClass: string;
  bgClass: string;
}

export const TAPBACK_REACTIONS: TapbackReaction[] = [
  { id: 'heart', emoji: '❤️', name: 'Love', iconName: 'heart', colorClass: 'text-rose-500', bgClass: 'bg-rose-500/10' },
  { id: 'thumbsup', emoji: '👍', name: 'Like', iconName: 'thumbsup', colorClass: 'text-blue-500', bgClass: 'bg-blue-500/10' },
  { id: 'thumbsdown', emoji: '👎', name: 'Dislike', iconName: 'thumbsdown', colorClass: 'text-neutral-400', bgClass: 'bg-neutral-500/10' },
  { id: 'laugh', emoji: '😂', name: 'Haha', iconName: 'laugh', colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10' },
  { id: 'exclamation', emoji: '‼️', name: 'Exclamation', iconName: 'alert', colorClass: 'text-rose-500', bgClass: 'bg-rose-500/10' },
  { id: 'question', emoji: '❓', name: 'Question', iconName: 'help', colorClass: 'text-blue-500', bgClass: 'bg-blue-500/10' },
  { id: 'flame', emoji: '🔥', name: 'Fire', iconName: 'flame', colorClass: 'text-orange-500', bgClass: 'bg-orange-500/10' },
  { id: 'party', emoji: '🎉', name: 'Party', iconName: 'party', colorClass: 'text-purple-500', bgClass: 'bg-purple-500/10' },
];

export function renderReactionIcon(reactionId: string, sizeClass = 'text-lg') {
  switch (reactionId) {
    case 'heart':
    case '❤️':
    case '💖':
      return <span className={`${sizeClass} leading-none font-apple-emoji select-none drop-shadow-xs`}>❤️</span>;
    case 'thumbsup':
    case '👍':
      return <span className={`${sizeClass} leading-none font-apple-emoji select-none drop-shadow-xs`}>👍</span>;
    case 'thumbsdown':
    case '👎':
      return <span className={`${sizeClass} leading-none font-apple-emoji select-none drop-shadow-xs`}>👎</span>;
    case 'laugh':
    case 'haha':
    case '😂':
      return <span className={`${sizeClass} leading-none font-apple-emoji select-none drop-shadow-xs`}>😂</span>;
    case 'exclamation':
    case 'alert':
    case '‼️':
      return <span className={`${sizeClass} leading-none font-apple-emoji select-none drop-shadow-xs`}>‼️</span>;
    case 'question':
    case 'help':
    case '❓':
      return <span className={`${sizeClass} leading-none font-apple-emoji select-none drop-shadow-xs`}>❓</span>;
    case 'flame':
    case 'fire':
    case '🔥':
      return <span className={`${sizeClass} leading-none font-apple-emoji select-none drop-shadow-xs`}>🔥</span>;
    case 'party':
    case '🎉':
      return <span className={`${sizeClass} leading-none font-apple-emoji select-none drop-shadow-xs`}>🎉</span>;
    case 'star':
    case '✨':
      return <span className={`${sizeClass} leading-none font-apple-emoji select-none drop-shadow-xs`}>✨</span>;
    default:
      return <span className={`${sizeClass} leading-none font-apple-emoji select-none drop-shadow-xs`}>{reactionId}</span>;
  }
}

export function renderAvatarIcon(iconKey: string, className = 'w-5 h-5') {
  return <User className={className} />;
}
