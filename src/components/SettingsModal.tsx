import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, User, Clock, AlertTriangle, Trash2, Loader2, Bell, Volume2, Smartphone, Sparkles, Send } from 'lucide-react';
import { getAvatarForUser } from '../lib/avatars';
import { UserAvatar } from './UserAvatar';
import { AppSettings } from '../lib/settings';
import {
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationSupported,
  playNotificationChime,
  triggerNotificationVibrate,
  sendSystemNotification,
  triggerTestNotification,
} from '../lib/notifications';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSaveName: (newName: string, newAvatarId?: string) => void;
  onClearData: () => Promise<void> | void;
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
  onUpdateSettings,
  isDarkMode = true,
}) => {
  const [nameInput, setNameInput] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [permissionState, setPermissionState] = useState<NotificationPermission>(getNotificationPermission());
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNameInput(currentName);
      setError(null);
      setSaveSuccess(false);
      setShowResetConfirm(false);
      setIsResetting(false);
      setPermissionState(getNotificationPermission());
    }
  }, [isOpen, currentName]);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermissionState(res);
    if (res === 'granted' && onUpdateSettings) {
      onUpdateSettings({ ...settings, systemNotificationsEnabled: true });
    }
  };

  const [testSentType, setTestSentType] = useState<'friend' | 'banter' | null>(null);

  const handleTestFriendAlert = async () => {
    setTestSentType('friend');
    await triggerTestNotification('friend');
    setTimeout(() => setTestSentType(null), 2500);
  };

  const handleTestBanterAlert = async () => {
    setTestSentType('banter');
    await triggerTestNotification('banter');
    setTimeout(() => setTestSentType(null), 2500);
  };

  const handleSaveProfile = (e?: React.FormEvent) => {
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
    onSaveName(trimmed, settings.avatarId || 'h_alex');
    if (onUpdateSettings) {
      onUpdateSettings({ ...settings });
    }
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1000);
  };

  const currentAvatar = getAvatarForUser(undefined, nameInput || currentName, settings.avatarId || 'h_alex');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md select-none overflow-y-auto"
        >
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className={`relative z-10 w-full max-w-md rounded-[28px] border shadow-2xl flex flex-col overflow-hidden transition-colors backdrop-blur-2xl my-auto max-h-[90dvh] ${
              isDarkMode
                ? 'bg-[#1c1c1e] border-white/10 text-white'
                : 'bg-white border-black/10 text-neutral-900'
            }`}
          >
            {/* Top subtle light line */}
            <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent ${isDarkMode ? 'via-white/20' : 'via-black/10'} to-transparent pointer-events-none`} />

            {/* Header */}
            <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-black/5 bg-black/[0.02]'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#007AFF]/20 text-[#007AFF]' : 'bg-[#007AFF]/10 text-[#007AFF]'}`}>
                  <User className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h2 id="profile-modal-title" className="text-base font-bold tracking-tight leading-none">
                    Profile & Username
                  </h2>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Change your display username</p>
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

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto">
              {/* Avatar Preview Card */}
              <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
                isDarkMode ? 'bg-[#2c2c2e]/70 border-white/10' : 'bg-neutral-100 border-black/5'
              }`}>
                <UserAvatar avatar={currentAvatar} size="xl" />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-extrabold truncate">
                    {nameInput.trim() || currentName}
                  </p>
                  <p className="text-xs text-[#007AFF] font-medium truncate mt-0.5">
                    Default Avatar ({currentAvatar.name})
                  </p>
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 mt-1 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Online & Active</span>
                  </p>
                </div>
              </div>

              {/* Profile Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Username Input Field */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 ml-0.5">
                    Display Username
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => {
                      setNameInput(e.target.value);
                      if (error) setError(null);
                    }}
                    maxLength={20}
                    placeholder="Enter username..."
                    className={`w-full px-4 py-3 rounded-2xl border border-transparent focus:border-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/25 text-sm font-medium transition-all ${
                      isDarkMode
                        ? 'bg-[#2c2c2e] text-white placeholder-neutral-500'
                        : 'bg-neutral-100 text-neutral-900 placeholder-neutral-400'
                    }`}
                  />
                  {error && <p className="mt-1.5 text-xs text-red-400 font-medium ml-0.5">{error}</p>}
                </div>

                {/* 2-Hour Auto-Purge Notice */}
                <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 ${
                  isDarkMode
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                    : 'bg-amber-50 border-amber-300/40 text-amber-900'
                }`}>
                  <Clock className="w-4 h-4 text-amber-500 shrink-0 stroke-[2.2]" />
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold block">2-Hour Auto-Expiration Active</span>
                    <span className={isDarkMode ? 'text-amber-200/80' : 'text-amber-800'}>
                      Messages and chat history automatically vanish after 2 hours.
                    </span>
                  </div>
                </div>

                {/* Notifications & Mobile Alerts Section */}
                <div className={`p-4 rounded-2xl border space-y-3.5 ${
                  isDarkMode ? 'bg-[#2c2c2e]/60 border-white/10' : 'bg-neutral-50 border-black/5'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#007AFF] stroke-[2.2]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                        Device & Mobile Notifications
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      permissionState === 'granted'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {permissionState === 'granted' ? 'Alerts Active' : 'Permission Required'}
                    </span>
                  </div>

                  {/* Informational Cards explaining notification modes */}
                  <div className={`p-2.5 rounded-xl text-[11px] space-y-1.5 border ${
                    isDarkMode ? 'bg-white/[0.03] border-white/10 text-neutral-300' : 'bg-black/[0.02] border-black/5 text-neutral-700'
                  }`}>
                    <div className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold shrink-0">🌟 Friends:</span>
                      <span>Real message appears directly in notification.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-[#007AFF] font-bold shrink-0">💬 Banter Chats:</span>
                      <span>Invites you with clean grammar when conversations are buzzing.</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-neutral-400 text-[10.5px]">
                      <span className="text-emerald-400 font-bold shrink-0">📱 Delivery:</span>
                      <span>Works both while online inside Banter and when you exit or minimize the app.</span>
                    </div>
                  </div>

                  {/* Dual Test Alert Buttons */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={handleTestFriendAlert}
                      disabled={testSentType !== null}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Send className="w-3 h-3" />
                      <span>{testSentType === 'friend' ? 'Friend Alert Sent!' : 'Test Friend Alert'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleTestBanterAlert}
                      disabled={testSentType !== null}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-[#007AFF] dark:text-blue-300 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Send className="w-3 h-3" />
                      <span>{testSentType === 'banter' ? 'Banter Alert Sent!' : 'Test Banter Alert'}</span>
                    </button>
                  </div>

                  {/* System & Mobile OS Notification Row */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <div className="flex flex-col pr-2">
                      <span className="text-xs font-semibold">Native Device Alerts</span>
                      <span className="text-[11px] text-neutral-400">
                        Receive real OS notifications when friends chat or you exit
                      </span>
                    </div>

                    {permissionState === 'granted' ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateSettings) {
                            onUpdateSettings({
                              ...settings,
                              systemNotificationsEnabled: !settings.systemNotificationsEnabled,
                            });
                          }
                        }}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                          settings.systemNotificationsEnabled ? 'bg-[#007AFF]' : 'bg-neutral-600'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            settings.systemNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestPermission}
                        className="py-1 px-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-[11px] font-bold cursor-pointer shrink-0 transition-all active:scale-95"
                      >
                        Enable
                      </button>
                    )}
                  </div>

                  {/* Chime Sound Row */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-neutral-400" />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold">Notification Sound</span>
                        <span className="text-[11px] text-neutral-400">Crystal Apple bell chime</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateSettings) {
                          onUpdateSettings({
                            ...settings,
                            soundEnabled: !settings.soundEnabled,
                          });
                        }
                      }}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                        settings.soundEnabled ? 'bg-[#007AFF]' : 'bg-neutral-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Mobile Vibration Row */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-neutral-400" />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold">Mobile Vibration</span>
                        <span className="text-[11px] text-neutral-400">Haptic pulse for incoming chats</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateSettings) {
                          onUpdateSettings({
                            ...settings,
                            vibrationEnabled: !settings.vibrationEnabled,
                          });
                        }
                      }}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                        settings.vibrationEnabled ? 'bg-[#007AFF]' : 'bg-neutral-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.vibrationEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] active:scale-[0.98] text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5] text-emerald-400" />
                      <span>Username Updated!</span>
                    </>
                  ) : (
                    <span>Save Username</span>
                  )}
                </button>
              </form>

              {/* Reset Session Option with Double Confirmation */}
              <div className={`pt-3 border-t ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
                {!showResetConfirm ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">Need to reset session?</span>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer py-1.5 px-2.5 rounded-xl hover:bg-red-500/10 active:scale-95"
                    >
                      Reset Session
                    </button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-4 rounded-2xl border ${
                      isDarkMode
                        ? 'bg-red-500/10 border-red-500/30 text-white'
                        : 'bg-red-50 border-red-200 text-neutral-900'
                    } text-left space-y-3`}
                  >
                    <div className="flex items-center gap-2 text-red-500 font-extrabold text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0 stroke-[2.2]" />
                      <span>Confirm Session & Message Deletion</span>
                    </div>

                    <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-red-200/90' : 'text-red-900'}`}>
                      Are you sure you want to reset your session? This action will permanently{' '}
                      <strong>delete all messages sent by you</strong> across all chats (Global, Direct, and Group chats) and reset your user session.
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isResetting}
                        onClick={async () => {
                          setIsResetting(true);
                          try {
                            await onClearData();
                          } finally {
                            setIsResetting(false);
                            setShowResetConfirm(false);
                          }
                        }}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-red-600/30"
                      >
                        {isResetting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Deleting & Resetting...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
                            <span>Yes, Delete My Messages & Reset</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={isResetting}
                        onClick={() => setShowResetConfirm(false)}
                        className={`py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                          isDarkMode
                            ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                            : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-700'
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
