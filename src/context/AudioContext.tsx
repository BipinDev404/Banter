import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Song, Playlist, PlayerSettings, EqualizerSettings, HistoryLog, VisualizerMode } from '../types';
import {
  getAllSongs,
  getAudioBlob,
  saveSong,
  deleteSongFromDB,
  updateSongMetadata,
  incrementPlayCount,
  toggleFavoriteInDB,
  getAllPlaylists,
  savePlaylist,
  deletePlaylistFromDB,
  addHistoryLog,
  getHistoryLogs,
  getSettingsDB,
  saveSettingsDB,
} from '../db/bongsDb';
import { generateDemoTracks } from '../utils/metadataParser';

// EQ Frequency bands in Hz
export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_PRESETS: Record<string, number[]> = {
  'Flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Bass Boost': [6, 5, 4, 2, 0, 0, 0, 0, 1, 2],
  'Vocal Boost': [-2, -1, 1, 3, 4, 4, 3, 1, 0, -1],
  'Rock': [4, 3, 2, -1, -1, 1, 2, 3, 4, 4],
  'Pop': [-1, 1, 3, 4, 3, 0, -1, 1, 2, 3],
  'Jazz': [3, 2, 1, 2, -1, -1, 0, 1, 2, 3],
  'Acoustic': [2, 1, 1, 2, 2, 1, 2, 3, 2, 1],
  'Electronic': [5, 4, 2, 0, -2, 2, 1, 3, 4, 5],
  'Classical': [4, 3, 2, 2, -1, -1, 0, 2, 3, 4],
};

interface ToastMessage {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning';
}

