import React, { useState } from 'react';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { PRESET_AVATARS } from '../lib/avatars';

interface WelcomeScreenProps {
  onEnter: (name: string, avatarId?: string) => void;
  initialName?: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onEnter,
  initialName = '',
}) => {
  const [name, setName] = useState(initialName || '');
  const [selectedAvatar, setSelectedAvatar] = useState('rody');
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
    onEnter(trimmed, selectedAvatar);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-4 bg-gradient-to-b from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-black relative select-none">
      {/* Modal Card */}
      <div className="w-full max-w-sm rounded-[36px] bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-800 p-7 sm:p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Simple Message Icon */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4">
            <MessageSquare className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Banter
          </h1>
          <p className="text-neutral-500 text-xs mt-1 font-medium">
            Talk. Laugh. Banter. Real-time global chat.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Picker */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 text-center">
              Choose Your Memoji
            </label>
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
              {PRESET_AVATARS.slice(0, 5).map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => {
                    setSelectedAvatar(av.id);
                    if (!name) {
                      setName(av.name);
                    }
                  }}
                  className={`w-11 h-11 rounded-full ${av.bgColor} flex items-center justify-center text-xl transition-all cursor-pointer ${
                    selectedAvatar === av.id
                      ? 'ring-2 ring-offset-2 ring-blue-500 scale-110 shadow-sm'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                  title={av.name}
                >
                  <span>{av.emoji}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name input */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Your Display Name
            </label>
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
                className="w-full px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium transition-all"
                autoFocus
              />
            </div>
            {error && (
              <p className="mt-1.5 text-xs text-red-500 font-medium">
                {error}
              </p>
            )}
          </div>

          {/* Enter Button */}
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 px-5 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] active:scale-98 disabled:opacity-40 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20"
          >
            <span>Enter Banter</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-[11px] text-neutral-400 font-normal">
            No account required. Real-time anonymous banter.
          </p>
        </div>
      </div>
    </div>
  );
};
