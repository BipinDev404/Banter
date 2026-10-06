import React, { useState } from 'react';
import {
  X,
  Trash2,
  Check,
  User,
  Palette,
  Type,
  Volume2,
  VolumeX,
  Layout,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Sun,
  Moon,
  Shield,
  Layers,
} from 'lucide-react';
import { COLORFUL_AVATARS, getAvatarForUser, AvatarProfile } from '../lib/avatars';
import {
  AppSettings,
  THEME_OPTIONS,
  BG_PATTERN_OPTIONS,
  FONT_OPTIONS,
  ThemeAccent,
  ChatBgPattern,
  FontStyle,
  MessageDensity,
  getThemeOption,
  getFontOption,
} from '../lib/settings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSaveName: (newName: string) => void;
  onClearData: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

type TabType = 'profile' | 'appearance' | 'chat_bg' | 'fonts' | 'preferences';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentName,
  onSaveName,
  onClearData,
  settings,
  onUpdateSettings,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('appearance');
  const [nameInput, setNameInput] = useState(currentName);
  const [selectedAvatarId, setSelectedAvatarId] = useState(settings.avatarId);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
    onUpdateSettings({ ...settings, avatarId: selectedAvatarId });

    try {
      localStorage.setItem('banter_user_avatar', selectedAvatarId);
    } catch {}

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const currentTheme = getThemeOption(settings.themeAccent);
  const activeFont = getFontOption(settings.fontStyle);
  const currentAvatar = getAvatarForUser(undefined, nameInput, selectedAvatarId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150 select-none">
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className={`relative z-10 w-full max-w-lg h-[88vh] sm:h-[620px] rounded-[32px] border shadow-2xl flex flex-col overflow-hidden transition-all animate-in zoom-in-95 duration-150 ${
          isDarkMode
            ? 'bg-[#16171B]/95 border-neutral-800 text-white'
            : 'bg-white/95 border-neutral-200 text-neutral-900'
        } backdrop-blur-2xl`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
            isDarkMode ? 'border-neutral-800/80 bg-neutral-900/50' : 'border-neutral-100 bg-neutral-50/50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-2xl ${currentTheme.bgClass} text-white flex items-center justify-center shadow-xs`}
            >
              <Palette className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 id="settings-title" className="text-base font-bold tracking-tight leading-none">
                App & Profile Settings
              </h2>
              <p className="text-[11px] text-neutral-400 mt-0.5">Customize your style, theme & fonts</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isDarkMode
                ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div
          className={`px-4 py-2 border-b flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none ${
            isDarkMode ? 'border-neutral-800/80 bg-neutral-900/30' : 'border-neutral-100 bg-neutral-50/30'
          }`}
        >
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'appearance'
                ? `${currentTheme.bgClass} text-white shadow-xs`
                : isDarkMode
                ? 'text-neutral-400 hover:bg-neutral-800'
                : 'text-neutral-600 hover:bg-neutral-200/60'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme Colors</span>
          </button>

          <button
            onClick={() => setActiveTab('fonts')}
            className={`px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'fonts'
                ? `${currentTheme.bgClass} text-white shadow-xs`
                : isDarkMode
                ? 'text-neutral-400 hover:bg-neutral-800'
                : 'text-neutral-600 hover:bg-neutral-200/60'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Fonts</span>
          </button>

          <button
            onClick={() => setActiveTab('chat_bg')}
            className={`px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'chat_bg'
                ? `${currentTheme.bgClass} text-white shadow-xs`
                : isDarkMode
                ? 'text-neutral-400 hover:bg-neutral-800'
                : 'text-neutral-600 hover:bg-neutral-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Wallpaper</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? `${currentTheme.bgClass} text-white shadow-xs`
                : isDarkMode
                ? 'text-neutral-400 hover:bg-neutral-800'
                : 'text-neutral-600 hover:bg-neutral-200/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Avatar</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'preferences'
                ? `${currentTheme.bgClass} text-white shadow-xs`
                : isDarkMode
                ? 'text-neutral-400 hover:bg-neutral-800'
                : 'text-neutral-600 hover:bg-neutral-200/60'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 1. Theme Color Swatches Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Theme Accent Color
                </label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                  Choose your favorite accent color applied to sent bubbles, action buttons, and badges.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {THEME_OPTIONS.map((theme) => {
                    const isSelected = settings.themeAccent === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => onUpdateSettings({ ...settings, themeAccent: theme.id })}
                        className={`p-3 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                          isSelected
                            ? `${theme.borderClass} ${
                                isDarkMode ? 'bg-neutral-800/80' : 'bg-neutral-50'
                              } ring-2 ${theme.ringClass}/40`
                            : isDarkMode
                            ? 'bg-neutral-900/60 border-neutral-800 hover:bg-neutral-800/50'
                            : 'bg-neutral-50/80 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full ${theme.bgClass} flex items-center justify-center text-white shrink-0 shadow-xs`}
                        >
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold truncate">{theme.name}</span>
                          <span className="text-[10px] text-neutral-400 uppercase font-mono">{theme.hex}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Light / Dark Mode Quick Switcher */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isDarkMode ? 'bg-neutral-900/80 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                      isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/10 text-blue-500'
                    }`}
                  >
                    {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Appearance Mode</span>
                    <span className="text-[11px] text-neutral-400">
                      Currently using {isDarkMode ? 'Dark Theme' : 'Light Theme'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onToggleDarkMode}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isDarkMode
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700'
                      : 'bg-white hover:bg-neutral-100 text-neutral-900 border-neutral-300 shadow-2xs'
                  }`}
                >
                  Switch to {isDarkMode ? 'Light' : 'Dark'}
                </button>
              </div>
            </div>
          )}

          {/* 2. Modern Font Selection Tab */}
          {activeTab === 'fonts' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Typography & Font Family
                </label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                  Select a modern font style applied to chat messages and application text.
                </p>

                <div className="space-y-2.5">
                  {FONT_OPTIONS.map((font) => {
                    const isSelected = settings.fontStyle === font.id;
                    return (
                      <div
                        key={font.id}
                        onClick={() => onUpdateSettings({ ...settings, fontStyle: font.id })}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? `${currentTheme.borderClass} ${
                                isDarkMode ? 'bg-neutral-800/80' : 'bg-blue-50/50'
                              } ring-2 ${currentTheme.ringClass}/30`
                            : isDarkMode
                            ? 'bg-neutral-900/60 border-neutral-800 hover:bg-neutral-800/50'
                            : 'bg-neutral-50/80 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                            {font.name}
                          </span>
                          {isSelected && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentTheme.bgClass} text-white flex items-center gap-1`}
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>Active</span>
                            </span>
                          )}
                        </div>
                        <p
                          style={{ fontFamily: font.fontFamily }}
                          className="text-sm text-neutral-600 dark:text-neutral-300 font-normal tracking-normal"
                        >
                          {font.previewText}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. Chat Background Wallpaper Patterns Tab */}
          {activeTab === 'chat_bg' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Chat Wallpaper & Patterns
                </label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                  Choose a background pattern overlay for the main chat thread.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BG_PATTERN_OPTIONS.map((bg) => {
                    const isSelected = settings.chatBgPattern === bg.id;
                    return (
                      <div
                        key={bg.id}
                        onClick={() => onUpdateSettings({ ...settings, chatBgPattern: bg.id })}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-24 relative overflow-hidden ${
                          isSelected
                            ? `${currentTheme.borderClass} ${
                                isDarkMode ? 'bg-neutral-800/90' : 'bg-neutral-100'
                              } ring-2 ${currentTheme.ringClass}/40`
                            : isDarkMode
                            ? 'bg-neutral-900/60 border-neutral-800 hover:bg-neutral-800/50'
                            : 'bg-neutral-50/80 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        <div className="flex items-center justify-between relative z-10">
                          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                            {bg.name}
                          </span>
                          {isSelected && (
                            <div className={`w-5 h-5 rounded-full ${currentTheme.bgClass} text-white flex items-center justify-center`}>
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 relative z-10">{bg.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 4. Profile & Custom Avatar Selection Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Display Name
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full ${currentAvatar.bgColor} flex items-center justify-center text-2xl shrink-0 border border-black/10 dark:border-white/10 shadow-xs`}
                  >
                    <span>{currentAvatar.emoji}</span>
                  </div>

                  <div className="flex-1">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => {
                        setNameInput(e.target.value);
                        setError(null);
                      }}
                      maxLength={20}
                      className={`w-full px-3.5 py-2.5 rounded-2xl border text-sm font-semibold focus:outline-none focus:ring-2 ${currentTheme.ringClass}/30 ${
                        isDarkMode
                          ? 'bg-neutral-900 border-neutral-800 text-white'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                      }`}
                      placeholder="Enter your display name"
                    />
                  </div>
                </div>
                {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Select Custom Avatar Icon
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                  {COLORFUL_AVATARS.map((av) => {
                    const isSel = selectedAvatarId === av.id;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setSelectedAvatarId(av.id)}
                        className={`w-9 h-9 rounded-full ${av.bgColor} flex items-center justify-center text-lg transition-transform cursor-pointer relative ${
                          isSel
                            ? 'scale-110 ring-2 ring-blue-500 shadow-md'
                            : 'hover:scale-105 active:scale-95'
                        }`}
                        title={av.name}
                      >
                        <span>{av.emoji}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className={`flex-1 py-2.5 px-4 rounded-2xl ${currentTheme.bgClass} ${currentTheme.hoverClass} text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98`}
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Profile Changes</span>
                </button>
                {saveSuccess && (
                  <span className="text-xs text-emerald-500 font-bold flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" /> Saved!
                  </span>
                )}
              </div>
            </form>
          )}

          {/* 5. App Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Sound Effects Toggle */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isDarkMode ? 'bg-neutral-900/80 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                      settings.soundEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-neutral-500/10 text-neutral-400'
                    }`}
                  >
                    {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Message Pop Sounds</span>
                    <span className="text-[11px] text-neutral-400">
                      Play audio pops on incoming messages
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settings.soundEnabled
                      ? 'bg-emerald-500 text-white'
                      : isDarkMode
                      ? 'bg-neutral-800 text-neutral-400'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {settings.soundEnabled ? 'Enabled' : 'Muted'}
                </button>
              </div>

              {/* Message Density Toggle */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isDarkMode ? 'bg-neutral-900/80 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Layout className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Message Density</span>
                    <span className="text-[11px] text-neutral-400">
                      {settings.messageDensity === 'comfortable' ? 'Standard comfortable padding' : 'Tight compact rows'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      messageDensity: settings.messageDensity === 'comfortable' ? 'compact' : 'comfortable',
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isDarkMode ? 'bg-neutral-800 text-white' : 'bg-neutral-200 text-neutral-900'
                  }`}
                >
                  {settings.messageDensity === 'comfortable' ? 'Comfortable' : 'Compact'}
                </button>
              </div>

              {/* Reset Session Identity */}
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset local session data? You will be prompted to re-enter your username.')) {
                      onClearData();
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Reset Local Identity & Cache</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
