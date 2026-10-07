import React, { useState } from 'react';
import { X, Plus, ListMusic } from 'lucide-react';
import { useAudio } from '../context/AudioContext';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({ isOpen, onClose }) => {
  const { createPlaylist } = useAudio();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      await createPlaylist(name.trim(), description.trim());
      setName('');
      setDescription('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 space-y-6 text-zinc-100 relative">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <ListMusic className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold font-display">New Playlist</h2>
          </div>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-400 font-semibold mb-1">Playlist Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Midnight Vibes, Workout Hits"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:border-amber-500/50 focus:outline-none"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-semibold mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add an optional description..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:border-amber-500/50 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Playlist</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
