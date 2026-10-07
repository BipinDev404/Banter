import React, { useState } from 'react';
import { ListMusic, Play, Shuffle, Plus, Trash2, Music, Edit } from 'lucide-react';
import { Song, Playlist } from '../types';
import { useAudio } from '../context/AudioContext';
import { SongListTable } from './SongListTable';

interface PlaylistViewProps {
  songs: Song[];
  playlists: Playlist[];
  activePlaylistId: string | null;
  onOpenCreatePlaylist: () => void;
  onOpenTagEditor: (song: Song) => void;
  onOpenAddToPlaylist: (song: Song) => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  songs,
  playlists,
  activePlaylistId,
  onOpenCreatePlaylist,
  onOpenTagEditor,
  onOpenAddToPlaylist,
}) => {
  const { playSong, deletePlaylist, toggleShuffle, updatePlaylist } = useAudio();
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const activePlaylist = playlists.find((p) => p.id === activePlaylistId);

  if (activePlaylist) {
    const playlistSongs = activePlaylist.songIds
      .map((id) => songs.find((s) => s.id === id))
      .filter((s): s is Song => Boolean(s));

    const coverUrl = playlistSongs.find((s) => s.coverUrl)?.coverUrl;
    const totalDuration = playlistSongs.reduce((acc, s) => acc + (s.duration || 0), 0);

    const handleSaveTitle = () => {
      if (newTitle.trim()) {
        updatePlaylist({ ...activePlaylist, name: newTitle.trim() });
      }
      setEditingTitle(false);
    };

    return (
      <div className="space-y-6">
        {/* Playlist Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end bg-gradient-to-b from-amber-950/20 via-zinc-900 to-zinc-950 p-6 rounded-2xl border border-amber-500/20">
          <div className="w-44 h-44 rounded-2xl overflow-hidden bg-zinc-800 shrink-0 shadow-2xl border border-zinc-700/50 flex items-center justify-center">
            {coverUrl ? (
              <img src={coverUrl} alt={activePlaylist.name} className="w-full h-full object-cover" />
            ) : (
              <ListMusic className="w-16 h-16 text-amber-400" />
            )}
          </div>

          <div className="space-y-2 flex-1 min-w-0">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Playlist</span>
            
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="bg-zinc-800 text-white text-2xl font-bold px-3 py-1 rounded-lg border border-amber-500/50"
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  className="bg-amber-500 text-zinc-950 text-xs font-bold px-3 py-1.5 rounded-lg"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold text-white tracking-tight font-display truncate">
                  {activePlaylist.name}
                </h1>
                <button
                  onClick={() => {
                    setNewTitle(activePlaylist.name);
                    setEditingTitle(true);
                  }}
                  className="text-zinc-500 hover:text-amber-400 p-1"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            )}

            <p className="text-xs text-zinc-400 font-medium">
              {activePlaylist.description || 'Custom music collection'}
            </p>
            <p className="text-xs text-zinc-500">
              {playlistSongs.length} tracks • {Math.round(totalDuration / 60)} min
            </p>

            <div className="pt-3 flex items-center gap-3">
              {playlistSongs.length > 0 && (
                <>
                  <button
                    onClick={() => playSong(playlistSongs[0], playlistSongs, 0)}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-5 py-2.5 rounded-full font-bold text-xs shadow-lg shadow-amber-500/20 transition-transform active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-zinc-950" />
                    <span>Play Playlist</span>
                  </button>

                  <button
                    onClick={() => {
                      toggleShuffle();
                      playSong(playlistSongs[Math.floor(Math.random() * playlistSongs.length)], playlistSongs);
                    }}
                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2.5 rounded-full font-bold text-xs transition-colors"
                  >
                    <Shuffle className="w-4 h-4 text-amber-400" />
                    <span>Shuffle</span>
                  </button>
                </>
              )}

              <button
                onClick={() => deletePlaylist(activePlaylist.id)}
                className="p-2.5 rounded-full bg-zinc-900 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-zinc-800 transition-colors ml-auto"
                title="Delete Playlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Playlist Songs Table */}
        {playlistSongs.length === 0 ? (
          <div className="p-12 text-center bg-zinc-900/30 rounded-2xl border border-zinc-800/40 space-y-3">
            <ListMusic className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-lg font-bold text-zinc-200">This playlist is empty</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Add songs from your library by clicking the context menu (...) on any song row.
            </p>
          </div>
        ) : (
          <SongListTable
            songs={playlistSongs}
            playlists={playlists}
            onOpenTagEditor={onOpenTagEditor}
            onOpenAddToPlaylist={onOpenAddToPlaylist}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-display">Playlists</h2>
          <p className="text-xs text-zinc-400 mt-1">Create playlists for every mood</p>
        </div>

        <button
          onClick={onOpenCreatePlaylist}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2 rounded-full font-bold text-xs shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Playlist</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {playlists.map((playlist) => {
          const playlistSongs = playlist.songIds
            .map((id) => songs.find((s) => s.id === id))
            .filter((s): s is Song => Boolean(s));
          const coverUrl = playlistSongs.find((s) => s.coverUrl)?.coverUrl;

          return (
            <div
              key={playlist.id}
              onClick={() => {}}
              className="group cursor-pointer bg-zinc-900/40 hover:bg-zinc-900 p-3.5 rounded-2xl border border-zinc-800/40 hover:border-amber-500/30 transition-all duration-200"
            >
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-zinc-800 relative shadow-md mb-3 border border-zinc-800 flex items-center justify-center">
                {coverUrl ? (
                  <img src={coverUrl} alt={playlist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <ListMusic className="w-12 h-12 text-amber-400/80" />
                )}
                {playlistSongs.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playSong(playlistSongs[0], playlistSongs, 0);
                    }}
                    className="absolute right-2 bottom-2 w-10 h-10 bg-amber-500 text-zinc-950 rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-200"
                  >
                    <Play className="w-5 h-5 fill-zinc-950 ml-0.5" />
                  </button>
                )}
              </div>

              <div className="font-semibold text-sm text-zinc-100 truncate group-hover:text-amber-300">
                {playlist.name}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">{playlist.songIds.length} tracks</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
