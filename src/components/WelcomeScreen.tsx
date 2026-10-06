import React, { useState, useMemo } from 'react';
import { ArrowRight, Sparkles, Check } from 'lucide-react';
import { BanterLogo } from './BanterLogo';
import { REAL_ICON_AVATARS, getAvatarForUser } from '../lib/avatars';
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
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(initialAvatarId || '');
  const [genderFilter, setGenderFilter] = useState<'all' | 'female' | 'male'>('all');
  const [error, setError] = useState<string | null>(null);

  // Available user avatars (excluding group badges)
  const availableAvatars = useMemo(() => {
    return REAL_ICON_AVATARS.filter((a) => a.gender !== 'group');
  }, []);

  const currentAvatar = useMemo(() => {
    return getAvatarForUser(undefined, name, selectedAvatarId);
  }, [name, selectedAvatarId]);

  const handleShuffle = () => {
    const randomIndex = Math.floor(Math.random() * availableAvatars.length);
    setSelectedAvatarId(availableAvatars[randomIndex].id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Please enter your display name.');
      return;
    }

    if (trimmed.length > 20) {
      setError('Name must be 20 characters or fewer.');
      return;
    }

    setError(null);
    onEnter(trimmed, selectedAvatarId || currentAvatar.id);
  };

  const filteredAvatars = useMemo(() => {
    if (genderFilter === 'all') return availableAvatars;
    return availableAvatars.filter((a) => a.gender === genderFilter);
  }, [availableAvatars, genderFilter]);

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-4 bg-[#F2F2F7] dark:bg-[#000000] relative select-none overflow-hidden">
      {/* Ambient Apple background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md rounded-[36px] bg-white/85 dark:bg-[#1C1C1E]/85 border border-white/50 dark:border-white/10 p-6 sm:p-8 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)] relative z-10 backdrop-blur-2xl transition-all">
        {/* Apple light highlight edge */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 dark:via-white/20 to-transparent pointer-events-none rounded-t-[36px]" />

        {/* Header */}
        <div className="text-center mb-5 flex flex-col items-center">
          <BanterLogo className="w-14 h-14 mb-2 drop-shadow-sm" />
          <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-neutral-900 dark:text-white">
            Welcome to Banter
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-0.5 font-medium tracking-tight">
            Real-time global chat, direct messages & groups
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Preview & Customization Card */}
          <div className="p-3.5 rounded-2xl bg-neutral-100/80 dark:bg-neutral-800/60 border border-black/5 dark:border-white/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <UserAvatar avatar={currentAvatar} size="xl" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                  {currentAvatar.name} ({currentAvatar.gender === 'female' ? 'Female' : 'Male'})
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                  {currentAvatar.description}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleShuffle}
              className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              title="Shuffle avatar character"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Shuffle</span>
            </button>
          </div>

          {/* Quick Avatar Selector Bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Choose Avatar Style
              </label>
              {/* Gender Filter Pills */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setGenderFilter('all')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    genderFilter === 'all'
                      ? 'bg-[#007AFF] text-white'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setGenderFilter('female')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    genderFilter === 'female'
                      ? 'bg-[#007AFF] text-white'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Female
                </button>
                <button
                  type="button"
                  onClick={() => setGenderFilter('male')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    genderFilter === 'male'
                      ? 'bg-[#007AFF] text-white'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Male
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none snap-x">
              {filteredAvatars.map((av) => {
                const isSelected = (selectedAvatarId || currentAvatar.id) === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatarId(av.id)}
                    className={`shrink-0 p-1 rounded-2xl transition-all cursor-pointer relative active:scale-95 ${
                      isSelected
                        ? 'ring-2 ring-blue-500 scale-105'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <UserAvatar avatar={av} size="md" />
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name input */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Your Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              maxLength={20}
              placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-2xl bg-neutral-100/90 dark:bg-neutral-800/90 border border-transparent focus:border-blue-400 dark:focus:border-blue-500 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold transition-all"
              autoFocus
            />
            {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
          </div>

          {/* Enter Button */}
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 px-5 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] active:scale-95 disabled:opacity-40 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20"
          >
            <span>Enter Banter</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-neutral-400 font-normal">
            Your avatar & name can be updated at any time in Profile Settings.
          </p>
        </div>
      </div>
    </div>
  );
};
