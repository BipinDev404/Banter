import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Info,
  Github,
  ExternalLink,
  ShieldCheck,
  Zap,
  MessageSquare,
  Code2,
  X,
  User,
  Heart,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { BanterLogo } from './BanterLogo';
import { getAvatarForUser } from '../lib/avatars';
import { UserAvatar } from './UserAvatar';
import { DeveloperGitHubCard } from './DeveloperGitHubCard';
import { fetchGitHubProfile } from '../lib/github';

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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSyncingGitHub, setIsSyncingGitHub] = useState(false);
  const [githubSyncedUser, setGithubSyncedUser] = useState<string | null>(null);

  const handleSyncGitHubProfile = async () => {
    const handle = name.trim() || 'Bipindev404';
    setIsSyncingGitHub(true);
    const data = await fetchGitHubProfile(handle);
    if (data) {
      setName(data.name || data.login);
      setGithubSyncedUser(data.login);
      setError(null);
    } else {
      setError(`Could not sync GitHub profile for "${handle}"`);
    }
    setIsSyncingGitHub(false);
  };

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
    <div className="min-h-screen min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-black text-white relative select-none overflow-y-auto">
      {/* Ambient Apple subtle gradient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md rounded-[32px] bg-[#1c1c1e]/90 border border-white/10 p-6 sm:p-8 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)] relative z-10 backdrop-blur-2xl transition-all my-auto text-left">
        {/* Subtle top edge highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none rounded-t-[32px]" />

        {/* Brand Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="mb-3">
            <BanterLogo size="xl" showText={true} textClassName="text-white" />
          </div>
          <p className="text-neutral-400 text-xs font-normal tracking-tight">
            Talk. Laugh. Banter. Real-time live messaging.
          </p>
        </div>

        {/* 1. First: About Banter Explanation Section */}
        <div className="space-y-4 mb-6">
          <div className="p-4.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Info className="w-4 h-4 text-[#007AFF]" />
              <span>What is Banter?</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Banter is a fast, real-time social chat platform designed for instant live conversations. Connect with people in global public rooms, start direct 1-on-1 private chats, or create group rooms with clean 3D human avatars and Apple-style tapback reactions.
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-neutral-300 pt-1">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Global Public Chat</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>1-on-1 Private Rooms</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Groups & Tapbacks</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                <Code2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>3D Human Avatars</span>
              </div>
            </div>
          </div>

          {/* Developer Section: Bipin Yadav GitHub Sync Profile */}
          <DeveloperGitHubCard username="Bipindev404" isDarkMode={true} />
        </div>

        {/* 2. Next: Prominent Start Chat Button */}
        <button
          type="button"
          onClick={() => setIsLoginModalOpen(true)}
          className="w-full py-4 px-6 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] active:scale-[0.98] text-white font-extrabold text-base transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xl shadow-blue-500/25"
        >
          <MessageSquare className="w-5 h-5 stroke-[2.2]" />
          <span>Start Chat</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Login Popup Modal (Opened after clicking 'Start Chat') */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            onClick={() => setIsLoginModalOpen(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: 'spring', damping: 26, stiffness: 360 }}
              className="w-full max-w-sm rounded-[32px] bg-[#1c1c1e] border border-white/15 p-6 sm:p-8 shadow-2xl relative z-10 text-left"
            >
            {/* Subtle top edge highlight */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none rounded-t-[32px]" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Title */}
            <div className="mb-5 text-center">
              <h2 className="text-xl font-extrabold text-white">Join Banter</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Enter your username to start chatting
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Profile Card Preview */}
              <div className="p-3.5 rounded-2xl bg-[#2c2c2e]/80 border border-white/10 flex items-center gap-3">
                <UserAvatar avatar={previewAvatar} size="lg" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {name.trim() || 'Your Username'}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">
                    Assigned 3D Human Avatar
                  </p>
                </div>
              </div>

              {/* Username Input Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5 ml-0.5">
                  <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                    Choose Username
                  </label>
                  <button
                    type="button"
                    onClick={handleSyncGitHubProfile}
                    disabled={isSyncingGitHub}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#007AFF] hover:underline cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Github className="w-3 h-3 text-[#007AFF]" />
                    <span>{isSyncingGitHub ? 'Syncing...' : 'Sync GitHub Profile'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  maxLength={20}
                  placeholder="e.g. Alex or GitHub username"
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#2c2c2e] border border-transparent focus:border-[#007AFF] text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/25 text-sm font-medium transition-all"
                  autoFocus
                />
                {githubSyncedUser && (
                  <p className="mt-1 text-[11px] text-emerald-400 font-medium flex items-center gap-1 ml-0.5">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Synced with @{githubSyncedUser}</span>
                  </p>
                )}
                {error && <p className="mt-1.5 text-xs text-red-400 font-medium ml-0.5">{error}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20"
              >
                <span>Continue to Chat</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
};
