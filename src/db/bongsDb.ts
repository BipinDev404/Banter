import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Song, Playlist, HistoryLog, PlayerSettings } from '../types';

interface BongsDBSchema extends DBSchema {
  songs: {
    key: string;
    value: Song;
    indexes: {
      'by-title': string;
      'by-artist': string;
      'by-album': string;
      'by-addedAt': number;
      'by-playCount': number;
      'by-isFavorite': number;
    };
  };
  audioBlobs: {
    key: string;
    value: { id: string; blob: Blob };
  };
  playlists: {
    key: string;
    value: Playlist;
    indexes: {
      'by-name': string;
    };
  };
  history: {
    key: string;
    value: HistoryLog;
    indexes: {
      'by-playedAt': number;
      'by-songId': string;
    };
  };
  settings: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'bongs_offline_music_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<BongsDBSchema>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<BongsDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Songs Store
        if (!db.objectStoreNames.contains('songs')) {
          const songStore = db.createObjectStore('songs', { keyPath: 'id' });
          songStore.createIndex('by-title', 'title');
          songStore.createIndex('by-artist', 'artist');
          songStore.createIndex('by-album', 'album');
          songStore.createIndex('by-addedAt', 'addedAt');
          songStore.createIndex('by-playCount', 'playCount');
          songStore.createIndex('by-isFavorite', 'isFavorite');
        }

        // Audio Blobs Store
        if (!db.objectStoreNames.contains('audioBlobs')) {
          db.createObjectStore('audioBlobs', { keyPath: 'id' });
        }

        // Playlists Store
        if (!db.objectStoreNames.contains('playlists')) {
          const playlistStore = db.createObjectStore('playlists', { keyPath: 'id' });
          playlistStore.createIndex('by-name', 'name');
        }

        // History Store
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id' });
          historyStore.createIndex('by-playedAt', 'playedAt');
          historyStore.createIndex('by-songId', 'songId');
        }

        // Settings Store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

// SONG API
export async function saveSong(song: Song, audioBlob?: Blob): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['songs', 'audioBlobs'], 'readwrite');
  
  // Clone song object without blob to avoid duplicating blob in song store
  const songRecord: Song = { ...song };
  delete songRecord.fileBlob;

  await tx.objectStore('songs').put(songRecord);

  if (audioBlob) {
    await tx.objectStore('audioBlobs').put({ id: song.id, blob: audioBlob });
  }

  await tx.done;
}

export async function getAllSongs(): Promise<Song[]> {
  const db = await getDB();
  return db.getAll('songs');
}

export async function getSong(id: string): Promise<Song | undefined> {
  const db = await getDB();
  return db.get('songs', id);
}

export async function getAudioBlob(songId: string): Promise<Blob | undefined> {
  const db = await getDB();
  const record = await db.get('audioBlobs', songId);
  return record?.blob;
}

export async function deleteSongFromDB(songId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['songs', 'audioBlobs', 'playlists'], 'readwrite');
  await tx.objectStore('songs').delete(songId);
  await tx.objectStore('audioBlobs').delete(songId);

  // Remove song ID from all playlists
  const playlists = await tx.objectStore('playlists').getAll();
  for (const playlist of playlists) {
    if (playlist.songIds.includes(songId)) {
      playlist.songIds = playlist.songIds.filter(id => id !== songId);
      playlist.updatedAt = Date.now();
      await tx.objectStore('playlists').put(playlist);
    }
  }

  await tx.done;
}

export async function updateSongMetadata(songId: string, updates: Partial<Song>): Promise<Song | undefined> {
  const db = await getDB();
  const song = await db.get('songs', songId);
  if (!song) return undefined;

  const updatedSong = { ...song, ...updates };
  await db.put('songs', updatedSong);
  return updatedSong;
}

export async function incrementPlayCount(songId: string): Promise<void> {
  const db = await getDB();
  const song = await db.get('songs', songId);
  if (song) {
    song.playCount = (song.playCount || 0) + 1;
    song.lastPlayedAt = Date.now();
    await db.put('songs', song);
  }
}

export async function toggleFavoriteInDB(songId: string): Promise<boolean> {
  const db = await getDB();
  const song = await db.get('songs', songId);
  if (song) {
    song.isFavorite = !song.isFavorite;
    await db.put('songs', song);
    return song.isFavorite;
  }
  return false;
}

// PLAYLIST API
export async function getAllPlaylists(): Promise<Playlist[]> {
  const db = await getDB();
  return db.getAll('playlists');
}

export async function savePlaylist(playlist: Playlist): Promise<void> {
  const db = await getDB();
  await db.put('playlists', playlist);
}

export async function deletePlaylistFromDB(playlistId: string): Promise<void> {
  const db = await getDB();
  await db.delete('playlists', playlistId);
}

// HISTORY API
export async function addHistoryLog(log: Omit<HistoryLog, 'id'>): Promise<void> {
  const db = await getDB();
  const newLog: HistoryLog = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  };
  await db.put('history', newLog);
}

export async function getHistoryLogs(): Promise<HistoryLog[]> {
  const db = await getDB();
  return db.getAllFromIndex('history', 'by-playedAt');
}

export async function clearHistoryDB(): Promise<void> {
  const db = await getDB();
  await db.clear('history');
}

// SETTINGS API
export async function getSettingsDB(): Promise<Partial<PlayerSettings> | undefined> {
  const db = await getDB();
  return db.get('settings', 'player_config');
}

export async function saveSettingsDB(settings: PlayerSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'player_config');
}

// BACKUP & EXPORT
export async function exportLibraryDataJSON(): Promise<string> {
  const db = await getDB();
  const songs = await db.getAll('songs');
  const playlists = await db.getAll('playlists');
  const history = await db.getAll('history');

  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    songs: songs.map(s => {
      const copy = { ...s };
      delete copy.fileBlob;
      return copy;
    }),
    playlists,
    history,
  };

  return JSON.stringify(exportData, null, 2);
}

export async function importLibraryDataJSON(jsonStr: string): Promise<{ importedSongs: number; importedPlaylists: number }> {
  const data = JSON.parse(jsonStr);
  const db = await getDB();

  let importedPlaylists = 0;
  if (Array.isArray(data.playlists)) {
    for (const p of data.playlists) {
      await db.put('playlists', p);
      importedPlaylists++;
    }
  }

  let importedSongs = 0;
  if (Array.isArray(data.songs)) {
    for (const s of data.songs) {
      const existing = await db.get('songs', s.id);
      if (!existing) {
        await db.put('songs', s);
        importedSongs++;
      }
    }
  }

  return { importedSongs, importedPlaylists };
}
