import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  onEnter: (name: string) => void;
  initialName?: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnter, initialName = '' }) => {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Please enter your name.');
      return;
    }

    if (trimmed.length > 20) {
      setError('Name must be 20 characters or fewer.');
      return;
    }

    setError(null);
    onEnter(trimmed);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-4 bg-[#090a0f] relative overflow-hidden">
      {/* Subtle ambient background glow */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Centered card */}
      <div className="w-full max-w-sm rounded-3xl bg-neutral-900/90 border border-neutral-800/80 p-8 sm:p-10 shadow-2xl relative z-10 backdrop-blur-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-display mb-2 text-balance">
            Banter
          </h1>
          <p className="text-neutral-400 text-sm font-medium tracking-wide">
            Talk. Laugh. Banter.
          </p>
        </div>

        {/* Name input form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                maxLength={20}
                placeholder="Enter your name"
                className="w-full px-4 py-3.5 rounded-2xl bg-neutral-950 border border-neutral-700/80 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-base transition-all font-medium tracking-tight"
                autoFocus
                autoComplete="nickname"
              />
              {name.trim().length > 0 && (
                <span className="absolute right-3.5 top-3.5 text-xs text-neutral-500 font-mono tabular-nums">
                  {name.trim().length}/20
                </span>
              )}
            </div>

            {error && (
              <p className="mt-2 text-xs text-red-400 font-medium animate-in fade-in">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-display font-bold text-base tracking-tight transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-indigo-950/60"
          >
            <span>Enter Banter</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-neutral-500 tracking-normal select-none font-normal">
            No account required.
          </p>
        </div>
      </div>
    </div>
  );
};
