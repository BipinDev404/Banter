import React from 'react';
import { AvatarProfile } from '../lib/avatars';
import { ClayAvatarSVG } from './ClayAvatarSVG';

interface UserAvatarProps {
  avatar: AvatarProfile;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  isOnline?: boolean;
  showOnlineBadge?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  size = 'md',
  className = '',
  isOnline,
  showOnlineBadge = false,
}) => {
  const sizeMap = {
    xs: { container: 'w-6 h-6 rounded-[8px]', badge: 'w-2 h-2 -bottom-0.5 -right-0.5' },
    sm: { container: 'w-8 h-8 rounded-[11px]', badge: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5' },
    md: { container: 'w-10 h-10 rounded-[14px]', badge: 'w-3 h-3 bottom-0 right-0' },
    lg: { container: 'w-12 h-12 rounded-[16px]', badge: 'w-3.5 h-3.5 bottom-0 right-0' },
    xl: { container: 'w-16 h-16 rounded-[22px]', badge: 'w-4 h-4 bottom-0 right-0' },
    '2xl': { container: 'w-20 h-20 rounded-[26px]', badge: 'w-5 h-5 bottom-0.5 right-0.5' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const clayId = avatar.clayId || 'clay_m_beanie';

  return (
    <div className="relative inline-flex shrink-0 select-none">
      <div
        className={`${currentSize.container} shadow-sm relative overflow-hidden transition-transform duration-150 ${className} ring-1 ring-black/5 dark:ring-white/10`}
        style={{ backgroundColor: avatar.bgColor || '#F5DCD3' }}
      >
        <ClayAvatarSVG id={clayId} className="w-full h-full object-cover" />
      </div>

      {showOnlineBadge && (
        <span
          className={`absolute ${currentSize.badge} rounded-full ring-2 ring-white dark:ring-neutral-900 ${
            isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
          }`}
          title={isOnline ? 'Online now' : 'Offline'}
        />
      )}
    </div>
  );
};
