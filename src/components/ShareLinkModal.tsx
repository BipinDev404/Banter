import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link2, Copy, Check, Share2, MessageSquare, Clock, Sparkles } from 'lucide-react';
import { GroupItem } from '../types';
import { REAL_ICON_AVATARS } from '../lib/avatars';
import { UserAvatar } from './UserAvatar';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTempGroupLink: (
    name: string,
    avatarId?: string
  ) => Promise<{ success: boolean; group?: GroupItem; shareUrl?: string; message?: string }>;
  onOpenGroupChat?: (group: GroupItem) => void;
  existingGroup?: GroupItem | null;
  isDarkMode?: boolean;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen,
  onClose,
  onCreateTempGroupLink,
  onOpenGroupChat,
  existingGroup = null,
  isDarkMode = true,
}) => {
  const groupAvatars = useMemo(() => REAL_ICON_AVATARS.filter((a) => a.gender === 'group'), []);
  const [groupName, setGroupName] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState(groupAvatars[0]?.id || 'clay_g_squad');
  const [createdResult, setCreatedResult] = useState<{
    group: GroupItem;
    shareUrl: string;
  } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setCopied(false);
      if (existingGroup) {
        const baseUrl =
          typeof window !== 'undefined'
            ? `${window.location.origin}${window.location.pathname}`
            : '';
        setCreatedResult({
          group: existingGroup,
          shareUrl: `${baseUrl}?join=${encodeURIComponent(existingGroup.id)}`,
        });
      } else {
        setGroupName('');
        setCreatedResult(null);
      }
    }
  }, [isOpen, existingGroup]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = groupName.trim();
    if (!clean) {
      setError('Enter a temporary group name first.');
      return;
    }
    setIsCreating(true);
    setError(null);
    const res = await onCreateTempGroupLink(clean, selectedAvatarId);
    setIsCreating(false);

    if (res.success && res.group && res.shareUrl) {
      setCreatedResult({ group: res.group, shareUrl: res.shareUrl });
    } else {
      setError(res.message || 'Could not create share link.');
    }
  };

  const handleCopy = async () => {
    if (!createdResult?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(createdResult.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // fallback
    }
  };

  const handleNativeShare = async () => {
    if (!createdResult?.shareUrl) return;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Join "${createdResult.group.name}" on Banter`,
          text: `Click to join the "${createdResult.group.name}" chat on Banter:`,
          url: createdResult.shareUrl,
        });
        return;
      } catch {
        // user cancelled or unavailable -> copy fallback
      }
    }
    handleCopy();
  };

  const currentAvatar =
    groupAvatars.find((g) => g.id === selectedAvatarId) || groupAvatars[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md select-none"
        >
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-link-title"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className={`relative z-10 w-full max-w-md rounded-[28px] border shadow-2xl flex flex-col overflow-hidden transition-colors backdrop-blur-2xl ${
              isDarkMode
                ? 'bg-[#1c1c1e] border-white/10 text-white'
                : 'bg-white border-black/10 text-neutral-900 shadow-xl'
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            {/* Header */}
            <div
              className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
                isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-black/5 bg-black/[0.02]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#007AFF]/15 text-[#007AFF] flex items-center justify-center">
                  <Link2 className="w-4.5 h-4.5 stroke-[2.3]" />
                </div>
                <div>
                  <h2 id="share-link-title" className="text-base font-bold tracking-tight leading-none">
                    {createdResult ? 'Share Chat Link' : 'Create Temporary Chat Link'}
                  </h2>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Anyone with the link can enter their name &amp; join
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  isDarkMode
                    ? 'text-neutral-400 hover:text-white hover:bg-white/10'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-black/5'
                }`}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createdResult ? (
              <div className="p-5 space-y-4">
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isDarkMode
                      ? 'bg-[#2c2c2e]/70 border-white/10'
                      : 'bg-neutral-50 border-black/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      avatar={
                        groupAvatars.find((g) => g.id === createdResult.group.avatarId) ||
                        currentAvatar
                      }
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold truncate">{createdResult.group.name}</p>
                        {createdResult.group.isTemporary && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 shrink-0">
                            Temp
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Temporary room • Auto-expires after 2h idle</span>
                      </p>
                    </div>
                  </div>

                  {/* Link Box */}
                  <div
                    className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      isDarkMode
                        ? 'bg-black/50 border-white/10 text-neutral-200'
                        : 'bg-white border-black/10 text-neutral-800'
                    }`}
                  >
                    <input
                      type="text"
                      readOnly
                      value={createdResult.shareUrl}
                      onFocus={(e) => e.target.select()}
                      className="flex-1 bg-transparent text-xs font-mono focus:outline-none truncate select-text"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                        copied
                          ? 'bg-emerald-500 text-white'
                          : 'bg-[#007AFF] hover:bg-[#0071E3] text-white'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className={`flex-1 py-2.5 px-4 rounded-2xl text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      isDarkMode
                        ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                        : 'bg-black/5 hover:bg-black/10 border-black/10 text-neutral-800'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Link</span>
                  </button>

                  {onOpenGroupChat && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenGroupChat(createdResult.group);
                        onClose();
                      }}
                      className="flex-[1.3] py-2.5 px-4 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Open Group Chat</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="p-5 space-y-4">
                {error && (
                  <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Temporary Group Name
                  </label>
                  <div className="flex items-center gap-2.5">
                    <UserAvatar avatar={currentAvatar} size="lg" />
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => {
                        setGroupName(e.target.value);
                        setError(null);
                      }}
                      maxLength={40}
                      placeholder="e.g. Weekend Trip, Quick Sync, Hangout..."
                      autoFocus
                      className={`flex-1 px-4 py-3 text-sm font-semibold rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#007AFF]/25 ${
                        isDarkMode
                          ? 'bg-[#2c2c2e] border-white/10 text-white placeholder-neutral-500'
                          : 'bg-neutral-100 border-black/5 text-neutral-900 placeholder-neutral-400'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Group Icon
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {groupAvatars.map((av) => {
                      const isSelected = selectedAvatarId === av.id;
                      return (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setSelectedAvatarId(av.id)}
                          className={`flex flex-col items-center p-2 rounded-2xl transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-[#007AFF]/15 border-[#007AFF] ring-2 ring-[#007AFF]/30'
                              : isDarkMode
                              ? 'bg-neutral-900/60 border-neutral-800 hover:bg-neutral-800/60'
                              : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'
                          }`}
                        >
                          <UserAvatar avatar={av} size="sm" className="mb-1" />
                          <span className="text-[10px] font-semibold truncate max-w-full">
                            {av.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 ${
                    isDarkMode
                      ? 'bg-[#007AFF]/10 border-[#007AFF]/20 text-blue-300'
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-[#007AFF] shrink-0" />
                  <span className="text-[11px] leading-snug">
                    Share the link anywhere — anyone who clicks it enters their name and joins this temporary group chat immediately.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isCreating || !groupName.trim()}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] active:scale-[0.98] disabled:opacity-40 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20"
                >
                  <Link2 className="w-4 h-4 stroke-[2.3]" />
                  <span>{isCreating ? 'Creating Link...' : 'Create & Get Share Link'}</span>
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
