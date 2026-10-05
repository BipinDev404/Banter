import React from 'react';

interface OnlineCounterProps {
  count: number;
  isOffline?: boolean;
}

export const OnlineCounter: React.FC<OnlineCounterProps> = ({ count, isOffline = false }) => {
  return (
    <div
      className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium tracking-tight text-neutral-300"
      aria-label={`${count} users online`}
    >
      <span className="relative flex h-2 w-2">
        {!isOffline ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        )}
      </span>
      <span className="tabular-nums font-mono text-neutral-200">
        {count} {count === 1 ? 'online' : 'online'}
      </span>
    </div>
  );
};
