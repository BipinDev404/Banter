import React from 'react';

interface BanterLogoProps {
  className?: string;
  size?: number | string;
}

export const BanterLogo: React.FC<BanterLogoProps> = ({ className = 'w-8 h-8', size }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Banter Logo"
    >
      {/* Blue Speech Bubble with curved bottom-left tail */}
      <path
        d="M50 20C31.2 20 16 33.4 16 50C16 55.6 17.8 60.9 21 65.3C20.6 70.6 18.4 76.2 14.7 80.5C13.9 81.5 14.6 82.8 15.9 82.6C22.4 81.5 28.7 78.9 33.7 75.7C38.8 78.5 44.6 80 50 80C68.8 80 84 66.6 84 50C84 33.4 68.8 20 50 20Z"
        fill="#0084FF"
      />
      {/* Three White Circular Typing/Chat Dots */}
      <circle cx="37.5" cy="50" r="4.6" fill="#FFFFFF" />
      <circle cx="50" cy="50" r="4.6" fill="#FFFFFF" />
      <circle cx="62.5" cy="50" r="4.6" fill="#FFFFFF" />
    </svg>
  );
};
