import React from 'react';
import { Users } from 'lucide-react';

interface OnlineCounterProps {
  count: number;
  onClick?: () => void;
  className?: string;
}

export const OnlineCounter: React.FC<OnlineCounterProps> = ({ count, onClick, className = '' }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer ${className}`}
    >
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <Users className="w-3.5 h-3.5" />
      <span>{count} online</span>
    </button>
  );
};
