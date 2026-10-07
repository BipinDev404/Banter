import React, { useState } from 'react';
import {
  Play,
  Pause,
  Heart,
  MoreVertical,
  Music,
  Plus,
  Clock,
  Edit3,
  Trash2,
  ListPlus,
  ArrowUpDown,
} from 'lucide-react';
import { Song, Playlist } from '../types';
import { useAudio } from '../context/AudioContext';

interface SongListTableProps {
  songs: Song[];
  playlists: Playlist[];
  onOpenTagEditor: (song: Song) => void;
  onOpenAddToPlaylist: (song: Song) => void;
  title?: string;
  subtitle?: string;
}

type SortField = 'title' | 'artist' | 'album' | 'duration' | 'playCount' | 'addedAt';

export const SongListTable: React.FC<SongListTableProps> = ({
  songs,
  playlists,
  onOpenTagEditor,
  onOpenAddToPlaylist,
  title,
  subtitle,
}) => {
  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    toggleFavorite,
    addToQueue,
    playNextInQueue,
    deleteSong,
  } = useAudio();

  const [sortField, setSortField] = useState<SortField>('addedAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedSongs = [...songs].sort((a, b) => {
    let aVal: any = a[sortField] || '';
    let bVal: any = b[sortField] || '';

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  const formatDuration = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-4">
      {/* Table Header Header */}
      {(title || subtitle) && (
        <div className="flex items-end justify-between pb-2 border-b border-zinc-800/80">
          <div>
            {title && <h2 className="text-2xl font-bold text-white tracking-tight font-display">{title}</h2>}
            {subtitle && <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>}
          </div>
          <div className="text-xs text-zinc-500 font-medium">
            {songs.length} {songs.length === 1 ? 'song' : 'songs'}
          </div>
        </div>
      )}

      {/* Songs Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800/60 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 select-none">
              <th className="py-2.5 px-3 w-12 text-center">#</th>
              <th
                onClick={() => handleSort('title')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Title</span>
                  {sortField === 'title' && <ArrowUpDown className="w-3 h-3 text-amber-400" />}
                </div>
              </th>
              <th
                onClick={() => handleSort('album')}
                className="py-2.5 px-3 hidden md:table-cell cursor-pointer hover:text-zinc-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Album</span>
                  {sortField === 'album' && <ArrowUpDown className="w-3 h-3 text-amber-400" />}
                </div>
              </th>
              <th
                onClick={() => handleSort('playCount')}
                className="py-2.5 px-3 hidden lg:table-cell cursor-pointer hover:text-zinc-200 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Plays</span>
                  {sortField === 'playCount' && <ArrowUpDown className="w-3 h-3 text-amber-400" />}
                </div>
              </th>
              <th
                onClick={() => handleSort('duration')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-200 transition-colors text-right w-20"
              >
                <div className="flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3" />
                  {sortField === 'duration' && <ArrowUpDown className="w-3 h-3 text-amber-400" />}
                </div>
              </th>
              <th className="py-2.5 px-3 w-20 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/60 text-sm">
            {sortedSongs.map((song, index) => {
              const isCurrent = currentSong?.id === song.id;
              const isCurrentPlaying = isCurrent && isPlaying;
              const isMenuOpen = activeMenuSongId === song.id;

              return (
                <tr
                  key={song.id}
                  className={`group transition-colors duration-150 rounded-lg hover:bg-zinc-900/70 ${
                    isCurrent ? 'bg-amber-500/10' : ''
                  }`}
                >
                  {/* Track Number / Play Trigger */}
                  <td className="py-3 px-3 text-center text-xs text-zinc-500 relative">
                    <span className="group-hover:hidden">
                      {isCurrentPlaying ? (
                        <span className="flex items-end justify-center gap-0.5 h-3.5 w-4 mx-auto">
                          <span className="w-0.5 bg-amber-400 animate-pulse h-full" />
                          <span className="w-0.5 bg-amber-400 animate-pulse delay-75 h-2/3" />
                          <span className="w-0.5 bg-amber-400 animate-pulse delay-150 h-5/6" />
                        </span>
                      ) : (
                        index + 1
                      )}
                    </span>
                    <button
                      onClick={() => {
                        if (isCurrent) togglePlay();
                        else playSong(song, sortedSongs, index);
                      }}
                      className="hidden group-hover:flex items-center justify-center text-amber-400 hover:scale-110 transition-transform mx-auto"
                    >
                      {isCurrentPlaying ? (
                        <Pause className="w-4 h-4 fill-amber-400" />
                      ) : (
                        <Play className="w-4 h-4 fill-amber-400 ml-0.5" />
                      )}
                    </button>
                  </td>

                  {/* Title & Artist & Artwork */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0 relative border border-zinc-700/40 shadow-sm">
                        {song.coverUrl ? (
                          <img
                            src={song.coverUrl}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
                            <Music className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div
                          onClick={() => {
                            if (isCurrent) togglePlay();
                            else playSong(song, sortedSongs, index);
                          }}
                          className={`font-semibold cursor-pointer truncate hover:underline ${
                            isCurrent ? 'text-amber-400 font-bold' : 'text-zinc-100'
                          }`}
                        >
                          {song.title}
                        </div>
                        <div className="text-xs text-zinc-400 truncate mt-0.5">{song.artist}</div>
                      </div>
                    </div>
                  </td>

                  {/* Album */}
                  <td className="py-3 px-3 hidden md:table-cell text-xs text-zinc-400 truncate max-w-[180px]">
                    {song.album}
                  </td>

                  {/* Plays */}
                  <td className="py-3 px-3 hidden lg:table-cell text-xs text-zinc-500 text-right font-mono">
                    {song.playCount || 0}
                  </td>

                  {/* Duration */}
                  <td className="py-3 px-3 text-xs text-zinc-400 text-right font-mono">
                    {formatDuration(song.duration)}
                  </td>

                  {/* Like & Menu */}
                  <td className="py-3 px-3 text-center relative">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => toggleFavorite(song.id)}
                        className={`p-1.5 rounded-full transition-colors ${
                          song.isFavorite
                            ? 'text-amber-400 hover:text-amber-300'
                            : 'text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100'
                        }`}
                        title={song.isFavorite ? 'Unlike' : 'Like'}
                      >
                        <Heart className={`w-4 h-4 ${song.isFavorite ? 'fill-amber-400' : ''}`} />
                      </button>

                      <div className="relative">
                        <button
                          onClick={() => setActiveMenuSongId(isMenuOpen ? null : song.id)}
                          className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Context Dropdown Menu */}
                        {isMenuOpen && (
                          <div className="absolute right-0 top-8 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1 z-50 text-xs">
                            <button
                              onClick={() => {
                                playNextInQueue(song);
                                setActiveMenuSongId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-200 hover:bg-zinc-800 transition-colors text-left"
                            >
                              <Play className="w-3.5 h-3.5 text-amber-400" />
                              <span>Play Next</span>
                            </button>

                            <button
                              onClick={() => {
                                addToQueue(song);
                                setActiveMenuSongId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-200 hover:bg-zinc-800 transition-colors text-left"
                            >
                              <Plus className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Add to Queue</span>
                            </button>

                            <button
                              onClick={() => {
                                onOpenAddToPlaylist(song);
                                setActiveMenuSongId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-200 hover:bg-zinc-800 transition-colors text-left"
                            >
                              <ListPlus className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Add to Playlist...</span>
                            </button>

                            <button
                              onClick={() => {
                                onOpenTagEditor(song);
                                setActiveMenuSongId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-200 hover:bg-zinc-800 transition-colors text-left"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                              <span>Edit Tags & Info</span>
                            </button>

                            <div className="border-t border-zinc-800 my-1" />

                            <button
                              onClick={() => {
                                deleteSong(song.id);
                                setActiveMenuSongId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span>Delete Song</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
