import React, { useState } from 'react';
import { Disc, Play, Music } from 'lucide-react';
import { Song, Playlist } from '../types';
import { useAudio } from '../context/AudioContext';
import { SongListTable } from './SongListTable';

interface AlbumCardGridProps {
  songs: Song[];
  playlists: Playlist[];
  onOpenTagEditor: (song: Song) => void;
  onOpenAddToPlaylist: (song: Song) => void;
}

export const AlbumCardGrid: React.FC<AlbumCardGridProps> = ({
  songs,
  playlists,
  onOpenTagEditor,
  onOpenAddToPlaylist,
}) => {
  const { playSong } = useAudio();
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

  // Group songs by album name
  const albumMap: Record<string, Song[]> = {};
  songs.forEach((song) => {
    const albumName = song.album || 'Unknown Album';
    if (!albumMap[albumName]) albumMap[albumName] = [];
    albumMap[albumName].push(song);
  });

  const albums = Object.entries(albumMap).map(([albumName, albumSongs]) => {
    const artist = albumSongs[0]?.artist || 'Unknown Artist';
    const coverUrl = albumSongs.find((s) => s.coverUrl)?.coverUrl;
    const year = albumSongs.find((s) => s.year)?.year;
    const totalDuration = albumSongs.reduce((acc, s) => acc + (s.duration || 0), 0);

    return {
      name: albumName,
      artist,
      songs: albumSongs,
      coverUrl,
      year,
      totalDuration,
    };
  });

  if (selectedAlbum) {
    const albumData = albums.find((a) => a.name === selectedAlbum);
    if (!albumData) return null;

    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedAlbum(null)}
          className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full w-fit"
        >
          ← Back to Albums
        </button>

        {/* Album Cover Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-6 rounded-2xl border border-zinc-800/80">
          <div className="w-44 h-44 rounded-xl overflow-hidden bg-zinc-800 shrink-0 shadow-2xl border border-zinc-700/50">
            {albumData.coverUrl ? (
              <img src={albumData.coverUrl} alt={albumData.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                <Disc className="w-16 h-16" />
              </div>
            )}
          </div>

          <div className="space-y-2 flex-1">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Album</span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">{albumData.name}</h1>
            <p className="text-sm text-zinc-400 font-medium">By {albumData.artist} {albumData.year ? `• ${albumData.year}` : ''}</p>
            <p className="text-xs text-zinc-500">
              {albumData.songs.length} tracks • Math.round({albumData.totalDuration / 60}) min
            </p>

            <div className="pt-2">
              <button
                onClick={() => playSong(albumData.songs[0], albumData.songs, 0)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-5 py-2.5 rounded-full font-bold text-xs transition-colors shadow-lg shadow-amber-500/20"
              >
                <Play className="w-4 h-4 fill-zinc-950" />
                <span>Play Album</span>
              </button>
            </div>
          </div>
        </div>

        {/* Album Tracks Table */}
        <SongListTable
          songs={albumData.songs}
          playlists={playlists}
          onOpenTagEditor={onOpenTagEditor}
          onOpenAddToPlaylist={onOpenAddToPlaylist}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-display">Albums</h2>
          <p className="text-xs text-zinc-400 mt-1">{albums.length} albums in your library</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
        {albums.map((album) => (
          <div
            key={album.name}
            onClick={() => setSelectedAlbum(album.name)}
            className="group cursor-pointer bg-zinc-900/40 hover:bg-zinc-900 p-3 rounded-xl border border-zinc-800/40 hover:border-zinc-700/60 transition-all duration-200"
          >
            <div className="w-full aspect-square rounded-lg overflow-hidden bg-zinc-800 relative shadow-md mb-3 border border-zinc-800">
              {album.coverUrl ? (
                <img
                  src={album.coverUrl}
                  alt={album.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                  <Disc className="w-10 h-10" />
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playSong(album.songs[0], album.songs, 0);
                }}
                className="absolute right-2 bottom-2 w-10 h-10 bg-amber-500 text-zinc-950 rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-200"
              >
                <Play className="w-5 h-5 fill-zinc-950 ml-0.5" />
              </button>
            </div>

            <div className="font-semibold text-sm text-zinc-100 truncate group-hover:text-amber-300 transition-colors">
              {album.name}
            </div>
            <div className="text-xs text-zinc-400 truncate mt-0.5">{album.artist}</div>
            <div className="text-[11px] text-zinc-500 mt-1">{album.songs.length} tracks</div>
          </div>
        ))}
      </div>
    </div>
  );
};
