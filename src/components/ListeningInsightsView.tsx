import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Flame,
  Clock,
  Disc,
  Mic2,
  Music,
  Share2,
  Sparkles,
  Trophy,
  Calendar,
  Headphones,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Song, HistoryLog } from '../types';
import { getHistoryLogs } from '../db/bongsDb';
import { useAudio } from '../context/AudioContext';

interface ListeningInsightsViewProps {
  songs: Song[];
}

export const ListeningInsightsView: React.FC<ListeningInsightsViewProps> = ({ songs }) => {
  const { showToast } = useAudio();
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [showRecapModal, setShowRecapModal] = useState(false);

  useEffect(() => {
    getHistoryLogs().then(setLogs).catch(console.error);
  }, [songs]);

  // Compute Metrics
  const totalSec = logs.reduce((acc, log) => acc + (log.durationPlayedSec || 0), 0);
  const totalHours = (totalSec / 3600).toFixed(1);
  const totalPlays = logs.length;
  const completedPlays = logs.filter((l) => l.completed).length;

  // Hourly Distribution (0 to 23 hours)
  const hourlyCount = new Array(24).fill(0);
  logs.forEach((log) => {
    const hour = new Date(log.playedAt).getHours();
    hourlyCount[hour]++;
  });

  const peakHour = hourlyCount.indexOf(Math.max(...hourlyCount, 0));
  const formatPeakHour = (h: number) => {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h > 12 ? `${h - 12} PM` : `${h} AM`;
  };

  // Top Artist
  const artistCounts: Record<string, number> = {};
  logs.forEach((l) => {
    if (l.artist && l.artist !== 'Unknown Artist') {
      artistCounts[l.artist] = (artistCounts[l.artist] || 0) + 1;
    }
  });
  const topArtistName = Object.entries(artistCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Top Album
  const albumCounts: Record<string, number> = {};
  logs.forEach((l) => {
    if (l.album && l.album !== 'Unknown Album') {
      albumCounts[l.album] = (albumCounts[l.album] || 0) + 1;
    }
  });
  const topAlbumName = Object.entries(albumCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Top Track
  const songCounts: Record<string, { title: string; artist: string; count: number }> = {};
  logs.forEach((l) => {
    if (l.songTitle) {
      if (!songCounts[l.songTitle]) {
        songCounts[l.songTitle] = { title: l.songTitle, artist: l.artist, count: 0 };
      }
      songCounts[l.songTitle].count++;
    }
  });
  const topSongData = Object.values(songCounts).sort((a, b) => b.count - a.count)[0];

  // Top Genre
  const genreCounts: Record<string, number> = {};
  logs.forEach((l) => {
    if (l.genre) genreCounts[l.genre] = (genreCounts[l.genre] || 0) + 1;
  });
  const topGenreName = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Calculate Listening Streak
  const uniqueDates = Array.from(
    new Set(logs.map((l) => new Date(l.playedAt).toISOString().split('T')[0]))
  ).sort().reverse();

  let streak = 0;
  if (uniqueDates.length > 0) {
    let checkDate = new Date();
    for (let i = 0; i < uniqueDates.length; i++) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (uniqueDates.includes(dStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  const handleLaunchRecap = () => {
    setShowRecapModal(true);
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-zinc-950 p-6 rounded-2xl border border-amber-500/30">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">Your Listening</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Your personal, 100% private offline music journal & statistics
          </p>
        </div>

        <button
          onClick={handleLaunchRecap}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 px-5 py-2.5 rounded-full font-bold text-xs shadow-lg shadow-amber-500/25 transition-transform active:scale-95"
        >
          <Sparkles className="w-4 h-4 fill-zinc-950" />
          <span>Launch Your Bongs Recap</span>
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase">Listening Time</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{totalHours} hrs</div>
          <p className="text-[11px] text-zinc-500">{totalSec} total seconds played</p>
        </div>

        <div className="bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase">Daily Streak</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{streak} {streak === 1 ? 'day' : 'days'}</div>
          <p className="text-[11px] text-zinc-500">Consecutive listening active</p>
        </div>

        <div className="bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase">Total Plays</span>
            <Headphones className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{totalPlays}</div>
          <p className="text-[11px] text-zinc-500">{completedPlays} tracks played to completion</p>
        </div>

        <div className="bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase">Peak Listening Time</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{formatPeakHour(peakHour)}</div>
          <p className="text-[11px] text-zinc-500">Your most active listening hour</p>
        </div>
      </div>

      {/* Top Favorites Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Top Track */}
        <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-4 h-4" />
            <span>Top Track</span>
          </div>
          {topSongData ? (
            <div>
              <div className="text-lg font-bold text-white truncate font-display">{topSongData.title}</div>
              <div className="text-xs text-zinc-400 truncate mt-0.5">{topSongData.artist}</div>
              <div className="text-[11px] text-amber-400 font-mono mt-2">{topSongData.count} plays</div>
            </div>
          ) : (
            <p className="text-xs text-zinc-600 italic">Play more music to unlock</p>
          )}
        </div>

        {/* Top Artist */}
        <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Mic2 className="w-4 h-4" />
            <span>Top Artist</span>
          </div>
          <div className="text-lg font-bold text-white truncate font-display">{topArtistName}</div>
          <p className="text-xs text-zinc-500">Your most played artist</p>
        </div>

        {/* Top Album */}
        <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Disc className="w-4 h-4" />
            <span>Top Album</span>
          </div>
          <div className="text-lg font-bold text-white truncate font-display">{topAlbumName}</div>
          <p className="text-xs text-zinc-500">Your go-to album</p>
        </div>

        {/* Top Genre */}
        <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Music className="w-4 h-4" />
            <span>Top Genre</span>
          </div>
          <div className="text-lg font-bold text-white truncate font-display">{topGenreName}</div>
          <p className="text-xs text-zinc-500">Your signature genre</p>
        </div>
      </div>

      {/* Hourly Listening Bar Chart */}
      <div className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800 space-y-4">
        <h3 className="font-bold text-white text-base">Listening Activity by Hour</h3>
        <p className="text-xs text-zinc-400">Distribution of tracks played throughout the 24-hour day</p>

        <div className="h-44 flex items-end justify-between gap-1.5 pt-6 border-b border-zinc-800">
          {hourlyCount.map((count, hour) => {
            const max = Math.max(...hourlyCount, 1);
            const heightPct = Math.max(8, (count / max) * 100);
            const isPeak = hour === peakHour && count > 0;

            return (
              <div key={hour} className="flex-1 flex flex-col items-center gap-2 group relative">
                {/* Tooltip */}
                <div className="absolute -top-8 bg-zinc-800 text-zinc-100 text-[10px] font-mono px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                  {formatPeakHour(hour)}: {count} plays
                </div>

                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-t-md transition-all duration-300 ${
                    isPeak
                      ? 'bg-amber-400 shadow-lg shadow-amber-500/40'
                      : count > 0
                      ? 'bg-amber-500/50 group-hover:bg-amber-400'
                      : 'bg-zinc-800/60'
                  }`}
                />
              </div>
            );
          })}
        </div>

        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>11 PM</span>
        </div>
      </div>

      {/* Shareable Recap Modal */}
      {showRecapModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gradient-to-br from-amber-950 via-zinc-900 to-zinc-950 p-8 rounded-3xl border border-amber-500/40 shadow-2xl space-y-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="w-16 h-16 bg-amber-500 text-zinc-950 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Bongs Personal Recap</span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight font-display mt-1">Your Music World</h2>
            </div>

            <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800/80 text-left space-y-3 text-xs">
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Total Hours Listened</span>
                <span className="text-amber-400 font-bold font-mono">{totalHours} hrs</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Listening Streak</span>
                <span className="text-white font-bold">{streak} days</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">#1 Artist</span>
                <span className="text-white font-bold">{topArtistName}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">#1 Track</span>
                <span className="text-white font-bold">{topSongData?.title || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Peak Hour</span>
                <span className="text-white font-bold">{formatPeakHour(peakHour)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `My Bongs Music Recap:\n🎧 ${totalHours} hrs listened\n🔥 ${streak}-day streak\n🎤 Top Artist: ${topArtistName}`
                  );
                  showToast('Recap copied to clipboard!', 'success');
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Summary</span>
              </button>

              <button
                onClick={() => setShowRecapModal(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold px-5 py-3 rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
