import React, { useState } from 'react';
import { Mic2, Play, Music } from 'lucide-react';
import { Song, Playlist } from '../types';
import { useAudio } from '../context/AudioContext';
import { SongListTable } from './SongListTable';

interface ArtistCardGridProps {
  songs: Song[];
  playlists: Playlist[];
  onOpenTagEditor: (song: Song) => void;
  onOpenAddToPlaylist: (song: Song) => void;
}

export const ArtistCardGrid: React.FC<ArtistCardGridProps> = ({
  songs,
  playlists,
  onOpenTagEditor,
  onOpenAddToPlaylist,
}) => {
  const { playSong } = useAudio();
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);

  // Group songs by artist name
  const artistMap: Record<string, Song[]> = {};
  songs.forEach((song) => {
    const artistName = song.artist || 'Unknown Artist';
    if (!artistMap[artistName]) artistMap[artistName] = [];
    artistMap[artistName].push(song);
  });

  const artists = Object.entries(artistMap).map(([artistName, artistSongs]) => {
    const coverUrl = artistSongs.find((s) => s.coverUrl)?.coverUrl;
    const totalPlays = artistSongs.reduce((acc, s) => acc + (s.playCount || 0), 0);
    const albumsCount = new Set(artistSongs.map((s) => s.album)).size;

    return {
      name: artistName,
      songs: artistSongs,
      coverUrl,
      totalPlays,
      albumsCount,
    };
  });

  if (selectedArtist) {
    const artistData = artists.find((a) => a.name === selectedArtist);
    if (!artistData) return null;

    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedArtist(null)}
          className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full w-fit"
        >
          ← Back to Artists
        </button>

        {/* Artist Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-6 rounded-2xl border border-zinc-800/80">
          <div className="w-44 h-44 rounded-full overflow-hidden bg-zinc-800 shrink-0 shadow-2xl border-2 border-amber-500/30">
            {artistData.coverUrl ? (
              <img src={artistData.coverUrl} alt={artistData.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
                <Mic2 className="w-16 h-16" />
              </div>
            )}
          </div>

          <div className="space-y-2 flex-1">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Artist</span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">{artistData.name}</h1>
            <p className="text-xs text-zinc-400 font-medium">
              {artistData.songs.length} tracks • {artistData.albumsCount} albums • {artistData.totalPlays} total plays
            </p>

            <div className="pt-2">
              <button
                onClick={() => playSong(artistData.songs[0], artistData.songs, 0)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-5 py-2.5 rounded-full font-bold text-xs transition-colors shadow-lg shadow-amber-500/20"
              >
                <Play className="w-4 h-4 fill-zinc-950" />
                <span>Play Artist Radio</span>
              </button>
            </div>
          </div>
        </div>

        {/* Artist Songs */}
        <SongListTable
          songs={artistData.songs}
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
          <h2 className="text-2xl font-bold text-white tracking-tight font-display">Artists</h2>
          <p className="text-xs text-zinc-400 mt-1">{artists.length} artists in your library</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {artists.map((artist) => (
          <div
            key={artist.name}
            onClick={() => setSelectedArtist(artist.name)}
            className="group cursor-pointer bg-zinc-900/40 hover:bg-zinc-900 p-4 rounded-2xl border border-zinc-800/40 hover:border-zinc-700/60 transition-all duration-200 text-center"
          >
            <div className="w-28 h-28 mx-auto rounded-full overflow-hidden bg-zinc-800 relative shadow-md mb-3 border border-zinc-800">
              {artist.coverUrl ? (
                <img
                  src={artist.coverUrl}
                  alt={artist.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                  <Mic2 className="w-10 h-10" />
                </div>
              )}
            </div>

            <div className="font-semibold text-sm text-zinc-100 truncate group-hover:text-amber-300 transition-colors">
              {artist.name}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {artist.songs.length} {artist.songs.length === 1 ? 'song' : 'songs'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
