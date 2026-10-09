import React from 'react';
import { AvatarProfile } from '../lib/avatars';
import { ClayAvatarSVG } from './ClayAvatarSVG';

interface UserAvatarProps {
  avatar?: AvatarProfile;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showStatus?: boolean;
  showOnlineBadge?: boolean;
  isOnline?: boolean;
}

const SIZE_MAP = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-20 h-20',
};

const DOT_SIZE_MAP = {
  xs: 'w-2 h-2 border-[1.5px]',
  sm: 'w-2.5 h-2.5 border-2',
  md: 'w-3 h-3 border-2',
  lg: 'w-3.5 h-3.5 border-2',
  xl: 'w-4 h-4 border-2',
  '2xl': 'w-5 h-5 border-2',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  size = 'md',
  className = '',
  showStatus = false,
  showOnlineBadge = false,
  isOnline = false,
}) => {
  const sizeClasses = SIZE_MAP[size] || SIZE_MAP.md;
  const dotClasses = DOT_SIZE_MAP[size] || DOT_SIZE_MAP.md;
  const renderBadge = showStatus || showOnlineBadge;

  const clayId = avatar?.clayId || avatar?.id || 'h_alex';

  return (
    <div className={`relative inline-block shrink-0 select-none ${sizeClasses} ${className}`}>
      {/* 3D Human Avatar Character Vector */}
      <ClayAvatarSVG clayId={clayId} className="w-full h-full" />

      {/* Online Status Dot */}
      {renderBadge && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ${
            isOnline ? 'bg-emerald-500 ring-2 ring-emerald-400/30' : 'bg-neutral-500'
          } border-black dark:border-black ${dotClasses}`}
        />
      )}
    </div>
  );
};
