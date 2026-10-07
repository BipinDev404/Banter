import React from 'react';
import { Info, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useAudio } from '../context/AudioContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAudio();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-6 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl text-xs font-semibold animate-slide-up transition-all ${
              isSuccess
                ? 'bg-zinc-900/95 border-amber-500/40 text-amber-300'
                : isWarning
                ? 'bg-zinc-900/95 border-rose-500/40 text-rose-300'
                : 'bg-zinc-900/95 border-zinc-700/60 text-zinc-100'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {isSuccess ? (
                <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
              ) : isWarning ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="truncate">{toast.message}</span>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
