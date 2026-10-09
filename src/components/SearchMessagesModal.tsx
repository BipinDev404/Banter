import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { ChatMessage } from '../types';

interface SearchMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSelectMessage?: (messageId: string) => void;
}

export const SearchMessagesModal: React.FC<SearchMessagesModalProps> = ({
  isOpen,
  onClose,
  messages,
  onSelectMessage,
}) => {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? messages.filter((m) => m.message.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        >
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-messages-title"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="relative z-10 w-full max-w-md bg-[#1c1c1e] text-white border border-white/10 rounded-[28px] p-5 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Search className="w-4 h-4 text-blue-400" />
                <span id="search-messages-title">Search Messages</span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search..."
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1">
              {query.trim() && filtered.length === 0 && (
                <p className="text-xs text-neutral-400 text-center py-6">No matching messages found.</p>
              )}

              {filtered.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => {
                    onSelectMessage?.(msg.id);
                    onClose();
                  }}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                    <span className="font-semibold text-neutral-300">{msg.userName}</span>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-neutral-200 line-clamp-2">{msg.message}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
