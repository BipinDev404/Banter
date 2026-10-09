import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { BanterLogo } from './BanterLogo';
import { getAvatarForUser } from '../lib/avatars';
import { UserAvatar } from './UserAvatar';

interface WelcomeScreenProps {
  onEnter: (name: string, avatarId?: string) => void;
  initialName?: string;
  initialAvatarId?: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onEnter,
  initialName = '',
  initialAvatarId = '',
}) => {
  const [name, setName] = useState(initialName || '');
  const [error, setError] = useState<string | null>(null);

  const previewAvatar = getAvatarForUser(undefined, name || 'User', initialAvatarId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Please enter your name to join.');
      return;
    }

    if (trimmed.length > 20) {
      setError('Name must be 20 characters or fewer.');
      return;
    }

    setError(null);
    onEnter(trimmed, previewAvatar.id);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-4 bg-black text-white relative select-none overflow-hidden">
      {/* Ambient Apple subtle gradient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Login Card with Apple iOS Card Geometry */}
      <div className="w-full max-w-sm rounded-[32px] bg-[#1c1c1e]/90 border border-white/10 p-7 sm:p-8 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)] relative z-10 backdrop-blur-2xl transition-all">
        {/* Subtle top edge highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none rounded-t-[32px]" />

        {/* Brand Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="mb-2">
            <BanterLogo size="xl" showText={false} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Welcome to Banter
          </h1>
          <p className="text-neutral-400 text-xs mt-1 font-normal tracking-tight">
            Fast, private real-time conversations
          </p>
        </div>

        {/* Streamlined Welcome Form (Username Only) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Automatic Profile Card Preview */}
          <div className="p-3.5 rounded-2xl bg-[#2c2c2e]/60 border border-white/5 flex items-center gap-3">
            <UserAvatar avatar={previewAvatar} size="lg" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {name.trim() || 'Your Profile'}
              </p>
              <p className="text-[11px] text-neutral-400 truncate">
                Default profile avatar auto-assigned
              </p>
            </div>
          </div>

          {/* Username Input Field */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1.5 ml-0.5">
              Choose Username
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              maxLength={20}
              placeholder="e.g. Alex"
              className="w-full px-4 py-3.5 rounded-2xl bg-[#2c2c2e] border border-transparent focus:border-[#007AFF] text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/25 text-sm font-medium transition-all"
              autoFocus
            />
            {error && <p className="mt-1.5 text-xs text-red-400 font-medium ml-0.5">{error}</p>}
          </div>

          {/* Continue Button */}
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-[11px] text-neutral-500">
            You can change your username at any time in Profile.
          </p>
        </div>
      </div>
    </div>
  );
};
