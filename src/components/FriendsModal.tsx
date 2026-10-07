import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  UserPlus,
  UserCheck,
  Check,
  Search,
  Trash2,
  Clock,
  Plus,
  FolderPlus,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { FriendItem, FriendRequest, GroupItem } from '../types';
import { getAvatarForUser, getGroupAvatar, renderAvatarIcon } from '../lib/avatars';
import { OnlineUserItem } from './OnlineUsersModal';
import { UserAvatar } from './UserAvatar';
import { CreateGroupModal } from './CreateGroupModal';
import { FriendAlertData } from './FriendAlertModal';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: FriendItem[];
  groups: GroupItem[];
  incomingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  onAcceptRequest: (req: FriendRequest) => void;
  onDeclineRequest: (req: FriendRequest) => void;
  onSendRequest: (targetSessionId: string, targetUserName: string, avatarId?: string) => Promise<{ success: boolean; message: string }>;
  onRemoveFriend: (friendSessionId: string) => void;
  onStartDirectChat: (friendSessionId: string, friendName: string, avatarId?: string) => void;
  onOpenGroupChat: (group: GroupItem) => void;
  onCreateGroup: (
    name: string,
    memberIds: string[],
    memberList: { sessionId: string; userName: string; avatarId?: string }[],
    avatarId?: string
  ) => Promise<{ success: boolean; group?: GroupItem; message?: string }>;
  onLeaveGroup: (groupId: string) => void;
  onlineUsers: OnlineUserItem[];
  currentSessionId: string;
  isDarkMode?: boolean;
  onShowFriendPopup?: (data: FriendAlertData) => void;
}

