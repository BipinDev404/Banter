import React, { useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  Trash2,
  Database,
  Moon,
  Sparkles,
  ShieldCheck,
  HardDrive,
  Info,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import {
  exportLibraryDataJSON,
  importLibraryDataJSON,
  clearHistoryDB,
  getDB,
} from '../db/bongsDb';

export const SettingsView: React.FC = () => {
  const { songs, playlists, refreshLibrary, showToast } = useAudio();
  const [isExporting, setIsExporting] = useState(false);

  // Compute total library size in MB
  const totalSizeBytes = songs.reduce((acc, s) => acc + (s.fileSize || 0), 0);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(1);

  // Backup Export JSON
  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const jsonStr = await exportLibraryDataJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bongs_library_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported library backup successfully', 'success');
    } catch (e) {
      console.error('Export error:', e);
      showToast('Failed to export backup', 'warning');
    } finally {
      setIsExporting(false);
    }
  };

  // Backup Import JSON
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = await importLibraryDataJSON(text);
      await refreshLibrary();
      showToast(`Imported ${res.importedSongs} songs & ${res.importedPlaylists} playlists!`, 'success');
    } catch (e) {
      console.error('Import error:', e);
      showToast('Invalid backup file format', 'warning');
    }
  };

  // Clear History
  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear your local listening history?')) {
      await clearHistoryDB();
      showToast('Listening history cleared');
    }
  };

  // Wipe All Data
  const handleClearAllData = async () => {
    if (
      confirm(
        'CRITICAL: This will delete ALL songs, audio files, playlists, and stats stored in IndexedDB. Are you sure?'
      )
    ) {
      const db = await getDB();
      await db.clear('songs');
      await db.clear('audioBlobs');
      await db.clear('playlists');
      await db.clear('history');
      await refreshLibrary();
      showToast('All local Bongs data cleared', 'info');
    }
  };

  return (
    <div className="space-y-8 max-w-3xl pb-12 text-zinc-100">
      <div>
        <h2 className="text-2xl font-bold font-display">App Settings & Data</h2>
        <p className="text-xs text-zinc-400 mt-1">Manage your 100% offline local IndexedDB storage and backup</p>
      </div>

      {/* Storage Health */}
      <div className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">IndexedDB Library Storage</h3>
            <p className="text-xs text-zinc-400">Offline database state</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
          <div>
            <div className="text-lg font-bold text-amber-400 font-mono">{songs.length}</div>
            <div className="text-[10px] text-zinc-500">Tracks Saved</div>
          </div>
          <div>
            <div className="text-lg font-bold text-amber-400 font-mono">{playlists.length}</div>
            <div className="text-[10px] text-zinc-500">Playlists</div>
          </div>
          <div>
            <div className="text-lg font-bold text-amber-400 font-mono">{totalSizeMB} MB</div>
            <div className="text-[10px] text-zinc-500">Local Audio Size</div>
          </div>
        </div>
      </div>

      {/* Export / Import Backup */}
      <div className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Library Backup & Restore</h3>
            <p className="text-xs text-zinc-400">Export metadata and playlist structures to JSON</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportBackup}
            disabled={isExporting}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors border border-zinc-700/60"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export Backup JSON</span>
          </button>

          <label className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors border border-zinc-700/60 cursor-pointer">
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Restore Backup JSON</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-950/20 p-6 rounded-2xl border border-rose-500/30 space-y-4">
        <h3 className="font-bold text-sm text-rose-400">Data Cleanup</h3>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-rose-300 px-4 py-2 rounded-xl text-xs font-bold border border-rose-500/30"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Listening History</span>
          </button>

          <button
            onClick={handleClearAllData}
            className="flex items-center gap-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-4 py-2 rounded-xl text-xs font-bold border border-rose-500/40"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Entire Bongs Library</span>
          </button>
        </div>
      </div>
    </div>
  );
};
