import React from 'react';
import { MoreVertical } from 'lucide-react';
import { OnlineCounter } from './OnlineCounter';

interface ChatHeaderProps {
  onlineCount: number;
  isOffline?: boolean;
  onOpenSettings: () => void;
  userName: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onlineCount,
  isOffline = false,
  onOpenSettings,
  userName,
}) => {
  return (
    <header className="h-16 px-4 sm:px-6 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md flex items-center justify-between shrink-0 select-none z-10 sticky top-0">
      {/* Left: Banter text-based logo */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
          Banter
        </h1>
      </div>

      {/* Right: Online counter and settings button */}
      <div className="flex items-center gap-3 sm:gap-4">
        <OnlineCounter count={onlineCount} isOffline={isOffline} />

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors cursor-pointer"
          title={`Settings (You: ${userName})`}
          aria-label="Open settings"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
