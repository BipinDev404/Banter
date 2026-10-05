import React, { useState } from 'react';
import { X, User, Trash2, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSaveName: (newName: string) => void;
  onClearData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentName,
  onSaveName,
  onClearData,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-5">
          <h2 id="settings-title" className="text-lg font-bold text-white font-display tracking-tight">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Your name
            </label>
            <div className="relative">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  setError(null);
                }}
                maxLength={20}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium tracking-tight transition-all"
                placeholder="Enter your name"
                autoFocus
              />
              <span className="absolute right-3 top-2.5 text-xs text-neutral-500 font-mono tabular-nums">
                {nameInput.trim().length}/20
              </span>
            </div>
            {error && <p className="mt-1.5 text-xs text-red-400 font-medium">{error}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-display font-bold text-sm tracking-tight transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-indigo-950"
            >
              <Check className="w-4 h-4" />
              Save Name
            </button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-neutral-800/80">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-3 font-medium">
            <span>Local session</span>
            <span className="text-neutral-500 font-mono text-[11px]">Device only</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear your saved name and session? You will be prompted to enter a name again.')) {
                onClearData();
              }
            }}
            className="w-full py-2 px-3 rounded-xl border border-red-900/40 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 text-xs font-medium tracking-tight transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear local data
          </button>
        </div>
      </div>
    </div>
  );
};
