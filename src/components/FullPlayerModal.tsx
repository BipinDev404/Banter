import React, { useState } from 'react';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  List,
  FileText,
  Sliders,
  Music,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { VisualizerCanvas } from './VisualizerCanvas';

export const FullPlayerModal: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    playbackRate,
    queue,
    queueIndex,
    isFullPlayerOpen,
    setIsFullPlayerOpen,
    setIsEqualizerOpen,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleMute,
    setPlaybackRate,
    toggleShuffle,
    toggleRepeat,
    toggleFavorite,
    removeFromQueue,
    clearQueue,
    saveQueueAsPlaylist,
    analyserNode,
    settings,
  } = useAudio();

  const [activeTab, setActiveTab] = useState<'player' | 'lyrics' | 'queue'>('player');
  const [savePlaylistName, setSavePlaylistName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  if (!isFullPlayerOpen || !currentSong) return null;

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Parse lyrics line by line
  const lyricsLines = currentSong.lyrics
    ? currentSong.lyrics.split('\n').map((line) => {
        const timeMatch = line.match(/\[(\d+):(\d+\.\d+)\]/);
        if (timeMatch) {
          const m = parseInt(timeMatch[1], 10);
          const s = parseFloat(timeMatch[2]);
          const timestampSec = m * 60 + s;
          const text = line.replace(/\[.*?\]/, '').trim();
          return { timestampSec, text };
        }
        return { timestampSec: 0, text: line };
      })
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-3xl flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden text-zinc-100">
      {/* Blurred Album Artwork Background */}
      {currentSong.coverUrl && (
        <div className="absolute inset-0 -z-10 opacity-25 filter blur-3xl scale-125 overflow-hidden pointer-events-none">
          <img src={currentSong.coverUrl} alt="Backdrop" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Top Bar: Navigation & Tabs */}
      <div className="flex items-center justify-between z-10">
        <button
          onClick={() => setIsFullPlayerOpen(false)}
          className="p-2.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-1 rounded-full shadow-lg">
          <button
            onClick={() => setActiveTab('player')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === 'player'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Player
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'lyrics'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Lyrics</span>
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'queue'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Queue ({queue.length})</span>
          </button>
        </div>

        <button
          onClick={() => setIsEqualizerOpen(true)}
          className="p-2.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-amber-400 border border-zinc-800 transition-colors"
          title="Equalizer"
        >
          <Sliders className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 my-6 flex items-center justify-center overflow-y-auto custom-scrollbar z-10">
        {activeTab === 'player' && (
          <div className="flex flex-col items-center justify-center text-center space-y-8 max-w-md w-full">
            {/* Large Artwork with Glow */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl border border-zinc-700/50 group">
              {currentSong.coverUrl ? (
                <img
                  src={currentSong.coverUrl}
                  alt={currentSong.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-700">
                  <Music className="w-24 h-24" />
                </div>
              )}
            </div>

            {/* Song Meta */}
            <div className="space-y-1.5 w-full">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display truncate">
                {currentSong.title}
              </h1>
              <p className="text-base text-zinc-400 font-medium truncate">{currentSong.artist}</p>
              <p className="text-xs text-zinc-500 font-medium truncate">{currentSong.album}</p>
            </div>

            {/* Visualizer Canvas in Full Player */}
            <div className="w-full h-16">
              <VisualizerCanvas
                analyserNode={analyserNode}
                mode={settings.visualizerMode === 'off' ? 'bars' : settings.visualizerMode}
                isPlaying={isPlaying}
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        {/* Lyrics Tab */}
        {activeTab === 'lyrics' && (
          <div className="w-full max-w-lg h-full flex flex-col justify-center space-y-4 text-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">Synced Lyrics</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto px-4 custom-scrollbar">
              {lyricsLines.length === 0 ? (
                <p className="text-zinc-500 italic text-sm">No lyrics found for this track. You can add lyrics in Tag Editor.</p>
              ) : (
                lyricsLines.map((line, idx) => {
                  const isCurrentLine =
                    currentTime >= line.timestampSec &&
                    (!lyricsLines[idx + 1] || currentTime < lyricsLines[idx + 1].timestampSec);

                  return (
                    <p
                      key={idx}
                      onClick={() => seek(line.timestampSec)}
                      className={`cursor-pointer transition-all duration-300 font-display ${
                        isCurrentLine
                          ? 'text-2xl font-extrabold text-amber-300 scale-105'
                          : 'text-base font-semibold text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {line.text}
                    </p>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Queue Tab */}
        {activeTab === 'queue' && (
          <div className="w-full max-w-xl h-full flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-bold text-lg text-white font-display">Play Queue</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20"
                >
                  Save Queue as Playlist
                </button>
                <button
                  onClick={clearQueue}
                  className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-1 overflow-y-auto max-h-96 custom-scrollbar">
              {queue.map((song, idx) => {
                const isPlayingRow = idx === queueIndex;
                return (
                  <div
                    key={`${song.id}_${idx}`}
                    className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                      isPlayingRow ? 'bg-amber-500/20 text-amber-300 font-bold' : 'hover:bg-zinc-900 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-zinc-500 w-6">{idx + 1}</span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{song.title}</div>
                        <div className="truncate text-xs text-zinc-400">{song.artist}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromQueue(idx)}
                      className="text-zinc-600 hover:text-rose-400 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Section */}
      <div className="space-y-6 max-w-xl mx-auto w-full z-10">
        {/* Scrubber Bar */}
        <div className="space-y-1">
          <div
            className="w-full h-2 bg-zinc-800 rounded-full cursor-pointer relative overflow-hidden group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPos = (e.clientX - rect.left) / rect.width;
              seek(clickPos * duration);
            }}
          >
            <div style={{ width: `${progressPct}%` }} className="h-full bg-amber-400 rounded-full" />
          </div>

          <div className="flex justify-between text-xs text-zinc-500 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => toggleFavorite(currentSong.id)}
            className={`p-2.5 rounded-full transition-colors ${
              currentSong.isFavorite ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Heart className={`w-6 h-6 ${currentSong.isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          <div className="flex items-center gap-6">
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-full ${isShuffle ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button onClick={playPrevious} className="text-zinc-200 hover:text-amber-400">
              <SkipBack className="w-7 h-7" />
            </button>

            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center justify-center shadow-xl shadow-amber-500/30 transition-transform active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-zinc-950" />
              ) : (
                <Play className="w-8 h-8 fill-zinc-950 ml-1" />
              )}
            </button>

            <button onClick={playNext} className="text-zinc-200 hover:text-amber-400">
              <SkipForward className="w-7 h-7" />
            </button>

            <button
              onClick={toggleRepeat}
              className={`p-2 rounded-full ${repeatMode !== 'off' ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Repeat className="w-5 h-5" />
            </button>
          </div>

          {/* Speed Rate Button */}
          <button
            onClick={() => {
              const rates = [0.75, 1.0, 1.25, 1.5, 2.0];
              const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
              setPlaybackRate(next);
            }}
            className="text-xs font-mono font-bold text-zinc-400 hover:text-amber-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full"
            title="Playback Speed"
          >
            {playbackRate}x
          </button>
        </div>
      </div>

      {/* Save Queue Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-lg text-white">Save Queue as Playlist</h3>
            <input
              type="text"
              value={savePlaylistName}
              onChange={(e) => setSavePlaylistName(e.target.value)}
              placeholder="Playlist Name"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (savePlaylistName.trim()) {
                    await saveQueueAsPlaylist(savePlaylistName.trim());
                    setShowSaveModal(false);
                    setSavePlaylistName('');
                  }
                }}
                className="px-4 py-2 bg-amber-500 font-bold text-zinc-950 text-xs rounded-xl"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
