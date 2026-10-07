import React from 'react';
import { X, Sliders, Volume2, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { useAudio, EQ_FREQUENCIES, EQ_PRESETS } from '../context/AudioContext';
import { VisualizerMode } from '../types';

export const EqualizerModal: React.FC = () => {
  const { isEqualizerOpen, setIsEqualizerOpen, settings, updateEqualizer, updateSettings } = useAudio();

  if (!isEqualizerOpen) return null;

  const eq = settings.equalizer;

  const handleBandChange = (index: number, dbVal: number) => {
    const newBands = [...eq.bands];
    newBands[index] = dbVal;
    updateEqualizer({ bands: newBands, preset: 'Custom' });
  };

  const handleSelectPreset = (presetName: string) => {
    const presetBands = EQ_PRESETS[presetName] || EQ_PRESETS['Flat'];
    updateEqualizer({ preset: presetName, bands: [...presetBands] });
  };

  const visualizerModes: { id: VisualizerMode; label: string }[] = [
    { id: 'bars', label: 'Frequency Bars' },
    { id: 'waveform', label: 'Waveform' },
    { id: 'circle', label: 'Concentric Circle' },
    { id: 'spectrum', label: 'Glowing Spectrum' },
    { id: 'off', label: 'Disabled' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 space-y-6 relative text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display">Audio Equalizer & Visualizer</h2>
              <p className="text-xs text-zinc-400">10-Band Web Audio API parametric sound shaping</p>
            </div>
          </div>

          <button
            onClick={() => setIsEqualizerOpen(false)}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* EQ Enable Toggle & Preset selector */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={eq.enabled}
              onChange={(e) => updateEqualizer({ enabled: e.target.checked })}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">Enable Equalizer</span>
          </label>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {Object.keys(EQ_PRESETS).map((pName) => (
              <button
                key={pName}
                onClick={() => handleSelectPreset(pName)}
                disabled={!eq.enabled}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  eq.preset === pName
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 disabled:opacity-40'
                }`}
              >
                {pName}
              </button>
            ))}
          </div>
        </div>

        {/* 10 Slider Bands */}
        <div className={`space-y-2 transition-opacity ${eq.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono px-1">
            <span>+12 dB</span>
            <span>0 dB</span>
            <span>-12 dB</span>
          </div>

          <div className="grid grid-cols-10 gap-2 h-44 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/60 items-center justify-items-center">
            {EQ_FREQUENCIES.map((freq, idx) => {
              const db = eq.bands[idx] || 0;
              const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;

              return (
                <div key={freq} className="flex flex-col items-center h-full justify-between w-full">
                  <span className="text-[10px] font-mono text-amber-400">{db > 0 ? `+${db}` : db}</span>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.5"
                    value={db}
                    onChange={(e) => handleBandChange(idx, parseFloat(e.target.value))}
                    className="h-28 -rotate-90 w-28 accent-amber-500 cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-zinc-400 mt-2">{label}Hz</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bass Boost & Sound Normalization Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Bass Boost
              </span>
              <span className="font-mono text-amber-400">{eq.bassBoost} / 10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={eq.bassBoost}
              onChange={(e) => updateEqualizer({ bassBoost: parseInt(e.target.value, 10) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Sound Normalization
              </span>
              <p className="text-[10px] text-zinc-500">Prevent harsh volume spikes across tracks</p>
            </div>
            <input
              type="checkbox"
              checked={eq.normalization}
              onChange={(e) => updateEqualizer({ normalization: e.target.checked })}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Visualizer Mode Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Visualizer Style
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {visualizerModes.map((v) => (
              <button
                key={v.id}
                onClick={() => updateSettings({ visualizerMode: v.id })}
                className={`py-2 px-2 rounded-xl text-xs font-semibold text-center transition-all ${
                  settings.visualizerMode === v.id
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
