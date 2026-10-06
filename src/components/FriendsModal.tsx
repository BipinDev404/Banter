import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  UserPlus,
  UserCheck,
  Check,
  Lock,
  MessageCircle,
  Search,
  Trash2,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { FriendItem, FriendRequest } from '../types';
import { getAvatarForUser } from '../lib/avatars';
import { OnlineUserItem } from './OnlineUsersModal';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: FriendItem[];
  incomingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  onAcceptRequest: (req: FriendRequest) => void;
  onDeclineRequest: (req: FriendRequest) => void;
  onSendRequest: (targetSessionId: string, targetUserName: string, avatarId?: string) => Promise<{ success: boolean; message: string }>;
  onRemoveFriend: (friendSessionId: string) => void;
  onStartPrivateChat: (friendSessionId: string, friendName: string) => void;
  onlineUsers: OnlineUserItem[];
  currentSessionId: string;
  isDarkMode?: boolean;
}

type FriendsTab = 'list' | 'requests' | 'add';

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  friends = [],
  incomingRequests = [],
  sentRequests = [],
  onAcceptRequest,
  onDeclineRequest,
  onSendRequest,
  onRemoveFriend,
  onStartPrivateChat,
  onlineUsers = [],
  currentSessionId,
  isDarkMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<FriendsTab>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [addFeedback, setAddFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  // Filter friends by search query
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const q = searchQuery.toLowerCase().trim();
    return friends.filter((f) => f.friendName.toLowerCase().includes(q));
  }, [friends, searchQuery]);

  // Online status set for quick lookup
  const onlineSessionIds = useMemo(() => {
    return new Set(onlineUsers.map((u) => u.sessionId));
  }, [onlineUsers]);

  // Eligible users from online users who are NOT current user and NOT already friends
  const nonFriendOnlineUsers = useMemo(() => {
    const friendIds = new Set(friends.map((f) => f.friendSessionId));
    return onlineUsers.filter(
      (u) => !u.isSelf && !friendIds.has(u.sessionId)
    );
  }, [onlineUsers, friends]);

  if (!isOpen) return null;

  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetName = usernameInput.trim();
    if (!targetName) return;

    // Search in online users first
    const foundOnline = onlineUsers.find(
      (u) => !u.isSelf && u.userName.toLowerCase() === targetName.toLowerCase()
    );

    if (foundOnline) {
      const res = await onSendRequest(foundOnline.sessionId, foundOnline.userName, foundOnline.avatar.id);
      setAddFeedback({ message: res.message, isError: !res.success });
      if (res.success) setUsernameInput('');
    } else {
      setAddFeedback({
        message: `User "${targetName}" is not currently in the room. You can add users directly from the Online list or Chat!`,
        isError: true,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150 select-none">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="friends-title"
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
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="friends-title" className="text-base font-bold tracking-tight leading-none">
                  Friends Center
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                  {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Saved friends you can chat with anytime
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
            aria-label="Close friends center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className={`px-4 py-2 border-b flex items-center gap-1.5 shrink-0 ${
            isDarkMode ? 'border-neutral-800/80 bg-neutral-900/30' : 'border-neutral-100 bg-neutral-50/30'
          }`}
        >
          {/* Friends List Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-[#007AFF] text-white shadow-xs'
                : isDarkMode
                ? 'text-neutral-400 hover:bg-neutral-800'
                : 'text-neutral-600 hover:bg-neutral-200/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>My Friends</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'list' ? 'bg-white/25 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
              }`}
            >
              {friends.length}
            </span>
          </button>

          {/* Pending Requests Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer relative ${
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
            className={`px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
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

        {/* Tab 1: Confirmed Friends List */}
        {activeTab === 'list' && (
          <div className="flex-1 flex flex-col min-h-0 p-4 space-y-3">
            {/* Search Filter */}
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

            {/* List */}
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
                    Send a friend request to people in the room to save them and chat privately anytime later!
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
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                        isDarkMode
                          ? 'bg-neutral-900/60 border-neutral-800 hover:bg-neutral-850'
                          : 'bg-neutral-50/70 border-neutral-200 hover:bg-neutral-100/70'
                      }`}
                    >
                      {/* Left: Avatar + Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative">
                          <div
                            className={`w-10 h-10 rounded-full ${avatar.bgColor} border border-black/5 dark:border-white/10 flex items-center justify-center text-xl shrink-0 shadow-2xs`}
                          >
                            <span>{avatar.emoji}</span>
                          </div>
                          {/* Live Online Badge */}
                          <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white dark:ring-neutral-900 ${
                              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                            }`}
                            title={isOnline ? 'Online now' : 'Offline'}
                          />
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold truncate text-neutral-900 dark:text-neutral-100">
                              {friend.friendName}
                            </span>
                          </div>
                          <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isOnline ? 'bg-emerald-500' : 'bg-neutral-400'
                              }`}
                            />
                            <span>{isOnline ? 'Active in chat' : 'Offline (chat saved)'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Right Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onStartPrivateChat(friend.friendSessionId, friend.friendName);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          title={`Start 1-on-1 private chat with ${friend.friendName}`}
                        >
                          <Lock className="w-3.5 h-3.5 stroke-[2.2]" />
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

        {/* Tab 2: Pending Requests */}
        {activeTab === 'requests' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Incoming Requests Section */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Incoming Friend Requests ({incomingRequests.length})
                </span>
              </div>

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
                          <div
                            className={`w-10 h-10 rounded-full ${avatar.bgColor} flex items-center justify-center text-xl shrink-0`}
                          >
                            <span>{avatar.emoji}</span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold truncate text-neutral-900 dark:text-neutral-100">
                              {req.fromUserName}
                            </span>
                            <span className="text-[11px] text-neutral-400">
                              Wants to be friends to chat later
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
                            onClick={() => onAcceptRequest(req)}
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

            {/* Sent Requests Section */}
            {sentRequests.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Sent Requests ({sentRequests.length})
                  </span>
                </div>

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

        {/* Tab 3: Add Friends */}
        {activeTab === 'add' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Feedback notification */}
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

            {/* Online Users to Add */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Active Users in Chat ({nonFriendOnlineUsers.length})
                </span>
              </div>

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
                          <div
                            className={`w-9 h-9 rounded-full ${user.avatar.bgColor} flex items-center justify-center text-lg shrink-0`}
                          >
                            <span>{user.avatar.emoji}</span>
                          </div>
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
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
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

            {/* Search by username form */}
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Add By Username
              </label>
              <form onSubmit={handleManualAddSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter exact username..."
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
  );
};
