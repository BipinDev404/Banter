import React from 'react';
import {
  Globe,
  MessageSquare,
  Users,
  Plus,
  Link2,
  ChevronRight,
  UserPlus,
  Check,
  Clock,
} from 'lucide-react';
import { ChatMessage, FriendItem, GroupItem, PrivateChatRequest } from '../types';
import { OnlineUserItem } from './OnlineUsersModal';
import { getAvatarForUser, getGroupAvatar } from '../lib/avatars';
import { UserAvatar } from './UserAvatar';

interface FriendlyHomeViewProps {
  onlineCount: number;
  globalMessages: ChatMessage[];
  friends: FriendItem[];
  groups: GroupItem[];
  onlineUsers: OnlineUserItem[];
  currentSessionId: string;
  incomingGroupInvites?: PrivateChatRequest[];
  pendingFriendsCount?: number;
  onOpenUniversalChat: () => void;
  onOpenFriendChat: (friendSessionId: string, friendName: string, avatarId?: string) => void;
  onOpenGroupChat: (group: GroupItem) => void;
  onOpenFriendsModal: () => void;
  onOpenCreateGroup: () => void;
  onOpenShareLink: () => void;
  onShareGroupLink?: (group: GroupItem) => void;
  onAcceptGroupInvite?: (req: PrivateChatRequest) => void;
  onDeclineGroupInvite?: (req: PrivateChatRequest) => void;
  isDarkMode?: boolean;
}

