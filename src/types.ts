export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  genre: string;
  trackNumber?: number;
  year?: string;
  coverUrl?: string;
  addedAt: number; // timestamp
  fileBlob?: Blob;
  fileName?: string;
  fileSize?: number;
  playCount: number;
  lastPlayedAt?: number;
  isFavorite: boolean;
  lyrics?: string;
  rating?: number; // 1 to 5 stars
  folderPath?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  gradient?: string;
  createdAt: number;
  updatedAt: number;
  songIds: string[];
}

export interface HistoryLog {
  id: string;
  songId: string;
  songTitle: string;
  artist: string;
  album: string;
  genre: string;
  playedAt: number; // timestamp
  durationPlayedSec: number;
  completed: boolean;
}

export type VisualizerMode = 'bars' | 'waveform' | 'circle' | 'spectrum' | 'off';

export interface EqualizerSettings {
  enabled: boolean;
  preset: string;
  bands: number[]; // 10 bands gains in dB (-12 to +12)
  bassBoost: number; // 0 to 10
  normalization: boolean;
}

export interface PlayerSettings {
  theme: 'dark' | 'light' | 'system';
  crossfadeDuration: number; // 0 to 10 seconds
  visualizerMode: VisualizerMode;
  playbackRate: number; // 0.5 to 2.0
  volume: number;
  muted: boolean;
  sleepTimerMinutes: number | null;
  sleepTimerFadeOut: boolean;
  equalizer: EqualizerSettings;
}

export type ViewSection = 
  | 'songs' 
  | 'albums' 
  | 'artists' 
  | 'genres' 
  | 'folders' 
  | 'playlists' 
  | 'favorites' 
  | 'smart_collections' 
  | 'insights' 
  | 'settings';

export type SmartCollectionType = 
  | 'heavy_rotation' 
  | 'on_repeat' 
  | 'forgotten_favorites' 
  | 'morning_vibes' 
  | 'night_vibes' 
  | 'bongs_daily_mix'
  | 'recently_added';

export interface ListeningStats {
  totalListeningTimeSec: number;
  totalPlays: number;
  completedPlays: number;
  currentStreakDays: number;
  topArtist: { name: string; count: number } | null;
  topAlbum: { name: string; count: number } | null;
  topGenre: { name: string; count: number } | null;
  topSong: { title: string; artist: string; count: number } | null;
  hourlyDistribution: number[]; // 24 numbers representing plays per hour of day
}
