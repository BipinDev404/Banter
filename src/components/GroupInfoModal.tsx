import React from 'react';
import { X, Users, LogOut, ShieldCheck } from 'lucide-react';
import { GroupItem, GroupMemberInfo } from '../types';
import { getGroupAvatar, getAvatarForUser, renderAvatarIcon } from '../lib/avatars';
import { UserAvatar } from './UserAvatar';

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupItem | null;
  currentSessionId: string;
  onLeaveGroup: (groupId: string) => void;
  isDarkMode?: boolean;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  isOpen,
  onClose,
  group,
  currentSessionId,
  onLeaveGroup,
  isDarkMode = false,
}) => {
  if (!isOpen || !group) return null;

  const groupAvatar = getGroupAvatar(group.avatarId, group.name);
  const memberList = Object.values(group.memberDetails || {}) as GroupMemberInfo[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-info-title"
        className={`relative z-10 w-full max-w-sm rounded-[28px] border shadow-2xl flex flex-col overflow-hidden transition-all animate-in zoom-in-95 duration-150 backdrop-blur-2xl ${
          isDarkMode
            ? 'border-white/10 bg-[#1c1c1e] text-white'
            : 'border-black/10 bg-white text-neutral-900 shadow-xl'
        }`}
      >
        {/* Apple subtle top light catching highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <UserAvatar avatar={groupAvatar} size="sm" />
            <div>
              <h2 id="group-info-title" className="text-sm font-bold tracking-tight leading-none">
                Group Details
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

        {/* Group Hero Banner */}
        <div className="p-5 flex flex-col items-center text-center border-b border-neutral-100 dark:border-neutral-800/60">
          <UserAvatar avatar={groupAvatar} size="xl" className="mb-2" />
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">{group.name}</h3>
          <p className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-blue-500" />
            <span>Created by {group.creatorName || 'Member'}</span>
          </p>
        </div>

        {/* Members List */}
        <div className="p-4 flex-1 overflow-y-auto max-h-56 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Members ({memberList.length})
          </span>

          {memberList.map((m) => {
            const isSelf = m.sessionId === currentSessionId;
            const isCreator = m.sessionId === group.createdBy;
            const avatar = getAvatarForUser(m.sessionId, m.userName, m.avatarId);

            return (
              <div
                key={m.sessionId}
                className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2.5 ${
                  isDarkMode ? 'bg-neutral-900/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <UserAvatar avatar={avatar} size="xs" />
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
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Leave group "${group.name}"?`)) {
                onLeaveGroup(group.id);
                onClose();
              }
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Group</span>
          </button>
        </div>
      </div>
    </div>
  );
};