export const FriendlyHomeView: React.FC<FriendlyHomeViewProps> = ({
  onlineCount,
  globalMessages = [],
  friends = [],
  groups = [],
  onlineUsers = [],
  currentSessionId,
  incomingGroupInvites = [],
  pendingFriendsCount = 0,
  onOpenUniversalChat,
  onOpenFriendChat,
  onOpenGroupChat,
  onOpenFriendsModal,
  onOpenCreateGroup,
  onOpenShareLink,
  onShareGroupLink,
  onAcceptGroupInvite,
  onDeclineGroupInvite,
  isDarkMode = true,
}) => {
  const onlineSessionIds = new Set(onlineUsers.map((u) => u.sessionId));
  const latestGlobalMsg = globalMessages[globalMessages.length - 1];
  const latestGlobalPreview = latestGlobalMsg
    ? `${latestGlobalMsg.userName}: ${latestGlobalMsg.message || (latestGlobalMsg.attachment ? `[${latestGlobalMsg.attachment.type}]` : 'Sent a message')}`
    : 'Tap to join the live public conversation';

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-3.5 sm:px-6 py-4 space-y-6 overscroll-contain">
      <div className="max-w-2xl mx-auto space-y-6 pb-6">
        {/* 1. FIRST: Universal Chat */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Universal Chat
            </h2>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {onlineCount} online
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenUniversalChat}
            className={`w-full p-4 rounded-[24px] border flex items-center justify-between gap-3.5 text-left transition-all cursor-pointer active:scale-[0.99] ${
              isDarkMode
                ? 'bg-[#1c1c1e] hover:bg-[#242426] border-white/10 text-white'
                : 'bg-white hover:bg-neutral-50 border-black/5 text-neutral-900 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[#007AFF]/15 text-[#007AFF] flex items-center justify-center shrink-0 border border-[#007AFF]/20">
                <Globe className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-bold truncate">
                    Universal Chat
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#007AFF]/15 text-[#007AFF]">
                    Live
                  </span>
                </div>
                <p className="text-xs text-neutral-400 truncate mt-0.5">
                  {latestGlobalPreview}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4.5 h-4.5 text-neutral-400 shrink-0" />
          </button>
        </section>

        {/* 2. DOWN: Friends */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Friends ({friends.length})
              </h2>
              {pendingFriendsCount > 0 && (
                <button
                  type="button"
                  onClick={onOpenFriendsModal}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white cursor-pointer animate-pulse"
                >
                  {pendingFriendsCount} new
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onOpenFriendsModal}
              className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Friend</span>
            </button>
          </div>

          {friends.length === 0 ? (
            <div
              className={`p-4 rounded-[24px] border flex items-center justify-between gap-3 ${
                isDarkMode
                  ? 'bg-[#1c1c1e]/60 border-white/10 text-neutral-400'
                  : 'bg-white border-black/5 text-neutral-500'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <p className="text-xs leading-snug">
                  No friends yet. Add online users to message directly anytime.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenFriendsModal}
                className="px-3 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-semibold shrink-0 cursor-pointer"
              >
                Find
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => {
                const isOnline = onlineSessionIds.has(friend.friendSessionId);
                const avatar = getAvatarForUser(
                  friend.friendSessionId,
                  friend.friendName,
                  friend.avatarId
                );

                return (
                  <button
                    key={friend.friendSessionId}
                    type="button"
                    onClick={() =>
                      onOpenFriendChat(
                        friend.friendSessionId,
                        friend.friendName,
                        friend.avatarId
                      )
                    }
                    className={`w-full p-3.5 rounded-[22px] border flex items-center justify-between gap-3 text-left transition-all cursor-pointer active:scale-[0.99] ${
                      isDarkMode
                        ? 'bg-[#1c1c1e] hover:bg-[#242426] border-white/10 text-white'
                        : 'bg-white hover:bg-neutral-50 border-black/5 text-neutral-900 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        avatar={avatar}
                        size="md"
                        isOnline={isOnline}
                        showOnlineBadge={true}
                      />
                      <div className="min-w-0">
                        <span className="text-sm font-bold block truncate">
                          {friend.friendName}
                        </span>
                        <span
                          className={`text-[11px] block ${
                            isOnline ? 'text-emerald-500 font-medium' : 'text-neutral-400'
                          }`}
                        >
                          {isOnline ? 'Online • Tap to chat' : 'Tap to message'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* 3. DOWN: Groups & Temporary Link Chats */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1 gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Groups ({groups.length})
            </h2>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenShareLink}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  isDarkMode
                    ? 'bg-white/10 hover:bg-white/15 text-neutral-200'
                    : 'bg-black/5 hover:bg-black/10 text-neutral-800'
                }`}
              >
                <Link2 className="w-3.5 h-3.5 text-[#007AFF]" />
                <span>Share Link</span>
              </button>

              <button
                type="button"
                onClick={onOpenCreateGroup}
                className="px-2.5 py-1 rounded-xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>New Group</span>
              </button>
            </div>
          </div>

          {/* Pending Group Invites */}
          {incomingGroupInvites.length > 0 && (
            <div className="space-y-2">
              {incomingGroupInvites.map((inv) => {
                const grpAvatar = getGroupAvatar(inv.groupAvatarId, inv.groupName || 'Group');
                return (
                  <div
                    key={inv.id}
                    className={`p-3 rounded-[22px] border flex items-center justify-between gap-2.5 ${
                      isDarkMode
                        ? 'bg-emerald-950/30 border-emerald-800/50'
                        : 'bg-emerald-50 border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar avatar={grpAvatar} size="sm" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate">
                          {inv.groupName || 'Group Invite'}
                        </span>
                        <span className="text-[11px] text-neutral-400 block truncate">
                          Invited by {inv.fromUserName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {onDeclineGroupInvite && (
                        <button
                          type="button"
                          onClick={() => onDeclineGroupInvite(inv)}
                          className="px-2.5 py-1 rounded-xl border border-neutral-500/30 text-[11px] font-medium text-neutral-400 cursor-pointer"
                        >
                          Decline
                        </button>
                      )}
                      {onAcceptGroupInvite && (
                        <button
                          type="button"
                          onClick={() => onAcceptGroupInvite(inv)}
                          className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>Accept</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {groups.length === 0 ? (
            <div
              className={`p-4 rounded-[24px] border flex items-center justify-between gap-3 ${
                isDarkMode
                  ? 'bg-[#1c1c1e]/60 border-white/10 text-neutral-400'
                  : 'bg-white border-black/5 text-neutral-500'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-xs leading-snug">
                  Create a group with friends or make a shareable temporary chat link.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenShareLink}
                className="px-3 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-semibold shrink-0 cursor-pointer"
              >
                Link
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map((grp) => {
                const groupAvatar = getGroupAvatar(grp.avatarId, grp.name);
                const onlinePeers = grp.members.filter(
                  (mId) => mId !== currentSessionId && onlineSessionIds.has(mId)
                ).length;

                return (
                  <div
                    key={grp.id}
                    onClick={() => onOpenGroupChat(grp)}
                    className={`w-full p-3.5 rounded-[22px] border flex items-center justify-between gap-3 text-left transition-all cursor-pointer active:scale-[0.99] ${
                      isDarkMode
                        ? 'bg-[#1c1c1e] hover:bg-[#242426] border-white/10 text-white'
                        : 'bg-white hover:bg-neutral-50 border-black/5 text-neutral-900 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        avatar={groupAvatar}
                        size="md"
                        isOnline={onlinePeers > 0}
                        showOnlineBadge={onlinePeers > 0}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm font-bold truncate">{grp.name}</span>
                          {grp.isTemporary && (
                            <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 shrink-0">
                              <Clock className="w-2.5 h-2.5" />
                              Temp
                            </span>
                          )}
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-[#007AFF]/15 text-[#007AFF] shrink-0">
                            {grp.members.length}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                          {onlinePeers > 0 ? `${onlinePeers} online • ` : ''}
                          {grp.lastMessage || `Created by ${grp.creatorName}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {onShareGroupLink && (
                        <button
                          type="button"
                          onClick={() => onShareGroupLink(grp)}
                          className={`p-2 rounded-full transition-colors cursor-pointer ${
                            isDarkMode
                              ? 'hover:bg-white/10 text-neutral-400 hover:text-white'
                              : 'hover:bg-black/5 text-neutral-500 hover:text-black'
                          }`}
                          title="Copy / Share Group Link"
                        >
                          <Link2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenGroupChat(grp)}
                        className="p-1 text-neutral-400 cursor-pointer"
                        aria-label={`Open ${grp.name}`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
