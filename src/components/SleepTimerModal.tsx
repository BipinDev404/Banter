import React from 'react';
import { X, Clock, Moon } from 'lucide-react';
import { useAudio } from '../context/AudioContext';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({ isOpen, onClose }) => {
  const { setSleepTimer, sleepTimerTimeLeft } = useAudio();

  if (!isOpen) return null;

  const timerOptions = [
    { minutes: 15, label: '15 Minutes' },
    { minutes: 30, label: '30 Minutes' },
    { minutes: 45, label: '45 Minutes' },
    { minutes: 60, label: '1 Hour' },
    { minutes: 90, label: '1.5 Hours' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 space-y-6 text-zinc-100 relative">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display">Sleep Timer</h2>
              <p className="text-xs text-zinc-400">Pause music automatically after time</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {timerOptions.map((opt) => (
            <button
              key={opt.minutes}
              onClick={() => {
                setSleepTimer(opt.minutes);
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-zinc-950 hover:bg-zinc-800 hover:text-amber-300 border border-zinc-800 text-left transition-colors flex items-center justify-between"
            >
              <span>{opt.label}</span>
              <Clock className="w-4 h-4 text-zinc-500" />
            </button>
          ))}

          {sleepTimerTimeLeft !== null && (
            <button
              onClick={() => {
                setSleepTimer(null);
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-center transition-colors mt-4"
            >
              Turn Off Timer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
