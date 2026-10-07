import React, { useState, useMemo } from 'react';
import { X, Users, Check, Search, UserPlus } from 'lucide-react';
import { FriendItem, GroupItem } from '../types';
import { REAL_ICON_AVATARS, getAvatarForUser } from '../lib/avatars';
import { UserAvatar } from './UserAvatar';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: FriendItem[];
  onCreateGroup: (
    name: string,
    memberIds: string[],
    memberList: { sessionId: string; userName: string; avatarId?: string }[],
    avatarId?: string
  ) => Promise<{ success: boolean; group?: GroupItem; message?: string }>;
  isDarkMode?: boolean;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  friends = [],
  onCreateGroup,
  isDarkMode = false,
}) => {
  const groupAvatars = useMemo(() => REAL_ICON_AVATARS.filter((a) => a.gender === 'group'), []);
  const [groupName, setGroupName] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState(groupAvatars[0]?.id || 'clay_g_squad');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const q = searchQuery.toLowerCase().trim();
    return friends.filter((f) => f.friendName.toLowerCase().includes(q));
  }, [friends, searchQuery]);

  if (!isOpen) return null;

  const toggleFriend = (friendSessionId: string) => {
    setError(null);
    setSelectedFriendIds((prev) =>
      prev.includes(friendSessionId)
        ? prev.filter((id) => id !== friendSessionId)
        : [...prev, friendSessionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFriendIds.length === friends.length) {
      setSelectedFriendIds([]);
    } else {
      setSelectedFriendIds(friends.map((f) => f.friendSessionId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = groupName.trim();

    if (!cleanName) {
      setError('Please enter a group name.');
      return;
    }

    if (selectedFriendIds.length === 0) {
      setError('Select at least one friend to add to the group.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const selectedMembers = friends
      .filter((f) => selectedFriendIds.includes(f.friendSessionId))
      .map((f) => ({
        sessionId: f.friendSessionId,
        userName: f.friendName,
        avatarId: f.avatarId,
      }));

    const result = await onCreateGroup(cleanName, selectedFriendIds, selectedMembers, selectedAvatarId);
    setIsSubmitting(false);

    if (result.success) {
      setGroupName('');
      setSelectedFriendIds([]);
      onClose();
    } else {
      setError(result.message || 'Failed to create group.');
    }
  };

  const currentGroupAvatar =
    groupAvatars.find((g) => g.id === selectedAvatarId) || groupAvatars[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-group-title"
        className={`relative z-10 w-full max-w-md rounded-[28px] border shadow-2xl flex flex-col overflow-hidden transition-all animate-in zoom-in-95 duration-150 backdrop-blur-2xl ${
          isDarkMode
            ? 'border-white/10 bg-[#1c1c1e] text-white'
            : 'border-black/10 bg-white text-neutral-900 shadow-xl'
        }`}
      >
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
            isDarkMode ? 'border-neutral-800/80 bg-neutral-900/50' : 'border-neutral-100 bg-neutral-50/50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 id="create-group-title" className="text-base font-bold tracking-tight leading-none">
                Create Friend Group
              </h2>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Group chat with your confirmed friends
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
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

        {/* Form Body */}
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
                placeholder="e.g. Design Squad, Weekend Hangout, Dev Team..."
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

          {/* Select Friends List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                Choose Members ({selectedFriendIds.length}/{friends.length})
              </label>
              {friends.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-semibold text-blue-500 hover:underline cursor-pointer"
                >
                  {selectedFriendIds.length === friends.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {friends.length === 0 ? (
              <div
                className={`p-4 rounded-2xl border text-center text-xs text-neutral-400 ${
                  isDarkMode ? 'border-neutral-800 bg-neutral-900/40' : 'border-neutral-200 bg-neutral-50/50'
                }`}
              >
                You need to add friends first before creating a group.
              </div>
            ) : (
              <div className="space-y-2">
                {/* Search filter for friends */}
                {friends.length > 4 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search friends..."
                      className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        isDarkMode
                          ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                      }`}
                    />
                  </div>
                )}

                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                  {filteredFriends.map((friend) => {
                    const isSelected = selectedFriendIds.includes(friend.friendSessionId);
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
                          <UserAvatar avatar={avatar} size="xs" />
                          <span className="text-xs font-semibold truncate text-neutral-900 dark:text-neutral-100">
                            {friend.friendName}
                          </span>
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
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !groupName.trim() || selectedFriendIds.length === 0}
              className="w-full py-3 px-4 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] active:scale-98 disabled:opacity-40 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating Group...' : 'Create Group'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
