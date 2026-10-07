import React, { useState } from 'react';
import { Sparkles, Flame, RotateCcw, Moon, Sun, Shuffle, Play, Clock } from 'lucide-react';
import { Song, Playlist, SmartCollectionType } from '../types';
import { useAudio } from '../context/AudioContext';
import { SongListTable } from './SongListTable';

interface SmartCollectionsViewProps {
  songs: Song[];
  playlists: Playlist[];
  onOpenTagEditor: (song: Song) => void;
  onOpenAddToPlaylist: (song: Song) => void;
}

export const SmartCollectionsView: React.FC<SmartCollectionsViewProps> = ({
  songs,
  playlists,
  onOpenTagEditor,
  onOpenAddToPlaylist,
}) => {
  const { playSong } = useAudio();
  const [selectedCollection, setSelectedCollection] = useState<SmartCollectionType | null>(null);

  // Compute Collections dynamically
  const getCollectionSongs = (type: SmartCollectionType): Song[] => {
    const now = Date.now();

    switch (type) {
      case 'heavy_rotation':
        return [...songs].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 25);

      case 'on_repeat':
        return [...songs]
          .filter((s) => (s.playCount || 0) >= 3)
          .sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0))
          .slice(0, 20);

      case 'forgotten_favorites':
        // Liked songs or played > 2 times, but last played > 3 days ago or never
        return [...songs]
          .filter((s) => s.isFavorite || (s.playCount || 0) >= 2)
          .filter((s) => !s.lastPlayedAt || now - s.lastPlayedAt > 3 * 24 * 3600 * 1000)
          .slice(0, 20);

      case 'morning_vibes':
        return [...songs].filter((s) => {
          const g = (s.genre || '').toLowerCase();
          return g.includes('acoustic') || g.includes('chill') || g.includes('ambient') || g.includes('pop');
        });

      case 'night_vibes':
        return [...songs].filter((s) => {
          const g = (s.genre || '').toLowerCase();
          return g.includes('lo-fi') || g.includes('lofi') || g.includes('synth') || g.includes('jazz') || g.includes('ambient');
        });

      case 'recently_added':
        return [...songs].sort((a, b) => b.addedAt - a.addedAt).slice(0, 30);

      case 'bongs_daily_mix':
      default: {
        // Smart mixture of favorites, high play counts, and random discovery
        const favs = songs.filter((s) => s.isFavorite);
        const popular = [...songs].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 10);
        const pool = Array.from(new Set([...favs, ...popular, ...songs]));
        return pool.sort(() => Math.random() - 0.5).slice(0, 25);
      }
    }
  };

  const collectionMeta: Record<
    SmartCollectionType,
    { title: string; desc: string; icon: any; color: string }
  > = {
    heavy_rotation: {
      title: 'Heavy Rotation',
      desc: 'Your most played tracks of all time',
      icon: Flame,
      color: 'from-amber-500/20 via-orange-500/10 to-zinc-950 border-amber-500/30',
    },
    on_repeat: {
      title: 'On Repeat',
      desc: 'Tracks you keep playing recently',
      icon: RotateCcw,
      color: 'from-purple-500/20 via-pink-500/10 to-zinc-950 border-purple-500/30',
    },
    forgotten_favorites: {
      title: 'Forgotten Favorites',
      desc: 'Loved tracks you haven’t listened to in a while',
      icon: Clock,
      color: 'from-emerald-500/20 via-teal-500/10 to-zinc-950 border-emerald-500/30',
    },
    morning_vibes: {
      title: 'Morning Vibe',
      desc: 'Gentle acoustic & chill tracks to start your day',
      icon: Sun,
      color: 'from-yellow-500/20 via-amber-500/10 to-zinc-950 border-yellow-500/30',
    },
    night_vibes: {
      title: 'Night Vibe',
      desc: 'Deep lo-fi, synthwave & ambient soundscapes',
      icon: Moon,
      color: 'from-indigo-500/20 via-blue-500/10 to-zinc-950 border-indigo-500/30',
    },
    recently_added: {
      title: 'Recently Added',
      desc: 'Your latest library imports',
      icon: Sparkles,
      color: 'from-sky-500/20 via-cyan-500/10 to-zinc-950 border-sky-500/30',
    },
    bongs_daily_mix: {
      title: 'Bongs Daily Mix',
      desc: 'Smart local offline shuffle curated for your taste',
      icon: Shuffle,
      color: 'from-amber-500/30 via-rose-500/10 to-zinc-950 border-amber-400/40',
    },
  };

  if (selectedCollection) {
    const meta = collectionMeta[selectedCollection];
    const collectionSongs = getCollectionSongs(selectedCollection);

    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedCollection(null)}
          className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full w-fit"
        >
          ← Back to Collections
        </button>

        <div className={`p-6 rounded-2xl bg-gradient-to-br ${meta.color} border space-y-3`}>
          <div className="flex items-center gap-3">
            <meta.icon className="w-8 h-8 text-amber-400" />
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">{meta.title}</h1>
          </div>
          <p className="text-sm text-zinc-300">{meta.desc}</p>
          <p className="text-xs text-zinc-500 font-mono">{collectionSongs.length} tracks</p>

          {collectionSongs.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => playSong(collectionSongs[0], collectionSongs, 0)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-5 py-2.5 rounded-full font-bold text-xs shadow-lg shadow-amber-500/20"
              >
                <Play className="w-4 h-4 fill-zinc-950" />
                <span>Play Collection</span>
              </button>
            </div>
          )}
        </div>

        <SongListTable
          songs={collectionSongs}
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
        <h2 className="text-2xl font-bold text-white tracking-tight font-display">Smart Collections</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Dynamically generated music collections based on your local offline listening habits
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {(Object.keys(collectionMeta) as SmartCollectionType[]).map((type) => {
          const meta = collectionMeta[type];
          const collectionSongs = getCollectionSongs(type);
          const Icon = meta.icon;

          return (
            <div
              key={type}
              onClick={() => setSelectedCollection(type)}
              className={`group cursor-pointer bg-gradient-to-br ${meta.color} p-5 rounded-2xl border transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between min-h-[160px]`}
            >
              <div className="flex items-start justify-between">
                <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-amber-400">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono font-semibold text-zinc-500 bg-zinc-900/60 px-2.5 py-1 rounded-full">
                  {collectionSongs.length} tracks
                </span>
              </div>

              <div>
                <h3 className="font-bold text-lg text-white group-hover:text-amber-300 transition-colors font-display">
                  {meta.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{meta.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
