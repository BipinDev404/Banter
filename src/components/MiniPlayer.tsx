import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  Sliders,
  Maximize2,
  Music,
  Repeat,
  Shuffle,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { VisualizerCanvas } from './VisualizerCanvas';

export const MiniPlayer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleMute,
    toggleFavorite,
    toggleShuffle,
    toggleRepeat,
    setIsFullPlayerOpen,
    setIsEqualizerOpen,
    analyserNode,
    settings,
  } = useAudio();

  if (!currentSong) return null;

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-800/80 backdrop-blur-xl px-4 py-2.5 flex items-center justify-between gap-4 select-none">
      {/* Interactive Progress Bar Top Border */}
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-zinc-800 cursor-pointer group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickPos = (e.clientX - rect.left) / rect.width;
          seek(clickPos * duration);
        }}
      >
        <div
          style={{ width: `${progressPct}%` }}
          className="h-full bg-amber-400 group-hover:bg-amber-300 transition-all relative"
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-amber-300 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Left: Track Info & Artwork */}
      <div
        onClick={() => setIsFullPlayerOpen(true)}
        className="flex items-center gap-3 min-w-0 w-1/4 cursor-pointer group"
      >
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 shrink-0 relative border border-zinc-700/50 shadow-md group-hover:scale-105 transition-transform">
          {currentSong.coverUrl ? (
            <img
              src={currentSong.coverUrl}
              alt={currentSong.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
              <Music className="w-6 h-6" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="font-bold text-sm text-zinc-100 truncate group-hover:text-amber-400 transition-colors">
            {currentSong.title}
          </div>
          <div className="text-xs text-zinc-400 truncate mt-0.5">{currentSong.artist}</div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(currentSong.id);
          }}
          className={`p-1.5 rounded-full transition-colors ml-1 ${
            currentSong.isFavorite ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-300'
          }`}
        >
          <Heart className={`w-4 h-4 ${currentSong.isFavorite ? 'fill-amber-400' : ''}`} />
        </button>
      </div>

      {/* Center: Playback Controls & Time */}
      <div className="flex flex-col items-center gap-1 flex-1 max-w-md">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            className={`p-1.5 rounded-full transition-colors ${
              isShuffle ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={playPrevious}
            className="text-zinc-300 hover:text-amber-400 transition-colors p-1"
            title="Previous"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center justify-center shadow-lg shadow-amber-500/25 transition-transform active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-zinc-950" />
            ) : (
              <Play className="w-5 h-5 fill-zinc-950 ml-0.5" />
            )}
          </button>

          <button
            onClick={playNext}
            className="text-zinc-300 hover:text-amber-400 transition-colors p-1"
            title="Next"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`p-1.5 rounded-full transition-colors relative ${
              repeatMode !== 'off' ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            <Repeat className="w-3.5 h-3.5" />
            {repeatMode === 'one' && (
              <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-amber-500 text-zinc-950 rounded-full w-3 h-3 flex items-center justify-center">
                1
              </span>
            )}
          </button>
        </div>

        {/* Time Labels */}
        <div className="flex items-center justify-between w-full text-[10px] text-zinc-500 font-mono px-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Visualizer, Volume, EQ & Fullscreen Expand */}
      <div className="flex items-center justify-end gap-3 w-1/4">
        {/* Real-time Visualizer Mini Canvas */}
        <div className="hidden lg:block w-28 h-8">
          <VisualizerCanvas
            analyserNode={analyserNode}
            mode={settings.visualizerMode}
            isPlaying={isPlaying}
            className="w-full h-full"
          />
        </div>

        {/* Volume Controls */}
        <div className="hidden sm:flex items-center gap-2">
          <button onClick={toggleMute} className="text-zinc-400 hover:text-zinc-200">
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 accent-amber-500 cursor-pointer h-1 bg-zinc-800 rounded-lg"
          />
        </div>

        <button
          onClick={() => setIsEqualizerOpen(true)}
          className="p-2 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-900 transition-colors"
          title="Equalizer"
        >
          <Sliders className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsFullPlayerOpen(true)}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          title="Expand Player"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
