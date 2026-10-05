import React, { useState } from 'react';
import { X, Trash2, Check, User } from 'lucide-react';
import { getAvatarForUser } from '../lib/avatars';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSaveName: (newName: string) => void;
  onClearData: () => void;
  isDarkMode?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentName,
  onSaveName,
  onClearData,
  isDarkMode = false,
}) => {
  const [nameInput, setNameInput] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setError('Name cannot be empty.');
      return;
    }
    if (trimmed.length > 20) {
      setError('Name must be 20 characters or fewer.');
      return;
    }
    setError(null);
    onSaveName(trimmed);
    onClose();
  };

  const avatar = getAvatarForUser(nameInput || 'You');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-sm rounded-[28px] border p-6 shadow-2xl relative ${
          isDarkMode
            ? 'bg-neutral-900 border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-5">
          <h2 id="settings-title" className="text-base font-bold tracking-tight">
            Profile Settings
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-750 flex items-center justify-center text-neutral-500 cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Your Display Name
            </label>
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full ${avatar.bgColor} flex items-center justify-center text-xl shrink-0 border border-black/5 dark:border-white/10`}
              >
                <span>{avatar.emoji}</span>
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    setError(null);
                  }}
                  maxLength={20}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    isDarkMode
                      ? 'bg-neutral-950 border-neutral-800 text-white'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                  }`}
                  placeholder="Enter your name"
                  autoFocus
                />
              </div>
            </div>
            {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#007AFF] hover:bg-[#0071E3] active:scale-98 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save Name</span>
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset local session data? You will be prompted to enter your name again.')) {
                onClearData();
              }
            }}
            className="w-full py-2 text-xs text-red-500 hover:text-red-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Identity</span>
          </button>
        </div>
      </div>
    </div>
  );
};
