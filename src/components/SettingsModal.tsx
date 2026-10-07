import React, { useState, useEffect } from 'react';
import { X, Check, User, Sparkles } from 'lucide-react';
import { getAvatarForUser } from '../lib/avatars';
import { UserAvatar } from './UserAvatar';
import { AppSettings } from '../lib/settings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSaveName: (newName: string) => void;
  onClearData: () => void;
  settings: AppSettings;
  onUpdateSettings?: (newSettings: AppSettings) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentName,
  onSaveName,
  onClearData,
  settings,
  isDarkMode = true,
}) => {
  const [nameInput, setNameInput] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNameInput(currentName);
      setError(null);
      setSaveSuccess(false);
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const handleSaveUsername = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setError('Username cannot be empty.');
      return;
    }
    if (trimmed.length > 20) {
      setError('Username must be 20 characters or fewer.');
      return;
    }
    setError(null);
    onSaveName(trimmed);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const currentAvatar = getAvatarForUser(undefined, nameInput || currentName, settings.avatarId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        className={`relative z-10 w-full max-w-sm rounded-[28px] border shadow-2xl flex flex-col overflow-hidden transition-all animate-in zoom-in-95 duration-150 backdrop-blur-2xl ${
          isDarkMode
            ? 'bg-[#1c1c1e] border-white/10 text-white'
            : 'bg-white border-black/10 text-neutral-900'
        }`}
      >
        {/* Apple subtle top light highlight */}
        <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent ${isDarkMode ? 'via-white/20' : 'via-black/10'} to-transparent pointer-events-none`} />

        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-black/5 bg-black/[0.02]'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-neutral-900'}`}>
              <User className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 id="profile-modal-title" className="text-base font-bold tracking-tight leading-none">
                Profile
              </h2>
              <p className="text-[11px] text-neutral-400 mt-0.5">Manage your display identity</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors cursor-pointer active:scale-90 ${
              isDarkMode
                ? 'text-neutral-400 hover:text-white hover:bg-white/10'
                : 'text-neutral-400 hover:text-neutral-900 hover:bg-black/5'
            }`}
            aria-label="Close profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content: Profile preview + Username editor ONLY */}
        <div className="p-5 space-y-5">
          {/* Avatar Preview Card */}
          <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
            isDarkMode ? 'bg-[#2c2c2e]/70 border-white/5' : 'bg-neutral-100 border-black/5'
          }`}>
            <UserAvatar avatar={currentAvatar} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate">
                {nameInput.trim() || currentName}
              </p>
              <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Online & Active</span>
              </p>
            </div>
          </div>

          {/* Username Change Form */}
          <form onSubmit={handleSaveUsername} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1.5 ml-0.5">
                Change Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    if (error) setError(null);
                  }}
                  maxLength={20}
                  placeholder="Enter your new name"
                  className={`w-full px-4 py-3 rounded-xl border border-transparent focus:border-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/25 text-sm font-medium transition-all ${
                    isDarkMode
                      ? 'bg-[#2c2c2e] text-white placeholder-neutral-500'
                      : 'bg-neutral-100 text-neutral-900 placeholder-neutral-400'
                  }`}
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1.5 ml-0.5">
                This name appears on your messages and chats.
              </p>
              {error && <p className="mt-1 text-xs text-red-500 font-medium ml-0.5">{error}</p>}
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={!nameInput.trim() || nameInput.trim() === currentName}
              className="w-full py-3 px-4 rounded-xl bg-[#007AFF] hover:bg-[#0071E3] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5] text-emerald-400" />
                  <span>Username Saved!</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </form>

          {/* Subtle Reset Session Option */}
          <div className={`pt-3 border-t flex items-center justify-between ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
            <span className="text-xs text-neutral-500">Need to switch accounts?</span>
            <button
              type="button"
              onClick={onClearData}
              className="text-xs font-medium text-red-500 hover:text-red-400 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-red-500/10 active:scale-95"
            >
              Reset Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
