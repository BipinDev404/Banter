import React, { useState } from 'react';
import { Folder, FolderOpen, Music, ChevronRight, Play } from 'lucide-react';
import { Song, Playlist } from '../types';
import { useAudio } from '../context/AudioContext';
import { SongListTable } from './SongListTable';

interface FolderBrowserProps {
  songs: Song[];
  playlists: Playlist[];
  onOpenTagEditor: (song: Song) => void;
  onOpenAddToPlaylist: (song: Song) => void;
}

export const FolderBrowser: React.FC<FolderBrowserProps> = ({
  songs,
  playlists,
  onOpenTagEditor,
  onOpenAddToPlaylist,
}) => {
  const { playSong } = useAudio();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Group songs by folder path
  const folderMap: Record<string, Song[]> = {};
  songs.forEach((song) => {
    const folder = song.folderPath || 'Uncategorized';
    if (!folderMap[folder]) folderMap[folder] = [];
    folderMap[folder].push(song);
  });

  const folderEntries = Object.entries(folderMap);

  if (selectedFolder) {
    const folderSongs = folderMap[selectedFolder] || [];

    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedFolder(null)}
          className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full w-fit"
        >
          ← Back to Folders
        </button>

        <div className="flex items-center justify-between bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <FolderOpen className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-display">{selectedFolder}</h1>
              <p className="text-xs text-zinc-400">{folderSongs.length} audio tracks in this folder</p>
            </div>
          </div>

          {folderSongs.length > 0 && (
            <button
              onClick={() => playSong(folderSongs[0], folderSongs, 0)}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2 rounded-full font-bold text-xs shadow-lg shadow-amber-500/20"
            >
              <Play className="w-4 h-4 fill-zinc-950" />
              <span>Play Folder</span>
            </button>
          )}
        </div>

        <SongListTable
          songs={folderSongs}
          playlists={playlists}
          onOpenTagEditor={onOpenTagEditor}
          onOpenAddToPlaylist={onOpenAddToPlaylist}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight font-display">Folders</h2>
        <p className="text-xs text-zinc-400 mt-1">Browse your local music library structure</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {folderEntries.map(([folderPath, folderSongs]) => (
          <div
            key={folderPath}
            onClick={() => setSelectedFolder(folderPath)}
            className="group cursor-pointer bg-zinc-900/50 hover:bg-zinc-900 p-4 rounded-xl border border-zinc-800/60 hover:border-amber-500/40 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-2.5 bg-zinc-800 rounded-lg text-amber-400 group-hover:scale-110 transition-transform">
                <Folder className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-zinc-100 truncate group-hover:text-amber-300">
                  {folderPath}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">{folderSongs.length} songs</div>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};