type FriendsTab = 'friends' | 'groups' | 'requests' | 'add';

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  friends = [],
  groups = [],
  incomingRequests = [],
  sentRequests = [],
  onAcceptRequest,
  onDeclineRequest,
  onSendRequest,
  onRemoveFriend,
  onStartDirectChat,
  onOpenGroupChat,
  onCreateGroup,
  onLeaveGroup,
  onlineUsers = [],
  currentSessionId,
  isDarkMode = false,
  onShowFriendPopup,
}) => {
  const [activeTab, setActiveTab] = useState<FriendsTab>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [addFeedback, setAddFeedback] = useState<{ message: string; isError?: boolean } | null>(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  // Online status set for fast lookup
  const onlineSessionIds = useMemo(() => {
    return new Set(onlineUsers.map((u) => u.sessionId));
  }, [onlineUsers]);

  // Filtered friends by search query
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const q = searchQuery.toLowerCase().trim();
    return friends.filter((f) => f.friendName.toLowerCase().includes(q));
  }, [friends, searchQuery]);

  // Filtered groups by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase().trim();
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, searchQuery]);

  // Non-friend online participants
  const nonFriendOnlineUsers = useMemo(() => {
    const friendIds = new Set(friends.map((f) => f.friendSessionId));
    return onlineUsers.filter((u) => !u.isSelf && !friendIds.has(u.sessionId));
  }, [onlineUsers, friends]);

  if (!isOpen) return null;

  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetName = usernameInput.trim();
    if (!targetName) return;

    const foundOnline = onlineUsers.find(
      (u) => !u.isSelf && u.userName.toLowerCase() === targetName.toLowerCase()
    );

    if (foundOnline) {
      const res = await onSendRequest(foundOnline.sessionId, foundOnline.userName, foundOnline.avatar.id);
      setAddFeedback({ message: res.message, isError: !res.success });
      if (res.success) {
        setUsernameInput('');
        onShowFriendPopup?.({
          type: 'sent',
          targetSessionId: foundOnline.sessionId,
          targetUserName: foundOnline.userName,
          targetAvatarId: foundOnline.avatar.id,
        });
      }
    } else {
      setAddFeedback({
        message: `User "${targetName}" is not currently online in the room. You can add users directly from Active Users!`,
        isError: true,
      });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150 select-none">
        {/* Backdrop */}
        <div className="absolute inset-0" onClick={onClose} />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="friends-title"
          className={`relative z-10 w-full max-w-lg h-[88vh] sm:h-[620px] rounded-[28px] border shadow-2xl flex flex-col overflow-hidden transition-all animate-in zoom-in-95 duration-150 backdrop-blur-2xl ${
            isDarkMode
              ? 'border-white/10 bg-[#1c1c1e] text-white'
              : 'border-black/10 bg-white text-neutral-900 shadow-xl'
          }`}
        >
          {/* Apple subtle top light catching highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {/* Header */}
          <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
            isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-black/5 bg-black/[0.01]'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center shadow-xs">
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="friends-title" className={`text-base font-bold tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                    Friends & Groups
                  </h2>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
                    {friends.length} {friends.length === 1 ? 'friend' : 'friends'} • {groups.length} {groups.length === 1 ? 'group' : 'groups'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Message friends or group chat with your circle
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-full transition-colors cursor-pointer active:scale-90 ${
                isDarkMode
                  ? 'text-neutral-400 hover:text-white hover:bg-white/10'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-black/5'
              }`}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className={`px-4 py-2 border-b flex items-center gap-1.5 shrink-0 overflow-x-auto scrollbar-none ${
            isDarkMode ? 'border-white/10 bg-white/[0.01]' : 'border-black/5 bg-neutral-50/70'
          }`}>
            {/* My Friends Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('friends')}
              className={`px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'friends'
                  ? 'bg-[#007AFF] text-white shadow-xs'
                  : isDarkMode
                  ? 'text-neutral-400 hover:bg-neutral-800'
                  : 'text-neutral-600 hover:bg-neutral-200/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Friends</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'friends' ? 'bg-white/25 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                }`}
              >
                {friends.length}
              </span>
            </button>

            {/* Friend Groups Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className={`px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'groups'
                  ? 'bg-[#007AFF] text-white shadow-xs'
                  : isDarkMode
                  ? 'text-neutral-400 hover:bg-neutral-800'
                  : 'text-neutral-600 hover:bg-neutral-200/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Groups</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'groups' ? 'bg-white/25 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                }`}
              >
                {groups.length}
              </span>
            </button>

            {/* Requests Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap relative ${
                activeTab === 'requests'
                  ? 'bg-[#007AFF] text-white shadow-xs'
                  : isDarkMode
                  ? 'text-neutral-400 hover:bg-neutral-800'
                  : 'text-neutral-600 hover:bg-neutral-200/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Requests</span>
              {incomingRequests.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  incomingRequests.length > 0
                    ? 'bg-emerald-500 text-white font-bold'
                    : activeTab === 'requests'
                    ? 'bg-white/25 text-white'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                }`}
              >
                {incomingRequests.length}
              </span>
            </button>

            {/* Add Friend Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('add')}
              className={`px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'add'
                  ? 'bg-[#007AFF] text-white shadow-xs'
                  : isDarkMode
                  ? 'text-neutral-400 hover:bg-neutral-800'
                  : 'text-neutral-600 hover:bg-neutral-200/60'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Friend</span>
            </button>
          </div>

          {/* Tab Body */}
          <div className="flex-1 flex flex-col min-h-0 p-4 overflow-hidden">
            {/* 1. Confirmed Friends List */}
            {activeTab === 'friends' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                {/* Search filter */}
                {friends.length > 0 && (
                  <div className="relative shrink-0">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter friends by name..."
                      className={`w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        isDarkMode
                          ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                      }`}
                    />
                  </div>
                )}

                {/* Friends list items */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {friends.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
                      <div className="w-14 h-14 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                        <UserPlus className="w-7 h-7 stroke-[2]" />
                      </div>
                      <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                        No friends added yet
                      </p>
                      <p className="text-xs text-neutral-400 max-w-xs mb-4">
                        Add friends to chat anytime with full persistent conversation history!
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('add')}
                        className="px-4 py-2 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Find & Add Friends</span>
                      </button>
                    </div>
                  ) : filteredFriends.length === 0 ? (
                    <div className="py-12 text-center text-neutral-400 text-xs">
                      No friends matching &ldquo;{searchQuery}&rdquo;
                    </div>
                  ) : (
                    filteredFriends.map((friend) => {
                      const avatar = getAvatarForUser(friend.friendSessionId, friend.friendName, friend.avatarId);
                      const isOnline = onlineSessionIds.has(friend.friendSessionId);

                      return (
                        <div
                          key={friend.friendSessionId}
                          onClick={() => {
                            onStartDirectChat(friend.friendSessionId, friend.friendName, friend.avatarId);
                            onClose();
                          }}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
                            isDarkMode
                              ? 'bg-neutral-900/60 border-neutral-800 hover:bg-neutral-850 hover:border-neutral-700'
                              : 'bg-neutral-50/70 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300'
                          }`}
                          title={`Click to chat with ${friend.friendName}`}
                        >
                          {/* Avatar + Info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <UserAvatar
                              avatar={avatar}
                              size="md"
                              isOnline={isOnline}
                              showOnlineBadge={true}
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-semibold truncate text-neutral-900 dark:text-neutral-100">
                                {friend.friendName}
                              </span>
                              <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                                  }`}
                                />
                                <span>{isOnline ? 'Active now • Click to chat' : 'Offline • Click to chat'}</span>
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => {
                                onStartDirectChat(friend.friendSessionId, friend.friendName, friend.avatarId);
                                onClose();
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-95"
                            >
                              <MessageSquare className="w-3.5 h-3.5 stroke-[2.2]" />
                              <span>Chat</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Remove ${friend.friendName} from your friends list?`)) {
                                  onRemoveFriend(friend.friendSessionId);
                                }
                              }}
                              className="p-1.5 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Remove friend"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 2. Groups Tab */}
            {activeTab === 'groups' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                {/* Actions Bar: Search + Create Group Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter groups..."
                      className={`w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        isDarkMode
                          ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                      }`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCreateGroupOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0 active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>New Group</span>
                  </button>
                </div>

                {/* Groups List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {groups.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
                      <div className="w-14 h-14 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                        <FolderPlus className="w-7 h-7 stroke-[2]" />
                      </div>
                      <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                        No groups created yet
                      </p>
                      <p className="text-xs text-neutral-400 max-w-xs mb-4">
                        Create custom groups with your friends for workgroups, projects, gaming, or hangouts!
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsCreateGroupOpen(true)}
                        className="px-4 py-2 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Create Your First Group</span>
                      </button>
                    </div>
                  ) : filteredGroups.length === 0 ? (
                    <div className="py-12 text-center text-neutral-400 text-xs">
                      No groups matching &ldquo;{searchQuery}&rdquo;
                    </div>
                  ) : (
                    filteredGroups.map((grp) => {
                      const groupAvatar = getGroupAvatar(grp.avatarId, grp.name);

                      return (
                        <div
                          key={grp.id}
                          onClick={() => {
                            onOpenGroupChat(grp);
                            onClose();
                          }}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
                            isDarkMode
                              ? 'bg-neutral-900/60 border-neutral-800 hover:bg-neutral-850 hover:border-neutral-700'
                              : 'bg-neutral-50/70 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300'
                          }`}
                        >
                          {/* Avatar + Info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <UserAvatar avatar={groupAvatar} size="md" />
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-semibold truncate text-neutral-900 dark:text-neutral-100">
                                {grp.name}
                              </span>
                              <span className="text-[11px] text-neutral-400 truncate">
                                {grp.lastMessage || `${grp.members.length} members • Created by ${grp.creatorName}`}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => {
                                onOpenGroupChat(grp);
                                onClose();
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-95"
                            >
                              <MessageSquare className="w-3.5 h-3.5 stroke-[2.2]" />
                              <span>Chat</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Leave group "${grp.name}"?`)) {
                                  onLeaveGroup(grp.id);
                                }
                              }}
                              className="p-1.5 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Leave group"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 3. Requests Tab */}
            {activeTab === 'requests' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Incoming Requests */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                    Incoming Requests ({incomingRequests.length})
                  </span>

                  {incomingRequests.length === 0 ? (
                    <div
                      className={`p-4 rounded-2xl border text-center text-xs text-neutral-400 ${
                        isDarkMode ? 'border-neutral-800 bg-neutral-900/40' : 'border-neutral-200 bg-neutral-50/50'
                      }`}
                    >
                      No pending incoming requests
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {incomingRequests.map((req) => {
                        const avatar = getAvatarForUser(req.fromSessionId, req.fromUserName, req.fromAvatarId);
                        return (
                          <div
                            key={req.id}
                            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                              isDarkMode ? 'bg-neutral-900/80 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <UserAvatar avatar={avatar} size="md" />
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-semibold truncate text-neutral-900 dark:text-neutral-100">
                                  {req.fromUserName}
                                </span>
                                <span className="text-[11px] text-neutral-400">
                                  Wants to add you as a friend
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => onDeclineRequest(req)}
                                className="px-2.5 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-medium text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                              >
                                Decline
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onAcceptRequest(req);
                                  onShowFriendPopup?.({
                                    type: 'accepted',
                                    targetSessionId: req.fromSessionId,
                                    targetUserName: req.fromUserName,
                                    targetAvatarId: req.fromAvatarId,
                                  });
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Confirm</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Sent Requests */}
                {sentRequests.length > 0 && (
                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                      Sent Requests ({sentRequests.length})
                    </span>
                    <div className="space-y-2">
                      {sentRequests.map((req) => (
                        <div
                          key={req.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                            isDarkMode ? 'border-neutral-800 bg-neutral-900/30' : 'border-neutral-200 bg-neutral-50/40'
                          }`}
                        >
                          <span className="font-medium">
                            Sent to <strong className="font-bold">{req.toUserName}</strong>
                          </span>
                          <span className="text-neutral-400 text-[11px] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Pending reply...</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Add Friend Tab */}
            {activeTab === 'add' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {addFeedback && (
                  <div
                    className={`p-3 rounded-2xl text-xs flex items-center justify-between border animate-in fade-in ${
                      addFeedback.isError
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    <span>{addFeedback.message}</span>
                    <button
                      type="button"
                      onClick={() => setAddFeedback(null)}
                      className="p-1 text-neutral-400 hover:text-black dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                    Active Users in Chat Room ({nonFriendOnlineUsers.length})
                  </span>

                  {nonFriendOnlineUsers.length === 0 ? (
                    <div
                      className={`p-5 rounded-2xl border text-center text-xs text-neutral-400 ${
                        isDarkMode ? 'border-neutral-800 bg-neutral-900/40' : 'border-neutral-200 bg-neutral-50/50'
                      }`}
                    >
                      All online users in the room are already in your friends list!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {nonFriendOnlineUsers.map((user) => {
                        const isAlreadySent = sentRequests.some((r) => r.toSessionId === user.sessionId);

                        return (
                          <div
                            key={user.sessionId}
                            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                              isDarkMode ? 'bg-neutral-900/80 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <UserAvatar avatar={user.avatar} size="sm" isOnline={true} showOnlineBadge={true} />
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-semibold truncate text-neutral-900 dark:text-neutral-100">
                                  {user.userName}
                                </span>
                                <span className="text-[11px] text-emerald-500 font-medium">
                                  Active now
                                </span>
                              </div>
                            </div>

                            {isAlreadySent ? (
                              <span className="text-[11px] text-neutral-400 px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700">
                                Requested
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={async () => {
                                  const res = await onSendRequest(user.sessionId, user.userName, user.avatar.id);
                                  setAddFeedback({ message: res.message, isError: !res.success });
                                  if (res.success) {
                                    onShowFriendPopup?.({
                                      type: 'sent',
                                      targetSessionId: user.sessionId,
                                      targetUserName: user.userName,
                                      targetAvatarId: user.avatar.id,
                                    });
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Add Friend</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Add By Exact Username
                  </label>
                  <form onSubmit={handleManualAddSubmit} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="Enter username..."
                      className={`flex-1 px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        isDarkMode
                          ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!usernameInput.trim()}
                      className="px-3.5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      Send Request
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        friends={friends}
        onCreateGroup={onCreateGroup}
        isDarkMode={isDarkMode}
      />
    </>
  );
};
