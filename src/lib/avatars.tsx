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
  Sparkles,
  User,
} from 'lucide-react';
import { CLAY_AVATARS_LIST, ClayAvatarId } from '../components/ClayAvatarSVG';

export interface AvatarProfile {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'group';
  clayId: ClayAvatarId;
  bgColor: string; // Soft pastel studio background
  description: string;
}

export const CLAY_CHARACTER_AVATARS: AvatarProfile[] = CLAY_AVATARS_LIST.map((c) => ({
  id: c.id,
  name: c.name,
  gender: c.gender,
  clayId: c.id,
  bgColor: c.bgColor,
  description: c.description,
}));

// Export backwards compatible avatar profile array
export const REAL_ICON_AVATARS: AvatarProfile[] = CLAY_CHARACTER_AVATARS;

/**
 * Assigns a 3D Clay Character avatar deterministically based on
 * the session ID or username so each user gets a vibrant clay avatar.
 */
export function getAvatarForUser(
  primaryKey?: string | null,
  userName?: string | null,
  avatarId?: string
): AvatarProfile {
  if (avatarId) {
    const found = CLAY_CHARACTER_AVATARS.find((a) => a.id === avatarId);
    if (found) return found;

    // Check if avatarId is a known clayId
    const foundByClay = CLAY_CHARACTER_AVATARS.find((a) => a.clayId === avatarId);
    if (foundByClay) return foundByClay;
  }

  // Combine primary key and userName into a stable hash seed
  const key = (primaryKey || '').trim();
  const name = (userName || '').trim();
  const seed = key || name || 'banter_user';

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }

  // Pick from user avatars (excluding group avatars for individual users)
  const userAvatars = CLAY_CHARACTER_AVATARS.filter((a) => a.gender !== 'group');
  const index = Math.abs(hash) % userAvatars.length;
  return userAvatars[index];
}

export function getGroupAvatar(avatarId?: string, groupName?: string): AvatarProfile {
  const groupAvatars = CLAY_CHARACTER_AVATARS.filter((a) => a.gender === 'group');

  if (avatarId) {
    const found = CLAY_CHARACTER_AVATARS.find((g) => g.id === avatarId);
    if (found) return found;
  }

  const seed = (groupName || 'Group').trim();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }

  const index = Math.abs(hash) % groupAvatars.length;
  return groupAvatars[index];
}

export interface TapbackReaction {
  id: string;
  name: string;
  iconName: string;
  colorClass: string;
  bgClass: string;
}

export const TAPBACK_REACTIONS: TapbackReaction[] = [
  { id: 'heart', name: 'Love', iconName: 'heart', colorClass: 'text-rose-500', bgClass: 'bg-rose-500/10' },
  { id: 'thumbsup', name: 'Like', iconName: 'thumbsup', colorClass: 'text-blue-500', bgClass: 'bg-blue-500/10' },
  { id: 'thumbsdown', name: 'Dislike', iconName: 'thumbsdown', colorClass: 'text-neutral-400', bgClass: 'bg-neutral-500/10' },
  { id: 'laugh', name: 'Haha', iconName: 'laugh', colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10' },
  { id: 'flame', name: 'Fire', iconName: 'flame', colorClass: 'text-orange-500', bgClass: 'bg-orange-500/10' },
  { id: 'star', name: 'Star', iconName: 'star', colorClass: 'text-yellow-500', bgClass: 'bg-yellow-500/10' },
  { id: 'alert', name: 'Alert', iconName: 'alert', colorClass: 'text-purple-500', bgClass: 'bg-purple-500/10' },
  { id: 'help', name: 'Question', iconName: 'help', colorClass: 'text-emerald-500', bgClass: 'bg-emerald-500/10' },
];

export function renderReactionIcon(reactionId: string, className = 'w-3.5 h-3.5') {
  switch (reactionId) {
    case 'heart':
    case '💖':
    case '❤️':
      return <Heart className={`${className} fill-rose-500 text-rose-500`} />;
    case 'thumbsup':
    case '👍':
      return <ThumbsUp className={`${className} fill-blue-500 text-blue-500`} />;
    case 'thumbsdown':
    case '👎':
      return <ThumbsDown className={`${className} fill-neutral-500 text-neutral-500`} />;
    case 'laugh':
    case 'haha':
    case '😂':
      return <Laugh className={`${className} text-amber-500`} />;
    case 'flame':
    case 'fire':
    case '⚡':
    case '🔥':
      return <Flame className={`${className} fill-orange-500 text-orange-500`} />;
    case 'star':
    case '✨':
    case '🌟':
      return <Star className={`${className} fill-yellow-500 text-yellow-500`} />;
    case 'alert':
    case 'exclamation':
    case '‼️':
      return <AlertCircle className={`${className} text-purple-500`} />;
    case 'help':
    case 'question':
    case '❓':
      return <HelpCircle className={`${className} text-emerald-500`} />;
    default:
      return <Sparkles className={`${className} text-blue-500`} />;
  }
}

export function renderAvatarIcon(iconKey: string, className = 'w-5 h-5') {
  return <User className={className} />;
}