interface AudioContextType {
  // Library State
  songs: Song[];
  playlists: Playlist[];
  currentSong: Song | null;
  queue: Song[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  playbackRate: number;
  
  // Modals & UI States
  isFullPlayerOpen: boolean;
  setIsFullPlayerOpen: (open: boolean) => void;
  isEqualizerOpen: boolean;
  setIsEqualizerOpen: (open: boolean) => void;
  isShortcutsOpen: boolean;
  setIsShortcutsOpen: (open: boolean) => void;
  editingSong: Song | null;
  setEditingSong: (song: Song | null) => void;

  // Audio Nodes & Settings
  analyserNode: AnalyserNode | null;
  settings: PlayerSettings;
  sleepTimerTimeLeft: number | null; // seconds remaining

  // Playback Control Actions
  playSong: (song: Song, customQueue?: Song[], indexInQueue?: number) => Promise<void>;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setPlaybackRate: (rate: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;

  // Queue Operations
  addToQueue: (song: Song) => void;
  playNextInQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (newQueue: Song[]) => void;
  clearQueue: () => void;
  saveQueueAsPlaylist: (name: string) => Promise<void>;

  // Library Actions
  refreshLibrary: () => Promise<void>;
  toggleFavorite: (songId: string) => Promise<void>;
  updateMetadata: (songId: string, updates: Partial<Song>) => Promise<void>;
  deleteSong: (songId: string) => Promise<void>;
  createPlaylist: (name: string, description?: string, songIds?: string[]) => Promise<Playlist>;
  updatePlaylist: (playlist: Playlist) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  loadDemoSongs: () => Promise<void>;

  // Equalizer & Settings Actions
  updateEqualizer: (newEq: Partial<EqualizerSettings>) => void;
  updateSettings: (newSettings: Partial<PlayerSettings>) => void;
  setSleepTimer: (minutes: number | null) => void;

  // Toast System
  toasts: ToastMessage[];
  showToast: (msg: string, type?: 'info' | 'success' | 'warning') => void;
  removeToast: (id: string) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

const DEFAULT_SETTINGS: PlayerSettings = {
  theme: 'dark',
  crossfadeDuration: 0,
  visualizerMode: 'bars',
  playbackRate: 1.0,
  volume: 0.8,
  muted: false,
  sleepTimerMinutes: null,
  sleepTimerFadeOut: true,
  equalizer: {
    enabled: true,
    preset: 'Flat',
    bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bassBoost: 0,
    normalization: false,
  },
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [playbackRate, setPlaybackRateState] = useState<number>(1.0);

  // Modals
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState<boolean>(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  // Settings & Toasts
  const [settings, setSettings] = useState<PlayerSettings>(DEFAULT_SETTINGS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [sleepTimerTimeLeft, setSleepTimerTimeLeft] = useState<number | null>(null);

  // Audio References
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const bassBoostFilterRef = useRef<BiquadFilterNode | null>(null);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const currentObjectUrlRef = useRef<string | null>(null);
  const playLoggedRef = useRef<boolean>(false);
  const sleepTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Toast helper
  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initialize DB data and Audio Element
  const refreshLibrary = useCallback(async () => {
    try {
      const loadedSongs = await getAllSongs();
      const loadedPlaylists = await getAllPlaylists();
      setSongs(loadedSongs);
      setPlaylists(loadedPlaylists);

      const savedSettings = await getSettingsDB();
      if (savedSettings) {
        setSettings((prev) => ({ ...prev, ...savedSettings }));
        if (savedSettings.volume !== undefined) setVolumeState(savedSettings.volume);
        if (savedSettings.playbackRate !== undefined) setPlaybackRateState(savedSettings.playbackRate);
      }
    } catch (err) {
      console.error('Error refreshing library from IndexedDB:', err);
    }
  }, []);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  // Initialize Web Audio Engine
  const setupAudioEngine = useCallback(() => {
    if (audioRef.current) return;

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preservesPitch = true;
    audioRef.current = audio;

    // Time update listener
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);

      // Check if song listened past 70% to log history
      if (!playLoggedRef.current && audio.duration > 0 && currentSong) {
        if (audio.currentTime / audio.duration >= 0.7) {
          playLoggedRef.current = true;
          incrementPlayCount(currentSong.id);
          addHistoryLog({
            songId: currentSong.id,
            songTitle: currentSong.title,
            artist: currentSong.artist,
            album: currentSong.album,
            genre: currentSong.genre,
            playedAt: Date.now(),
            durationPlayedSec: Math.round(audio.currentTime),
            completed: true,
          });
        }
      }
    };

    audio.onended = () => {
      setIsPlaying(false);
      handleTrackEnded();
    };

    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      setIsPlaying(false);
      showToast('Playback error occurred on current track', 'warning');
    };
  }, [currentSong, showToast]);

  const initWebAudioContext = useCallback(() => {
    if (audioCtxRef.current || !audioRef.current) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = source;

      // 10 Band EQ Filters
      const filters: BiquadFilterNode[] = EQ_FREQUENCIES.map((freq, index) => {
        const f = ctx.createBiquadFilter();
        if (index === 0) f.type = 'lowshelf';
        else if (index === EQ_FREQUENCIES.length - 1) f.type = 'highshelf';
        else f.type = 'peaking';

        f.frequency.value = freq;
        f.Q.value = 1.4;
        f.gain.value = settings.equalizer.bands[index] || 0;
        return f;
      });
      eqFiltersRef.current = filters;

      // Bass Boost Filter
      const bassFilter = ctx.createBiquadFilter();
      bassFilter.type = 'lowshelf';
      bassFilter.frequency.value = 100;
      bassFilter.gain.value = settings.equalizer.bassBoost * 1.2;
      bassBoostFilterRef.current = bassFilter;

      // Compressor Node for audio normalization
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, ctx.currentTime);
      compressor.knee.setValueAtTime(30, ctx.currentTime);
      compressor.ratio.setValueAtTime(12, ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      compressor.release.setValueAtTime(0.25, ctx.currentTime);
      compressorNodeRef.current = compressor;

      // Gain Node
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNodeRef.current = gainNode;

      // Analyser Node
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      analyserNodeRef.current = analyser;

      // Connect nodes: Source -> EQ0 -> EQ1 ... -> Bass -> Compressor -> Gain -> Analyser -> Destination
      let lastNode: AudioNode = source;

      if (settings.equalizer.enabled) {
        filters.forEach((filter) => {
          lastNode.connect(filter);
          lastNode = filter;
        });
        lastNode.connect(bassFilter);
        lastNode = bassFilter;
      }

      if (settings.equalizer.normalization) {
        lastNode.connect(compressor);
        lastNode = compressor;
      }

      lastNode.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(ctx.destination);
    } catch (e) {
      console.warn('Web Audio API initialization deferred or restricted:', e);
    }
  }, [settings.equalizer, volume]);

  // Update EQ bands live
  useEffect(() => {
    if (eqFiltersRef.current.length > 0) {
      eqFiltersRef.current.forEach((filter, idx) => {
        const gainVal = settings.equalizer.enabled ? settings.equalizer.bands[idx] || 0 : 0;
        filter.gain.setTargetAtTime(gainVal, audioCtxRef.current?.currentTime || 0, 0.05);
      });
    }

    if (bassBoostFilterRef.current) {
      const boostVal = settings.equalizer.enabled ? settings.equalizer.bassBoost * 1.5 : 0;
      bassBoostFilterRef.current.gain.setTargetAtTime(boostVal, audioCtxRef.current?.currentTime || 0, 0.05);
    }
  }, [settings.equalizer]);

  // Handle Play Track
  const playSong = useCallback(
    async (song: Song, customQueue?: Song[], indexInQueue?: number) => {
      setupAudioEngine();
      if (audioCtxRef.current?.state === 'suspended') {
        await audioCtxRef.current.resume();
      } else if (!audioCtxRef.current) {
        initWebAudioContext();
      }

      try {
        let activeQueue = customQueue || (queue.length > 0 ? queue : songs);
        if (activeQueue.length === 0) activeQueue = [song];

        let targetIndex = indexInQueue !== undefined ? indexInQueue : activeQueue.findIndex((s) => s.id === song.id);
        if (targetIndex === -1) {
          activeQueue = [song, ...activeQueue.filter((s) => s.id !== song.id)];
          targetIndex = 0;
        }

        setQueue(activeQueue);
        setQueueIndex(targetIndex);
        setCurrentSong(song);
        playLoggedRef.current = false;

        // Fetch audio Blob from IndexedDB or use objectUrl
        let audioUrl = song.coverUrl; // fallback
        const blob = await getAudioBlob(song.id);

        if (blob) {
          if (currentObjectUrlRef.current) {
            URL.revokeObjectURL(currentObjectUrlRef.current);
          }
          audioUrl = URL.createObjectURL(blob);
          currentObjectUrlRef.current = audioUrl;
        } else if (song.id.startsWith('demo_')) {
          // Re-generate synthetic audio blob if missing
          const demoData = await generateDemoTracks();
          const demoBlob = demoData.audioBlobs[song.id];
          if (demoBlob) {
            audioUrl = URL.createObjectURL(demoBlob);
            currentObjectUrlRef.current = audioUrl;
          }
        }

        if (audioRef.current && audioUrl) {
          audioRef.current.src = audioUrl;
          audioRef.current.playbackRate = playbackRate;
          audioRef.current.volume = isMuted ? 0 : volume;

          await audioRef.current.play();
          setIsPlaying(true);
        }
      } catch (err) {
        console.error('Failed to play song:', err);
        showToast('Unable to play selected track', 'warning');
      }
    },
    [songs, queue, volume, isMuted, playbackRate, setupAudioEngine, initWebAudioContext, showToast]
  );

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentSong) return;

    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  }, [isPlaying, currentSong]);

  const pause = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const resume = useCallback(() => {
    if (audioRef.current && !isPlaying && currentSong) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  }, [isPlaying, currentSong]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : clamped;
    }
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(clamped, audioCtxRef.current.currentTime);
    }
    saveSettingsDB({ ...settings, volume: clamped });
  }, [isMuted, settings]);

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.volume = nextMuted ? 0 : volume;
    }
  }, [isMuted, volume]);

  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    saveSettingsDB({ ...settings, playbackRate: rate });
  }, [settings]);

  // Queue Operations
  const playNext = useCallback(() => {
    if (queue.length === 0) return;

    if (repeatMode === 'one' && currentSong) {
      seek(0);
      audioRef.current?.play();
      return;
    }

    let nextIdx = queueIndex + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    }

    if (nextIdx < queue.length) {
      playSong(queue[nextIdx], queue, nextIdx);
    } else if (repeatMode === 'all' && queue.length > 0) {
      playSong(queue[0], queue, 0);
    } else {
      setIsPlaying(false);
    }
  }, [queue, queueIndex, isShuffle, repeatMode, currentSong, seek, playSong]);

  const playPrevious = useCallback(() => {
    if (queue.length === 0) return;

    // If current time > 3s, restart track
    if (currentTime > 3) {
      seek(0);
      return;
    }

    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = repeatMode === 'all' ? queue.length - 1 : 0;
    }

    if (queue[prevIdx]) {
      playSong(queue[prevIdx], queue, prevIdx);
    }
  }, [queue, queueIndex, currentTime, repeatMode, seek, playSong]);

  const handleTrackEnded = useCallback(() => {
    playNext();
  }, [playNext]);

  const toggleShuffle = useCallback(() => {
    const nextShuffle = !isShuffle;
    setIsShuffle(nextShuffle);
    showToast(nextShuffle ? 'Shuffle enabled' : 'Shuffle disabled');
  }, [isShuffle, showToast]);

  const toggleRepeat = useCallback(() => {
    const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
    const nextMode = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(nextMode);
    showToast(`Repeat mode: ${nextMode.toUpperCase()}`);
  }, [repeatMode, showToast]);

  const addToQueue = useCallback((song: Song) => {
    setQueue((prev) => [...prev, song]);
    showToast(`Added "${song.title}" to queue`, 'success');
  }, [showToast]);

  const playNextInQueue = useCallback((song: Song) => {
    setQueue((prev) => {
      const copy = [...prev];
      copy.splice(queueIndex + 1, 0, song);
      return copy;
    });
    showToast(`Play Next: "${song.title}"`, 'success');
  }, [queueIndex, showToast]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    if (index < queueIndex) {
      setQueueIndex((prev) => prev - 1);
    }
  }, [queueIndex]);

  const reorderQueue = useCallback((newQueue: Song[]) => {
    setQueue(newQueue);
    if (currentSong) {
      const idx = newQueue.findIndex((s) => s.id === currentSong.id);
      if (idx !== -1) setQueueIndex(idx);
    }
  }, [currentSong]);

  const clearQueue = useCallback(() => {
    setQueue(currentSong ? [currentSong] : []);
    setQueueIndex(0);
    showToast('Queue cleared');
  }, [currentSong, showToast]);

  const saveQueueAsPlaylist = useCallback(async (name: string) => {
    if (queue.length === 0) return;
    const newPlaylist: Playlist = {
      id: `playlist_${Date.now()}`,
      name,
      description: 'Saved from playing queue',
      songIds: queue.map((s) => s.id),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await savePlaylist(newPlaylist);
    await refreshLibrary();
    showToast(`Playlist "${name}" created with ${queue.length} songs`, 'success');
  }, [queue, refreshLibrary, showToast]);

  // Library mutations
  const toggleFavorite = useCallback(async (songId: string) => {
    const isFav = await toggleFavoriteInDB(songId);
    setSongs((prev) =>
      prev.map((s) => (s.id === songId ? { ...s, isFavorite: isFav } : s))
    );
    if (currentSong && currentSong.id === songId) {
      setCurrentSong((prev) => (prev ? { ...prev, isFavorite: isFav } : null));
    }
    showToast(isFav ? 'Added to Favorites' : 'Removed from Favorites');
  }, [currentSong, showToast]);

  const updateMetadata = useCallback(async (songId: string, updates: Partial<Song>) => {
    const updated = await updateSongMetadata(songId, updates);
    if (updated) {
      setSongs((prev) => prev.map((s) => (s.id === songId ? updated : s)));
      if (currentSong && currentSong.id === songId) {
        setCurrentSong(updated);
      }
      showToast('Track tags updated successfully', 'success');
    }
  }, [currentSong, showToast]);

  const deleteSong = useCallback(async (songId: string) => {
    await deleteSongFromDB(songId);
    setSongs((prev) => prev.filter((s) => s.id !== songId));
    setQueue((prev) => prev.filter((s) => s.id !== songId));
    if (currentSong && currentSong.id === songId) {
      playNext();
    }
    showToast('Song deleted from library');
  }, [currentSong, playNext, showToast]);

  const createPlaylist = useCallback(async (name: string, description?: string, songIds: string[] = []): Promise<Playlist> => {
    const p: Playlist = {
      id: `playlist_${Date.now()}`,
      name,
      description,
      songIds,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await savePlaylist(p);
    await refreshLibrary();
    showToast(`Created playlist "${name}"`, 'success');
    return p;
  }, [refreshLibrary, showToast]);

  const updatePlaylist = useCallback(async (p: Playlist) => {
    await savePlaylist({ ...p, updatedAt: Date.now() });
    await refreshLibrary();
    showToast('Playlist updated', 'success');
  }, [refreshLibrary, showToast]);

  const deletePlaylist = useCallback(async (playlistId: string) => {
    await deletePlaylistFromDB(playlistId);
    await refreshLibrary();
    showToast('Playlist deleted');
  }, [refreshLibrary, showToast]);

  const loadDemoSongs = useCallback(async () => {
    showToast('Generating demo music tracks...', 'info');
    const { songs: demoSongs, audioBlobs } = await generateDemoTracks();

    for (const song of demoSongs) {
      const blob = audioBlobs[song.id];
      await saveSong(song, blob);
    }

    await refreshLibrary();
    showToast('Demo tracks loaded! Enjoy listening to Bongs.', 'success');
  }, [refreshLibrary, showToast]);

  // Equalizer & Settings
  const updateEqualizer = useCallback((newEq: Partial<EqualizerSettings>) => {
    setSettings((prev) => {
      const updatedEq = { ...prev.equalizer, ...newEq };
      const updatedSettings = { ...prev, equalizer: updatedEq };
      saveSettingsDB(updatedSettings);
      return updatedSettings;
    });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<PlayerSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveSettingsDB(updated);
      return updated;
    });
  }, []);

  // Sleep Timer logic
  const setSleepTimer = useCallback((minutes: number | null) => {
    if (sleepTimerIntervalRef.current) {
      clearInterval(sleepTimerIntervalRef.current);
      sleepTimerIntervalRef.current = null;
    }

    if (minutes === null) {
      setSleepTimerTimeLeft(null);
      showToast('Sleep timer turned off');
      return;
    }

    const durationSec = minutes * 60;
    setSleepTimerTimeLeft(durationSec);
    showToast(`Sleep timer set for ${minutes} minutes`, 'success');

    sleepTimerIntervalRef.current = setInterval(() => {
      setSleepTimerTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
          pause();
          showToast('Sleep timer expired. Audio paused.');
          return null;
        }

        // Fade out in final 10 seconds
        if (prev <= 10 && audioRef.current) {
          audioRef.current.volume = Math.max(0, (prev / 10) * volume);
        }

        return prev - 1;
      });
    }, 1000);
  }, [volume, pause, showToast]);

  return (
    <AudioContext.Provider
      value={{
        songs,
        playlists,
        currentSong,
        queue,
        queueIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        repeatMode,
        playbackRate,
        isFullPlayerOpen,
        setIsFullPlayerOpen,
        isEqualizerOpen,
        setIsEqualizerOpen,
        isShortcutsOpen,
        setIsShortcutsOpen,
        editingSong,
        setEditingSong,
        analyserNode: analyserNodeRef.current,
        settings,
        sleepTimerTimeLeft,
        playSong,
        togglePlay,
        pause,
        resume,
        seek,
        setVolume,
        toggleMute,
        playNext,
        playPrevious,
        setPlaybackRate,
        toggleShuffle,
        toggleRepeat,
        addToQueue,
        playNextInQueue,
        removeFromQueue,
        reorderQueue,
        clearQueue,
        saveQueueAsPlaylist,
        refreshLibrary,
        toggleFavorite,
        updateMetadata,
        deleteSong,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        loadDemoSongs,
        updateEqualizer,
        updateSettings,
        setSleepTimer,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
