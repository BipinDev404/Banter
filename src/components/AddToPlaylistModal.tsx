import React from 'react';
import { X, ListPlus, Plus, Check } from 'lucide-react';
import { Song } from '../types';
import { useAudio } from '../context/AudioContext';

interface AddToPlaylistModalProps {
  song: Song | null;
  onClose: () => void;
  onOpenCreatePlaylist: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  song,
  onClose,
  onOpenCreatePlaylist,
}) => {
  const { playlists, updatePlaylist, showToast } = useAudio();

  if (!song) return null;

  const handleToggleSongInPlaylist = async (playlist: any) => {
    const exists = playlist.songIds.includes(song.id);
    let updatedSongIds = [...playlist.songIds];

    if (exists) {
      updatedSongIds = updatedSongIds.filter((id: string) => id !== song.id);
      showToast(`Removed from "${playlist.name}"`);
    } else {
      updatedSongIds.push(song.id);
      showToast(`Added to "${playlist.name}"`, 'success');
    }

    await updatePlaylist({ ...playlist, songIds: updatedSongIds });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 space-y-5 text-zinc-100 relative">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <ListPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display">Add to Playlist</h2>
              <p className="text-xs text-zinc-400 truncate max-w-[180px]">{song.title}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
          {playlists.length === 0 ? (
            <p className="text-xs text-zinc-500 italic p-3 text-center">No playlists created yet.</p>
          ) : (
            playlists.map((playlist) => {
              const inPlaylist = playlist.songIds.includes(song.id);

              return (
                <button
                  key={playlist.id}
                  onClick={() => handleToggleSongInPlaylist(playlist)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-colors ${
                    inPlaylist
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <span className="truncate">{playlist.name}</span>
                  {inPlaylist ? (
                    <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />
                  ) : (
                    <Plus className="w-4 h-4 text-zinc-500 shrink-0 ml-2" />
                  )}
                </button>
              );
            })
          )}
        </div>

        <button
          onClick={() => {
            onClose();
            onOpenCreatePlaylist();
          }}
          className="w-full py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-amber-400 flex items-center justify-center gap-2 border border-zinc-700/50"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Playlist</span>
        </button>
      </div>
    </div>
  );
};
