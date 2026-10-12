import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Sparkles, Send } from 'lucide-react';
import {
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationSupported,
  triggerTestNotification,
} from '../lib/notifications';

interface NotificationPermissionPromptProps {
  onPermissionChanged?: (permission: NotificationPermission) => void;
  isDarkMode?: boolean;
}

export const NotificationPermissionPrompt: React.FC<NotificationPermissionPromptProps> = ({
  onPermissionChanged,
  isDarkMode = true,
}) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (!isNotificationSupported()) return;

    const dismissed = localStorage.getItem('banter_notif_prompt_dismissed');
    const perm = getNotificationPermission();

    if (perm === 'default' && !dismissed) {
      // Show prompt smoothly 2.5s after user enters
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    setIsRequesting(true);
    const result = await requestNotificationPermission();
    setIsRequesting(false);
    setShowPrompt(false);
    localStorage.setItem('banter_notif_prompt_dismissed', 'true');
    onPermissionChanged?.(result);

    if (result === 'granted') {
      // Fire a welcome test alert so user sees it works immediately!
      setTimeout(() => {
        triggerTestNotification('banter');
      }, 400);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('banter_notif_prompt_dismissed', 'true');
  };

  const handleQuickTest = async () => {
    setTestSent(true);
    await triggerTestNotification('friend');
    setTimeout(() => setTestSent(false), 2500);
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 select-none"
      >
        <div
          className={`p-4 rounded-3xl border shadow-2xl backdrop-blur-2xl flex flex-col gap-3 ${
            isDarkMode
              ? 'bg-[#1c1c1e]/98 border-white/15 text-white shadow-black/80'
              : 'bg-white/98 border-black/10 text-neutral-900 shadow-xl'
          }`}
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-500/15 text-[#007AFF] flex items-center justify-center shrink-0 border border-blue-500/25">
                <Bell className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-sm font-bold leading-tight">
                  Mobile & OS Notifications
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Real device alerts when friends chat or when active banter is happening, even if you exit or minimize Banter.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-neutral-400 hover:text-white p-1 rounded-full cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Feature Highlights */}
          <div className={`p-2.5 rounded-2xl text-[11px] space-y-1.5 border ${
            isDarkMode ? 'bg-white/[0.03] border-white/10' : 'bg-black/[0.02] border-black/5'
          }`}>
            <div className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span><strong>Friends:</strong> Real message appears in notification.</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF]" />
              <span><strong>Banter:</strong> Clean alerts when conversations are live.</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Works when online in-app & when you exit the app.</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Maybe Later
            </button>
            <button
              type="button"
              onClick={handleEnable}
              disabled={isRequesting}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-[#007AFF] hover:bg-[#0071E3] text-white transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{isRequesting ? 'Enabling...' : 'Enable Alerts'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
