import React, { useState, useMemo } from 'react';
import { Search, X, Image as ImageIcon, FileText } from 'lucide-react';
import { ChatMessage } from '../types';
import { getAvatarForUser } from '../lib/avatars';
import { UserAvatar } from './UserAvatar';

interface SearchMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSelectMessage?: (message: ChatMessage) => void;
  onOpenImage?: (url: string, name: string) => void;
  isDarkMode?: boolean;
}

type FilterType = 'all' | 'images' | 'files';

export const SearchMessagesModal: React.FC<SearchMessagesModalProps> = ({
  isOpen,
  onClose,
  messages = [],
  onSelectMessage,
  onOpenImage,
  isDarkMode = false,
}) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    return messages.filter((msg) => {
      // Filter by type
      if (filter === 'images' && msg.attachment?.type !== 'image') return false;
      if (filter === 'files' && msg.attachment?.type !== 'file') return false;

      // Filter by query
      if (!q) return true;
      const textMatches = msg.message?.toLowerCase().includes(q);
      const nameMatches = msg.userName?.toLowerCase().includes(q);
      const fileNameMatches = msg.attachment?.name?.toLowerCase().includes(q);
      return textMatches || nameMatches || fileNameMatches;
    });
  }, [messages, query, filter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-modal-title"
        className={`relative z-10 w-full max-w-lg h-[80vh] sm:h-[560px] rounded-[32px] border shadow-2xl flex flex-col overflow-hidden transition-all animate-in zoom-in-95 duration-150 ${
          isDarkMode
            ? 'bg-[#16171B]/95 border-neutral-800 text-white'
            : 'bg-white/95 border-neutral-200 text-neutral-900'
        } backdrop-blur-2xl`}
      >
        {/* Header Search Input */}
        <div
          className={`p-4 border-b flex items-center gap-3 shrink-0 ${
            isDarkMode ? 'border-neutral-800/80 bg-neutral-900/50' : 'border-neutral-100 bg-neutral-50/50'
          }`}
        >
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages, participants, or files..."
            autoFocus
            className="flex-1 bg-transparent text-sm font-medium focus:outline-none placeholder-neutral-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isDarkMode ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-500 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div
          className={`px-4 py-2 border-b flex items-center gap-2 shrink-0 ${
            isDarkMode ? 'border-neutral-800/80 bg-neutral-900/30' : 'border-neutral-100 bg-neutral-50/30'
          }`}
        >
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              filter === 'all'
                ? 'bg-[#007AFF] text-white shadow-2xs'
                : isDarkMode
                ? 'bg-neutral-800 text-neutral-400 hover:text-white'
                : 'bg-neutral-200/70 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            All Messages
          </button>

          <button
            type="button"
            onClick={() => setFilter('images')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
              filter === 'images'
                ? 'bg-[#007AFF] text-white shadow-2xs'
                : isDarkMode
                ? 'bg-neutral-800 text-neutral-400 hover:text-white'
                : 'bg-neutral-200/70 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photos</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('files')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
              filter === 'files'
                ? 'bg-[#007AFF] text-white shadow-2xs'
                : isDarkMode
                ? 'bg-neutral-800 text-neutral-400 hover:text-white'
                : 'bg-neutral-200/70 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Files</span>
          </button>

          <span className="text-[11px] text-neutral-400 ml-auto font-medium">
            {results.length} found
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {results.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
              <Search className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm font-semibold mb-1">No matching messages</p>
              <p className="text-xs max-w-xs">Try different keywords or switch between Photos and Files.</p>
            </div>
          ) : (
            results.map((msg) => {
              const avatar = getAvatarForUser(msg.userId, msg.userName, msg.avatarId);
              const dateStr = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';

              return (
                <div
                  key={msg.id}
                  onClick={() => {
                    if (msg.attachment?.type === 'image' && onOpenImage) {
                      onOpenImage(msg.attachment.url, msg.attachment.name);
                    } else if (onSelectMessage) {
                      onSelectMessage(msg);
                    }
                    onClose();
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isDarkMode
                      ? 'bg-neutral-900/60 border-neutral-800 hover:bg-neutral-800/60'
                      : 'bg-neutral-50/80 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  <UserAvatar avatar={avatar} size="sm" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                        {msg.userName}
                      </span>
                      {dateStr && (
                        <span className="text-[10px] text-neutral-400 shrink-0">{dateStr}</span>
                      )}
                    </div>

                    {msg.message && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 break-words">
                        {msg.message}
                      </p>
                    )}

                    {msg.attachment && (
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-blue-500 font-medium">
                        {msg.attachment.type === 'image' ? (
                          <>
                            <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Photo: {msg.attachment.name}</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">File: {msg.attachment.name}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
