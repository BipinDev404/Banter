/**
 * Synthesizes a subtle, pleasant 'pop' sound effect using the Web Audio API.
 * Requires zero external audio files, operates with zero network latency,
 * and produces a gentle, unobtrusive feedback tone.
 */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
      }
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
    return audioContext;
  } catch {
    return null;
  }
}

export function playMessagePopSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Primary gentle bubble pop oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Bandpass filter to keep sound warm and rounded
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(750, now);
    filter.Q.setValueAtTime(1.2, now);

    osc.type = 'sine';
    // Frequency sweeps up then down quickly, mimicking a physical water drop / bubble pop
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.03);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.075);

    // Unobtrusive volume envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.085);
  } catch {
    // Non-blocking if audio permissions restricted
  }
}
