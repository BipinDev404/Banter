import React from 'react';
import { MessageSquare } from 'lucide-react';

interface BanterLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
  isDarkMode?: boolean;
}

export const BanterLogo: React.FC<BanterLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textClassName,
  isDarkMode,
}) => {
  const badgeSize =
    size === 'sm'
      ? 'w-7 h-7 rounded-lg'
      : size === 'lg'
      ? 'w-10 h-10 rounded-2xl'
      : size === 'xl'
      ? 'w-12 h-12 rounded-[18px]'
      : 'w-8.5 h-8.5 rounded-xl';

  const iconSize =
    size === 'sm'
      ? 'w-3.5 h-3.5'
      : size === 'lg'
      ? 'w-5 h-5'
      : size === 'xl'
      ? 'w-6 h-6'
      : 'w-4.5 h-4.5';

  const textSize =
    size === 'sm'
      ? 'text-base font-bold'
      : size === 'lg'
      ? 'text-2xl font-extrabold'
      : size === 'xl'
      ? 'text-3xl font-black'
      : 'text-xl font-extrabold';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Icon Badge - Flipped Right-to-Left */}
      <div
        className={`relative shrink-0 flex items-center justify-center bg-[#007AFF] text-white shadow-md shadow-blue-500/20 border border-white/10 ${badgeSize}`}
      >
        <MessageSquare className={`${iconSize} fill-white/20 text-white stroke-[2.2] -scale-x-100`} />
      </div>

      {/* Brand Name Text */}
      {showText && (
        <span
          className={`font-extrabold tracking-tight leading-none ${
            textClassName || (isDarkMode === false ? 'text-[#007AFF]' : isDarkMode === true ? 'text-white' : 'text-[#007AFF] dark:text-white')
          } ${textSize}`}
        >
          Banter
        </span>
      )}
    </div>
  );
};
