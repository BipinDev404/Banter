import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Check, Search, UserPlus, Sparkles, ArrowLeft } from 'lucide-react';
import { FriendItem, GroupItem } from '../types';
import { REAL_ICON_AVATARS, getAvatarForUser } from '../lib/avatars';
import { UserAvatar } from './UserAvatar';
import { OnlineUserItem } from './OnlineUsersModal';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: FriendItem[];
  onlineUsers?: OnlineUserItem[];
  onCreateGroup: (
    name: string,
    memberIds: string[],
    memberList: { sessionId: string; userName: string; avatarId?: string }[],
    avatarId?: string,
    allowSoloWhilePending?: boolean
  ) => Promise<{ success: boolean; group?: GroupItem; message?: string }>;
  onSendGroupInvite?: (
    targetSessionId: string,
    targetUserName: string,
    group: { id: string; name: string; avatarId?: string }
  ) => Promise<boolean>;
  isDarkMode?: boolean;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  friends = [],
  onlineUsers = [],
  onCreateGroup,
  onSendGroupInvite,
  isDarkMode = false,
}) => {
  const groupAvatars = useMemo(() => REAL_ICON_AVATARS.filter((a) => a.gender === 'group'), []);
  const [groupName, setGroupName] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState(groupAvatars[0]?.id || 'clay_g_squad');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [selectedOnlineIds, setSelectedOnlineIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmStep, setShowConfirmStep] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onlineSessionSet = useMemo(() => {
    return new Set(onlineUsers.map((u) => u.sessionId));
  }, [onlineUsers]);

  // All online users who are NOT already in confirmed friends
  const onlineNonFriends = useMemo(() => {
    const friendIds = new Set(friends.map((f) => f.friendSessionId));
    return onlineUsers.filter((u) => !u.isSelf && !friendIds.has(u.sessionId));
  }, [onlineUsers, friends]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const q = searchQuery.toLowerCase().trim();
    return friends.filter((f) => f.friendName.toLowerCase().includes(q));
  }, [friends, searchQuery]);

  const filteredOnlineNonFriends = useMemo(() => {
    if (!searchQuery.trim()) return onlineNonFriends;
    const q = searchQuery.toLowerCase().trim();
    return onlineNonFriends.filter((u) => u.userName.toLowerCase().includes(q));
  }, [onlineNonFriends, searchQuery]);

  const toggleFriend = (friendSessionId: string) => {
    setError(null);
    setSelectedFriendIds((prev) =>
      prev.includes(friendSessionId)
        ? prev.filter((id) => id !== friendSessionId)
        : [...prev, friendSessionId]
    );
  };

  const toggleOnlineUser = (targetSessionId: string) => {
    setError(null);
    setSelectedOnlineIds((prev) =>
      prev.includes(targetSessionId)
        ? prev.filter((id) => id !== targetSessionId)
        : [...prev, targetSessionId]
    );
  };

  const handleSelectAllFriends = () => {
    if (selectedFriendIds.length === friends.length) {
      setSelectedFriendIds([]);
    } else {
      setSelectedFriendIds(friends.map((f) => f.friendSessionId));
    }
  };

  const resetAndClose = () => {
    setGroupName('');
    setSelectedFriendIds([]);
    setSelectedOnlineIds([]);
    setSearchQuery('');
    setShowConfirmStep(false);
    setError(null);
    onClose();
  };

  const executeCreate = async () => {
    const cleanName = groupName.trim();
    setIsSubmitting(true);
    setError(null);

    const selectedMembers = friends
      .filter((f) => selectedFriendIds.includes(f.friendSessionId))
      .map((f) => ({
        sessionId: f.friendSessionId,
        userName: f.friendName,
        avatarId: f.avatarId,
      }));

    const selectedOnlineUsers = onlineNonFriends.filter((u) =>
      selectedOnlineIds.includes(u.sessionId)
    );

    const result = await onCreateGroup(
      cleanName,
      selectedFriendIds,
      selectedMembers,
      selectedAvatarId,
      selectedOnlineUsers.length > 0
    );

    if (result.success && result.group && selectedOnlineUsers.length > 0 && onSendGroupInvite) {
      await Promise.all(
        selectedOnlineUsers.map((u) =>
          onSendGroupInvite(u.sessionId, u.userName, {
            id: result.group!.id,
            name: result.group!.name,
            avatarId: result.group!.avatarId,
          })
        )
      );
    }

    setIsSubmitting(false);

    if (result.success) {
      resetAndClose();
    } else {
      setShowConfirmStep(false);
      setError(result.message || 'Failed to create group.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = groupName.trim();

    if (!cleanName) {
      setError('Please enter a group name.');
      return;
    }

    if (selectedFriendIds.length === 0 && selectedOnlineIds.length === 0) {
      setError('Select at least one friend or online user to add.');
      return;
    }

    // Show confirmation box when inviting non-friend online users
    if (selectedOnlineIds.length > 0 && !showConfirmStep) {
      setShowConfirmStep(true);
      return;
    }

    await executeCreate();
  };

  const currentGroupAvatar =
    groupAvatars.find((g) => g.id === selectedAvatarId) || groupAvatars[0];

  const totalSelectedCount = selectedFriendIds.length + selectedOnlineIds.length;
  const selectedOnlineObjects = onlineNonFriends.filter((u) =>
    selectedOnlineIds.includes(u.sessionId)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md select-none"
        >
          <div className="absolute inset-0" onClick={resetAndClose} />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-group-title"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className={`relative z-10 w-full max-w-md rounded-[28px] border shadow-2xl flex flex-col overflow-hidden transition-colors backdrop-blur-2xl ${
              isDarkMode
                ? 'border-white/10 bg-[#1c1c1e] text-white'
                : 'border-black/10 bg-white text-neutral-900 shadow-xl'
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            {/* Header */}
            <div
              className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
                isDarkMode
                  ? 'border-neutral-800/80 bg-neutral-900/50'
                  : 'border-neutral-100 bg-neutral-50/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-xs">
                  <Users className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2
                    id="create-group-title"
                    className="text-base font-bold tracking-tight leading-none"
                  >
                    {showConfirmStep ? 'Confirm Group Invites' : 'Create Group'}
                  </h2>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {showConfirmStep
                      ? 'Send confirmation box to join & auto-friend'
                      : 'Add your friends or invite anyone online'}
                  </p>
                </div>
              </div>

              <button
                onClick={resetAndClose}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isDarkMode
                    ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {showConfirmStep ? (
              <div className="p-5 space-y-4">
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isDarkMode
                      ? 'bg-neutral-900/70 border-neutral-800'
                      : 'bg-neutral-50 border-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar avatar={currentGroupAvatar} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{groupName.trim()}</p>
                      <p className="text-[11px] text-neutral-400">
                        {selectedFriendIds.length > 0
                          ? `${selectedFriendIds.length} friend${selectedFriendIds.length > 1 ? 's' : ''} added directly • `
                          : ''}
                        {selectedOnlineObjects.length} invite{selectedOnlineObjects.length > 1 ? 's' : ''} to send
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                      Sending confirmation box to:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedOnlineObjects.map((u) => (
                        <div
                          key={u.sessionId}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${
                            isDarkMode
                              ? 'bg-white/5 border-white/10 text-white'
                              : 'bg-white border-black/10 text-neutral-800'
                          }`}
                        >
                          <UserAvatar avatar={u.avatar} size="xs" />
                          <span>{u.userName}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11.5px] leading-relaxed text-emerald-500 dark:text-emerald-400 font-medium flex items-center gap-1.5 pt-1">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      When they click Accept, they&apos;ll join this group and become your friend automatically!
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowConfirmStep(false)}
                    className={`flex-1 py-2.5 px-4 rounded-2xl text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      isDarkMode
                        ? 'border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300'
                        : 'border-black/10 bg-black/5 hover:bg-black/10 text-neutral-700'
                    }`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={executeCreate}
                    className="flex-[1.5] py-2.5 px-4 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>{isSubmitting ? 'Creating...' : 'Confirm & Create'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Form Body */
              <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {error && (
                  <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold animate-in fade-in">
                    {error}
                  </div>
                )}

                {/* Group Name & Icon Avatar Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Group Name
                  </label>
                  <div className="flex items-center gap-2.5">
                    <UserAvatar avatar={currentGroupAvatar} size="lg" />
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => {
                        setGroupName(e.target.value);
                        setError(null);
                      }}
                      maxLength={40}
                      placeholder="e.g. Design Squad, Weekend Hangout..."
                      className={`flex-1 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-2xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        isDarkMode
                          ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                      }`}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Group Vector Icon Preset Options */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Select Group Badge
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
                              ? 'bg-blue-500/15 border-blue-500 ring-2 ring-blue-500/30 shadow-xs'
                              : isDarkMode
                              ? 'bg-neutral-900/60 border-neutral-800 hover:bg-neutral-800/60'
                              : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'
                          }`}
                        >
                          <UserAvatar avatar={av} size="sm" className="mb-1" />
                          <span className="text-[10px] font-semibold truncate max-w-full text-neutral-700 dark:text-neutral-300">
                            {av.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Member Selection: Friends + All Online Users */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Add Members ({totalSelectedCount} selected)
                    </label>
                    {friends.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAllFriends}
                        className="text-xs font-semibold text-blue-500 hover:underline cursor-pointer"
                      >
                        {selectedFriendIds.length === friends.length
                          ? 'Deselect Friends'
                          : 'Select All Friends'}
                      </button>
                    )}
                  </div>

                  {/* Search bar across both friends & online users */}
                  {(friends.length + onlineNonFriends.length > 3 || searchQuery) && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search friends or online users..."
                        className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          isDarkMode
                            ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                        }`}
                      />
                    </div>
                  )}

                  {friends.length === 0 && onlineNonFriends.length === 0 ? (
                    <div
                      className={`p-4 rounded-2xl border text-center text-xs text-neutral-400 ${
                        isDarkMode
                          ? 'border-neutral-800 bg-neutral-900/40'
                          : 'border-neutral-200 bg-neutral-50/50'
                      }`}
                    >
                      No friends or other online users available right now.
                    </div>
                  ) : (
                    <div className="max-h-52 overflow-y-auto space-y-3 pr-1">
                      {/* Section 1: Confirmed Friends */}
                      {filteredFriends.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-400 block">
                            Your Friends ({filteredFriends.length})
                          </span>
                          {filteredFriends.map((friend) => {
                            const isSelected = selectedFriendIds.includes(friend.friendSessionId);
                            const isOnline = onlineSessionSet.has(friend.friendSessionId);
                            const avatar = getAvatarForUser(
                              friend.friendSessionId,
                              friend.friendName,
                              friend.avatarId
                            );

                            return (
                              <div
                                key={friend.friendSessionId}
                                onClick={() => toggleFriend(friend.friendSessionId)}
                                className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                                  isSelected
                                    ? isDarkMode
                                      ? 'bg-blue-950/40 border-blue-800 text-white'
                                      : 'bg-blue-50 border-blue-200 text-neutral-900'
                                    : isDarkMode
                                    ? 'bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800/60'
                                    : 'bg-neutral-50 border-neutral-200/80 hover:bg-neutral-100'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <UserAvatar
                                    avatar={avatar}
                                    size="xs"
                                    isOnline={isOnline}
                                    showOnlineBadge={isOnline}
                                  />
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-semibold truncate text-neutral-900 dark:text-neutral-100">
                                      {friend.friendName}
                                    </span>
                                    <span className="text-[10px] text-emerald-500 font-medium">
                                      Friend • Added directly
                                    </span>
                                  </div>
                                </div>

                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                                    isSelected
                                      ? 'bg-[#007AFF] border-[#007AFF] text-white shadow-2xs'
                                      : 'border-neutral-300 dark:border-neutral-700 bg-transparent'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Section 2: All Online Users (Confirmation Box + Auto-Friend on Accept) */}
                      {filteredOnlineNonFriends.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>All Online Users ({filteredOnlineNonFriends.length})</span>
                          </span>
                          {filteredOnlineNonFriends.map((user) => {
                            const isSelected = selectedOnlineIds.includes(user.sessionId);
                            return (
                              <div
                                key={user.sessionId}
                                onClick={() => toggleOnlineUser(user.sessionId)}
                                className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                                  isSelected
                                    ? isDarkMode
                                      ? 'bg-emerald-950/35 border-emerald-700/70 text-white'
                                      : 'bg-emerald-50 border-emerald-200 text-neutral-900'
                                    : isDarkMode
                                    ? 'bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800/60'
                                    : 'bg-neutral-50 border-neutral-200/80 hover:bg-neutral-100'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <UserAvatar
                                    avatar={user.avatar}
                                    size="xs"
                                    isOnline={true}
                                    showOnlineBadge={true}
                                  />
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-semibold truncate text-neutral-900 dark:text-neutral-100">
                                      {user.userName}
                                    </span>
                                    <span className="text-[10px] text-neutral-400">
                                      Invite confirmation • Auto-friend on accept
                                    </span>
                                  </div>
                                </div>

                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                                    isSelected
                                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs'
                                      : 'border-neutral-300 dark:border-neutral-700 bg-transparent'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !groupName.trim() || totalSelectedCount === 0}
                    className="w-full py-3 px-4 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] active:scale-98 disabled:opacity-40 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? 'Creating Group...'
                        : selectedOnlineIds.length > 0
                        ? `Continue (${totalSelectedCount} selected)`
                        : 'Create Group'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
