import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut, ShieldCheck, UserPlus, Check, ArrowLeft, Sparkles, Search, Link2, Clock } from 'lucide-react';
import { FriendItem, GroupItem, GroupMemberInfo } from '../types';
import { getGroupAvatar, getAvatarForUser } from '../lib/avatars';
import { UserAvatar } from './UserAvatar';
import { OnlineUserItem } from './OnlineUsersModal';

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupItem | null;
  currentSessionId: string;
  onLeaveGroup: (groupId: string) => void;
  friends?: FriendItem[];
  onlineUsers?: OnlineUserItem[];
  onAddFriendsToGroup?: (
    groupId: string,
    friendsToAdd: { sessionId: string; userName: string; avatarId?: string }[]
  ) => Promise<boolean>;
  onSendGroupInvite?: (
    targetSessionId: string,
    targetUserName: string,
    group: { id: string; name: string; avatarId?: string }
  ) => Promise<boolean>;
  initialShowAddMembers?: boolean;
  onShareGroupLink?: (group: GroupItem) => void;
  isDarkMode?: boolean;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  isOpen,
  onClose,
  group,
  currentSessionId,
  onLeaveGroup,
  friends = [],
  onlineUsers = [],
  onAddFriendsToGroup,
  onSendGroupInvite,
  initialShowAddMembers = false,
  onShareGroupLink,
  isDarkMode = false,
}) => {
  const [showAddView, setShowAddView] = useState(initialShowAddMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [pendingConfirmUser, setPendingConfirmUser] = useState<OnlineUserItem | null>(null);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowAddView(initialShowAddMembers);
      setSearchQuery('');
      setPendingConfirmUser(null);
      setConfirmLeave(false);
    }
  }, [isOpen, initialShowAddMembers, group?.id]);

  const groupAvatar = group ? getGroupAvatar(group.avatarId, group.name) : null;
  const memberList = group ? (Object.values(group.memberDetails || {}) as GroupMemberInfo[]) : [];

  const onlineSessionIds = useMemo(
    () => new Set(onlineUsers.map((u) => u.sessionId)),
    [onlineUsers]
  );

  const existingMemberIds = useMemo(
    () => new Set(group?.members || []),
    [group?.members]
  );

  const friendIds = useMemo(
    () => new Set(friends.map((f) => f.friendSessionId)),
    [friends]
  );

  const addableFriends = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return friends.filter(
      (f) =>
        !existingMemberIds.has(f.friendSessionId) &&
        (!q || f.friendName.toLowerCase().includes(q))
    );
  }, [friends, existingMemberIds, searchQuery]);

  const invitableOnlineUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return onlineUsers.filter(
      (u) =>
        !u.isSelf &&
        !existingMemberIds.has(u.sessionId) &&
        !friendIds.has(u.sessionId) &&
        (!q || u.userName.toLowerCase().includes(q))
    );
  }, [onlineUsers, existingMemberIds, friendIds, searchQuery]);

  const handleConfirmSendInvite = async () => {
    if (!group || !pendingConfirmUser || !onSendGroupInvite) return;
    setIsSendingInvite(true);
    const ok = await onSendGroupInvite(pendingConfirmUser.sessionId, pendingConfirmUser.userName, {
      id: group.id,
      name: group.name,
      avatarId: group.avatarId,
    });
    setIsSendingInvite(false);
    if (ok) {
      setInvitedIds((prev) => [...prev, pendingConfirmUser.sessionId]);
      setPendingConfirmUser(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && group && groupAvatar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md select-none"
        >
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="group-info-title"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className={`relative z-10 w-full max-w-sm rounded-[28px] border shadow-2xl flex flex-col overflow-hidden transition-colors backdrop-blur-2xl ${
              isDarkMode
                ? 'border-white/10 bg-[#1c1c1e] text-white'
                : 'border-black/10 bg-white text-neutral-900 shadow-xl'
            }`}
          >
            {/* Apple subtle top light catching highlight */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
              <div className="flex items-center gap-2.5 min-w-0">
                {showAddView && !pendingConfirmUser && (
                  <button
                    type="button"
                    onClick={() => setShowAddView(false)}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                      isDarkMode ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-neutral-100 text-neutral-700'
                    }`}
                    aria-label="Back to details"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <UserAvatar avatar={groupAvatar} size="sm" />
                <div className="min-w-0">
                  <h2 id="group-info-title" className="text-sm font-bold tracking-tight leading-none truncate">
                    {pendingConfirmUser
                      ? 'Confirm Group Invite'
                      : showAddView
                      ? `Add to ${group.name}`
                      : 'Group Details'}
                  </h2>
                  <span className="text-[10px] text-neutral-400">
                    {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  isDarkMode
                    ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pendingConfirmUser ? (
              /* Confirmation Box for adding an online non-friend to group */
              <div className="p-5 space-y-4">
                <div
                  className={`p-4 rounded-2xl border text-center space-y-2.5 ${
                    isDarkMode ? 'bg-neutral-900/70 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                  }`}
                >
                  <div className="flex justify-center">
                    <UserAvatar avatar={pendingConfirmUser.avatar} size="lg" isOnline={true} showOnlineBadge={true} />
                  </div>
                  <p className="text-sm font-bold">{pendingConfirmUser.userName}</p>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Send a confirmation box to invite <strong className={isDarkMode ? 'text-white' : 'text-neutral-900'}>{pendingConfirmUser.userName}</strong> to <strong className={isDarkMode ? 'text-white' : 'text-neutral-900'}>{group.name}</strong>?
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/12 text-emerald-500 dark:text-emerald-400 text-[11px] font-semibold">
                    <Sparkles className="w-3 h-3" />
                    <span>One-click accept joins &amp; makes you friends</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPendingConfirmUser(null)}
                    className={`flex-1 py-2.5 px-4 rounded-2xl text-xs font-semibold border cursor-pointer ${
                      isDarkMode
                        ? 'border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300'
                        : 'border-black/10 bg-black/5 hover:bg-black/10 text-neutral-700'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSendingInvite}
                    onClick={handleConfirmSendInvite}
                    className="flex-[1.4] py-2.5 px-4 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>{isSendingInvite ? 'Sending...' : 'Confirm & Invite'}</span>
                  </button>
                </div>
              </div>
            ) : showAddView ? (
              /* Add Friends & All Online Users View */
              <div className="p-4 flex-1 flex flex-col min-h-0 space-y-3">
                <div className="relative shrink-0">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search friends or online users..."
                    className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      isDarkMode
                        ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                    }`}
                  />
                </div>

                <div className="flex-1 overflow-y-auto max-h-72 space-y-3 pr-1">
                  {addableFriends.length === 0 && invitableOnlineUsers.length === 0 ? (
                    <div className="py-8 text-center text-xs text-neutral-400">
                      Everyone available is already in this group.
                    </div>
                  ) : (
                    <>
                      {addableFriends.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-400 block">
                            Your Friends ({addableFriends.length})
                          </span>
                          {addableFriends.map((friend) => {
                            const avatar = getAvatarForUser(
                              friend.friendSessionId,
                              friend.friendName,
                              friend.avatarId
                            );
                            const isOnline = onlineSessionIds.has(friend.friendSessionId);
                            return (
                              <div
                                key={friend.friendSessionId}
                                className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2.5 ${
                                  isDarkMode
                                    ? 'bg-neutral-900/60 border-neutral-800'
                                    : 'bg-neutral-50 border-neutral-200/80'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <UserAvatar avatar={avatar} size="xs" isOnline={isOnline} showOnlineBadge={isOnline} />
                                  <span className="text-xs font-semibold truncate">{friend.friendName}</span>
                                </div>
                                {onAddFriendsToGroup && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onAddFriendsToGroup(group.id, [
                                        {
                                          sessionId: friend.friendSessionId,
                                          userName: friend.friendName,
                                          avatarId: friend.avatarId,
                                        },
                                      ])
                                    }
                                    className="px-2.5 py-1 rounded-xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
                                  >
                                    <UserPlus className="w-3 h-3" />
                                    <span>Add</span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {invitableOnlineUsers.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>All Online Users ({invitableOnlineUsers.length})</span>
                          </span>
                          {invitableOnlineUsers.map((user) => {
                            const alreadyInvited = invitedIds.includes(user.sessionId);
                            return (
                              <div
                                key={user.sessionId}
                                className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2.5 ${
                                  isDarkMode
                                    ? 'bg-neutral-900/60 border-neutral-800'
                                    : 'bg-neutral-50 border-neutral-200/80'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <UserAvatar avatar={user.avatar} size="xs" isOnline={true} showOnlineBadge={true} />
                                  <div className="min-w-0">
                                    <span className="text-xs font-semibold truncate block">{user.userName}</span>
                                    <span className="text-[10px] text-neutral-400 block">Online now</span>
                                  </div>
                                </div>
                                {alreadyInvited ? (
                                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-500 text-[11px] font-semibold flex items-center gap-1 shrink-0">
                                    <Check className="w-3 h-3" />
                                    <span>Invited</span>
                                  </span>
                                ) : (
                                  onSendGroupInvite && (
                                    <button
                                      type="button"
                                      onClick={() => setPendingConfirmUser(user)}
                                      className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
                                    >
                                      <UserPlus className="w-3 h-3" />
                                      <span>Add</span>
                                    </button>
                                  )
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Group Hero Banner */}
                <div className="p-5 flex flex-col items-center text-center border-b border-neutral-100 dark:border-neutral-800/60">
                  <UserAvatar avatar={groupAvatar} size="xl" className="mb-2" />
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">{group.name}</h3>
                    {group.isTemporary && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500">
                        <Clock className="w-2.5 h-2.5" />
                        Temp
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-blue-500" />
                    <span>Created by {group.creatorName || 'Member'}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    {(onAddFriendsToGroup || onSendGroupInvite) && (
                      <button
                        type="button"
                        onClick={() => setShowAddView(true)}
                        className="px-3.5 py-1.5 rounded-full bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add Friends / Online</span>
                      </button>
                    )}
                    {onShareGroupLink && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onShareGroupLink(group);
                        }}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all border ${
                          isDarkMode
                            ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/25'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Share Invite Link</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Members List */}
                <div className="p-4 flex-1 overflow-y-auto max-h-56 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Members ({memberList.length})
                  </span>

                  {memberList.map((m) => {
                    const isSelf = m.sessionId === currentSessionId;
                    const isCreator = m.sessionId === group.createdBy;
                    const isOnline = isSelf || onlineSessionIds.has(m.sessionId);
                    const avatar = getAvatarForUser(m.sessionId, m.userName, m.avatarId);

                    return (
                      <div
                        key={m.sessionId}
                        className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2.5 ${
                          isDarkMode ? 'bg-neutral-900/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserAvatar avatar={avatar} size="xs" isOnline={isOnline} showOnlineBadge={isOnline} />
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold truncate text-neutral-900 dark:text-neutral-100">
                                {m.userName}
                              </span>
                              {isSelf && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-500 text-white">
                                  You
                                </span>
                              )}
                            </div>
                            {isCreator && (
                              <span className="text-[10px] text-blue-500 font-semibold">Group Admin</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Actions Footer */}
                <div className="p-4 border-t border-neutral-100 dark:border-neutral-800/80">
                  {confirmLeave ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmLeave(false)}
                        className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-semibold border cursor-pointer ${
                          isDarkMode
                            ? 'border-white/10 bg-white/5 text-neutral-300'
                            : 'border-black/10 bg-black/5 text-neutral-700'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onLeaveGroup(group.id);
                          setConfirmLeave(false);
                          onClose();
                        }}
                        className="flex-1 py-2.5 px-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold cursor-pointer"
                      >
                        Confirm Leave
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmLeave(true)}
                      className="w-full py-2.5 px-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-red-500/20"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Leave Group</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
