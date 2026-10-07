import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';
import { useAudio } from '../context/AudioContext';

export const KeyboardShortcutsModal: React.FC = () => {
  const { isShortcutsOpen, setIsShortcutsOpen } = useAudio();

  if (!isShortcutsOpen) return null;

  const shortcuts = [
    { key: 'Space', action: 'Play / Pause audio' },
    { key: 'J or Left Arrow', action: 'Seek backward 5 seconds' },
    { key: 'L or Right Arrow', action: 'Seek forward 5 seconds' },
    { key: 'Up Arrow', action: 'Increase volume' },
    { key: 'Down Arrow', action: 'Decrease volume' },
    { key: 'M', action: 'Toggle Mute' },
    { key: 'S', action: 'Toggle Shuffle' },
    { key: 'R', action: 'Toggle Repeat Mode' },
    { key: 'L', action: 'Toggle Favorite / Like for current song' },
    { key: 'F', action: 'Toggle Fullscreen Player' },
    { key: '/', action: 'Focus Search Bar' },
    { key: 'Esc', action: 'Close Modals / Exit Fullscreen' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 space-y-6 relative text-zinc-100">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display">Keyboard Shortcuts</h2>
              <p className="text-xs text-zinc-400">Quick hotkeys for seamless media playback</p>
            </div>
          </div>

          <button onClick={() => setIsShortcutsOpen(false)} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 divide-y divide-zinc-800/60 max-h-80 overflow-y-auto custom-scrollbar">
          {shortcuts.map((sc, idx) => (
            <div key={idx} className="flex items-center justify-between py-2.5 text-xs">
              <span className="text-zinc-400 font-medium">{sc.action}</span>
              <kbd className="bg-zinc-950 border border-zinc-700/80 text-amber-300 font-mono font-bold px-2.5 py-1 rounded-lg shadow-inner">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
