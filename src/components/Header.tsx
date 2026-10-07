import React, { useRef, useState } from 'react';
import { Search, FolderPlus, FileAudio, Sparkles, Moon, Sun, Clock, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { parseAudioFile } from '../utils/metadataParser';
import { saveSong } from '../db/bongsDb';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenSleepTimerModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenSleepTimerModal,
}) => {
  const { refreshLibrary, showToast, sleepTimerTimeLeft, loadDemoSongs, setIsEqualizerOpen } = useAudio();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  // File Upload Handler
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsScanning(true);
    showToast(`Parsing ${files.length} audio file(s)...`, 'info');

    let importedCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('audio/') || /\.(mp3|wav|flac|aac|m4a|ogg|opus)$/i.test(file.name)) {
        try {
          const { song, audioBlob } = await parseAudioFile(file);
          await saveSong(song, audioBlob);
          importedCount++;
        } catch (err) {
          console.error('Error importing file:', file.name, err);
        }
      }
    }

    await refreshLibrary();
    setIsScanning(false);
    setIsImportOpen(false);
    showToast(`Imported ${importedCount} track(s) to library`, 'success');

    if (e.target) e.target.value = '';
  };

  // Folder Directory Picker using File System Access API or webkitdirectory
  const handleFolderScan = async () => {
    setIsImportOpen(false);
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        setIsScanning(true);
        showToast('Scanning folder hierarchy...', 'info');

        let importedCount = 0;
        async function scanDir(handle: any, currentPath = '') {
          for await (const entry of handle.values()) {
            if (entry.kind === 'file') {
              if (/\.(mp3|wav|flac|aac|m4a|ogg|opus)$/i.test(entry.name)) {
                try {
                  const file = await entry.getFile();
                  const { song, audioBlob } = await parseAudioFile(file, currentPath);
                  await saveSong(song, audioBlob);
                  importedCount++;
                } catch (e) {
                  console.warn('Failed scanning file:', entry.name, e);
                }
              }
            } else if (entry.kind === 'directory') {
              await scanDir(entry, `${currentPath}/${entry.name}`);
            }
          }
        }

        await scanDir(dirHandle, dirHandle.name);
        await refreshLibrary();
        setIsScanning(false);
        showToast(`Folder scan complete! Imported ${importedCount} tracks`, 'success');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Directory picker error:', err);
          // Fallback to file input
          folderInputRef.current?.click();
        }
      }
    } else {
      folderInputRef.current?.click();
    }
  };

  // Format Sleep Timer display mm:ss
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <header className="h-16 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search songs, artists, albums, or genres... (Press '/' to focus)"
          className="w-full bg-zinc-900/90 border border-zinc-800/80 rounded-full pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
          >
            Clear
          </button>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg,.opus"
        onChange={handleFilesSelected}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory=""
        directory=""
        onChange={handleFilesSelected}
        className="hidden"
      />

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Sleep Timer Indicator */}
        <button
          onClick={onOpenSleepTimerModal}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            sleepTimerTimeLeft !== null
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
          title="Sleep Timer"
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{sleepTimerTimeLeft !== null ? formatTimer(sleepTimerTimeLeft) : 'Sleep Timer'}</span>
        </button>

        {/* Import Music Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsImportOpen(!isImportOpen)}
            disabled={isScanning}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2 rounded-full text-xs font-bold transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <FolderPlus className="w-4 h-4" />
            <span>{isScanning ? 'Scanning...' : 'Import Music'}</span>
            <ChevronDown className="w-3.5 h-3.5 ml-1" />
          </button>

          {isImportOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-50 text-xs">
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setIsImportOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-200 hover:bg-zinc-800 transition-colors text-left font-medium"
              >
                <FileAudio className="w-4 h-4 text-amber-400" />
                <div>
                  <div>Select Audio Files</div>
                  <div className="text-[10px] text-zinc-500">MP3, WAV, FLAC, M4A</div>
                </div>
              </button>

              <button
                onClick={handleFolderScan}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-200 hover:bg-zinc-800 transition-colors text-left font-medium"
              >
                <FolderPlus className="w-4 h-4 text-amber-400" />
                <div>
                  <div>Scan Folder</div>
                  <div className="text-[10px] text-zinc-500">Import entire local directory</div>
                </div>
              </button>

              <div className="border-t border-zinc-800 my-1" />

              <button
                onClick={() => {
                  loadDemoSongs();
                  setIsImportOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-300 hover:bg-amber-500/10 transition-colors text-left font-medium"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <div>
                  <div>Generate Demo Tracks</div>
                  <div className="text-[10px] text-zinc-400">Instantly populate library</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
