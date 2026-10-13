import React from 'react';

interface BanterLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
  isDarkMode?: boolean;
  layout?: 'horizontal' | 'vertical';
}

export const BanterLogo: React.FC<BanterLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textClassName,
  isDarkMode,
  layout = 'horizontal',
}) => {
  const isVertical = layout === 'vertical';

  const badgeSize =
    size === 'sm'
      ? 'w-7 h-7'
      : size === 'lg'
      ? 'w-11 h-11'
      : size === 'xl'
      ? isVertical
        ? 'w-16 h-16'
        : 'w-12 h-12'
      : 'w-8.5 h-8.5';

  const textSize =
    size === 'sm'
      ? 'text-base font-bold'
      : size === 'lg'
      ? 'text-2xl font-extrabold'
      : size === 'xl'
      ? 'text-3xl sm:text-4xl font-black tracking-tight'
      : 'text-xl font-extrabold';

  return (
    <div
      className={`inline-flex ${
        isVertical ? 'flex-col items-center justify-center text-center gap-2' : 'items-center gap-2.5'
      } select-none ${className}`}
    >
      {/* Clean Flipped Favicon App Logo */}
      <img
        src="/favicon.svg"
        alt="Banter Logo"
        className={`shrink-0 object-contain ${badgeSize}`}
      />

      {/* Brand Name Text */}
      {showText && (
        <span
          className={`font-extrabold tracking-tight leading-none ${
            textClassName ||
            (isDarkMode === false
              ? 'text-[#007AFF]'
              : isDarkMode === true
              ? 'text-white'
              : 'text-[#007AFF] dark:text-white')
          } ${textSize}`}
        >
          Banter
        </span>
      )}
    </div>
  );
};
