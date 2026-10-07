import { Song } from '../types';

/**
 * Extracts metadata from audio files using native browser file readers & ID3 tag decoding.
 */
export async function parseAudioFile(file: File, folderPath?: string): Promise<{ song: Song; audioBlob: Blob }> {
  const songId = `song_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const arrayBuffer = await file.arrayBuffer();

  let title = file.name.replace(/\.[^/.]+$/, '');
  let artist = 'Unknown Artist';
  let album = 'Unknown Album';
  let genre = 'Music';
  let year: string | undefined = undefined;
  let trackNumber: number | undefined = undefined;
  let coverUrl: string | undefined = undefined;

  // Attempt ID3v2 metadata parsing for MP3/AAC
  try {
    const id3 = parseID3v2(arrayBuffer);
    if (id3) {
      if (id3.title) title = id3.title.trim();
      if (id3.artist) artist = id3.artist.trim();
      if (id3.album) album = id3.album.trim();
      if (id3.genre) genre = id3.genre.trim();
      if (id3.year) year = id3.year.trim();
      if (id3.track) trackNumber = parseInt(id3.track, 10) || undefined;
      if (id3.coverBlob) {
        coverUrl = URL.createObjectURL(id3.coverBlob);
      }
    }
  } catch (err) {
    console.warn('ID3 parsing skipped or failed for file:', file.name, err);
  }

  // Get duration using audio context
  let duration = 0;
  try {
    duration = await getAudioDuration(file);
  } catch (e) {
    duration = 180; // fallback duration if decode fails
  }

  // If title still looks like "01 - Artist - Track", clean up filename
  if (title === file.name.replace(/\.[^/.]+$/, '') && title.includes(' - ')) {
    const parts = title.split(' - ');
    if (parts.length >= 2) {
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }
  }

  const audioBlob = new Blob([arrayBuffer], { type: file.type || 'audio/mpeg' });

  const song: Song = {
    id: songId,
    title: title || 'Untitled Track',
    artist: artist || 'Unknown Artist',
    album: album || 'Single',
    duration: Math.max(1, Math.round(duration)),
    genre: genre || 'Audio',
    year,
    trackNumber,
    coverUrl,
    addedAt: Date.now(),
    fileName: file.name,
    fileSize: file.size,
    playCount: 0,
    isFavorite: false,
    folderPath,
  };

  return { song, audioBlob };
}

/**
 * Gets exact duration in seconds of audio file
 */
function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    audio.src = url;
    audio.onloadedmetadata = () => {
      const dur = audio.duration;
      URL.revokeObjectURL(url);
      resolve(isNaN(dur) || !isFinite(dur) ? 0 : dur);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
  });
}

/**
 * Lightweight ID3v2 Tag Reader
 */
interface ParsedID3 {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: string;
  track?: string;
  coverBlob?: Blob;
}

function parseID3v2(buffer: ArrayBuffer): ParsedID3 | null {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 10) return null;

  // Check 'ID3' header
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return null;

  const version = bytes[3];
  const tagSize = ((bytes[6] & 0x7f) << 21) | ((bytes[7] & 0x7f) << 14) | ((bytes[8] & 0x7f) << 7) | (bytes[9] & 0x7f);

  let offset = 10;
  const limit = Math.min(bytes.length, 10 + tagSize);

  const result: ParsedID3 = {};

  while (offset < limit - 10) {
    const frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
    if (!frameId || frameId.charCodeAt(0) === 0) break;

    let frameSize = 0;
    if (version === 4) {
      frameSize = ((bytes[offset + 4] & 0x7f) << 21) | ((bytes[offset + 5] & 0x7f) << 14) | ((bytes[offset + 6] & 0x7f) << 7) | (bytes[offset + 7] & 0x7f);
    } else {
      frameSize = (bytes[offset + 4] << 24) | (bytes[offset + 5] << 16) | (bytes[offset + 6] << 8) | bytes[offset + 7];
    }

    offset += 10;
    if (frameSize <= 0 || offset + frameSize > limit) break;

    const frameData = bytes.subarray(offset, offset + frameSize);

    if (frameId === 'TIT2') {
      result.title = decodeTextFrame(frameData);
    } else if (frameId === 'TPE1') {
      result.artist = decodeTextFrame(frameData);
    } else if (frameId === 'TALB') {
      result.album = decodeTextFrame(frameData);
    } else if (frameId === 'TCON') {
      result.genre = decodeTextFrame(frameData);
    } else if (frameId === 'TYER' || frameId === 'TDRC') {
      result.year = decodeTextFrame(frameData);
    } else if (frameId === 'TRCK') {
      result.track = decodeTextFrame(frameData);
    } else if (frameId === 'APIC') {
      // Attached Picture
      const encoding = frameData[0];
      let mimeStart = 1;
      let mimeEnd = mimeStart;
      while (mimeEnd < frameData.length && frameData[mimeEnd] !== 0) mimeEnd++;
      const mime = new TextDecoder('ascii').decode(frameData.subarray(mimeStart, mimeEnd)) || 'image/jpeg';

      // Picture type (1 byte)
      let picTypePos = mimeEnd + 1;
      let descPos = picTypePos + 1;

      // Skip description
      if (encoding === 1 || encoding === 2) {
        // UTF-16 double null
        while (descPos < frameData.length - 1 && !(frameData[descPos] === 0 && frameData[descPos + 1] === 0)) {
          descPos += 2;
        }
        descPos += 2;
      } else {
        while (descPos < frameData.length && frameData[descPos] !== 0) descPos++;
        descPos += 1;
      }

      if (descPos < frameData.length) {
        const imageBytes = frameData.subarray(descPos);
        result.coverBlob = new Blob([imageBytes], { type: mime.startsWith('image/') ? mime : 'image/jpeg' });
      }
    }

    offset += frameSize;
  }

  return result;
}

function decodeTextFrame(data: Uint8Array): string {
  if (data.length < 2) return '';
  const encoding = data[0];
  const content = data.subarray(1);

  if (encoding === 1 || encoding === 2) {
    return new TextDecoder('utf-16').decode(content).replace(/\0/g, '');
  } else if (encoding === 3) {
    return new TextDecoder('utf-8').decode(content).replace(/\0/g, '');
  }
  return new TextDecoder('iso-8859-1').decode(content).replace(/\0/g, '');
}

/**
 * Generate synthetic high-quality audio tracks using OfflineAudioContext for demo library creation!
 */
export async function generateDemoTracks(): Promise<{ songs: Song[]; audioBlobs: Record<string, Blob> }> {
  const demos = [
    {
      title: 'Midnight Resonance',
      artist: 'Solaris Waves',
      album: 'Nocturne Echoes',
      genre: 'Lo-Fi Chill',
      year: '2025',
      duration: 32,
      scale: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25], // C4 major pentatonic
      tempo: 80,
      lyrics: `[00:02.00]Dim lights softly glow in the night\n[00:08.00]Chasing quiet thoughts into the twilight\n[00:16.00]Rhythm of time slows right down\n[00:24.00]Peace returns to the midnight town`,
    },
    {
      title: 'Neon Horizon',
      artist: 'Aura Pulse',
      album: 'Synth Resonance',
      genre: 'Synthwave',
      year: '2026',
      duration: 28,
      scale: [220.00, 261.63, 293.66, 329.63, 392.00], // A minor
      tempo: 110,
      lyrics: `[00:02.00]Cruising down the electric street\n[00:07.00]Synthesizers locked to the beat\n[00:14.00]Vibrant colors fill the view\n[00:21.00]A brand new sky for me and you`,
    },
    {
      title: 'Acoustic Solitude',
      artist: 'River & Reed',
      album: 'Morning Rain',
      genre: 'Acoustic',
      year: '2024',
      duration: 30,
      scale: [196.00, 246.94, 293.66, 329.63, 392.00], // G major
      tempo: 95,
      lyrics: `[00:03.00]Gentle breeze across the trees\n[00:09.00]A quiet tune upon the breeze\n[00:16.00]Simple strings and peaceful days\n[00:22.00]Finding beauty in calm ways`,
    },
    {
      title: 'Cosmic Drift',
      artist: 'Nebula Stream',
      album: 'Deep Space Dreams',
      genre: 'Ambient',
      year: '2025',
      duration: 35,
      scale: [174.61, 220.00, 261.63, 329.63, 349.23], // F major
      tempo: 65,
      lyrics: `[00:04.00]Drifting far beyond the stars\n[00:12.00]Leaving behind our earthly scars\n[00:20.00]Infinite silence, pure reflection\n[00:28.00]Connected in deep harmony`,
    },
  ];

  const songs: Song[] = [];
  const audioBlobs: Record<string, Blob> = {};

  for (let i = 0; i < demos.length; i++) {
    const d = demos[i];
    const songId = `demo_song_${i + 1}`;
    
    // Render audio blob
    const blob = await renderSyntheticAudioBlob(d.scale, d.tempo, d.duration);
    audioBlobs[songId] = blob;

    const coverUrl = createDemoSVGArtworkUrl(d.title, d.genre, i);

    songs.push({
      id: songId,
      title: d.title,
      artist: d.artist,
      album: d.album,
      duration: d.duration,
      genre: d.genre,
      year: d.year,
      trackNumber: i + 1,
      coverUrl,
      addedAt: Date.now() - (i * 3600000),
      playCount: Math.floor(Math.random() * 15) + 3,
      isFavorite: i === 0 || i === 1,
      lyrics: d.lyrics,
    });
  }

  return { songs, audioBlobs };
}

/**
 * Render synth audio with Web Audio OfflineAudioContext and convert to WAV blob
 */
async function renderSyntheticAudioBlob(scale: number[], tempo: number, durationSec: number): Promise<Blob> {
  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(2, sampleRate * durationSec, sampleRate);

  const beatSec = 60 / tempo;
  const numBeats = Math.floor(durationSec / beatSec);

  // Master Gain
  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.7, 0);
  // Fade out at end
  masterGain.gain.setValueAtTime(0.7, durationSec - 1.5);
  masterGain.gain.linearRampToValueAtTime(0.001, durationSec);
  masterGain.connect(offlineCtx.destination);

  // Play melodic pattern
  for (let b = 0; b < numBeats; b++) {
    const time = b * beatSec;
    const freq = scale[b % scale.length];

    // Synth Lead
    const osc = offlineCtx.createOscillator();
    osc.type = b % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    const env = offlineCtx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(0.25, time + 0.05);
    env.gain.exponentialRampToValueAtTime(0.001, time + beatSec * 0.9);

    osc.connect(env);
    env.connect(masterGain);

    osc.start(time);
    osc.stop(time + beatSec);

    // Warm Bassline
    if (b % 2 === 0) {
      const bassOsc = offlineCtx.createOscillator();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(scale[0] / 2, time);

      const bassFilter = offlineCtx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(250, time);

      const bassEnv = offlineCtx.createGain();
      bassEnv.gain.setValueAtTime(0.2, time);
      bassEnv.gain.exponentialRampToValueAtTime(0.001, time + beatSec * 1.5);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassEnv);
      bassEnv.connect(masterGain);

      bassOsc.start(time);
      bassOsc.stop(time + beatSec * 1.5);
    }
  }

  const renderedBuffer = await offlineCtx.startRendering();
  return audioBufferToWavBlob(renderedBuffer);
}

/**
 * Convert AudioBuffer to WAV Blob
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const outBuffer = new ArrayBuffer(length);
  const view = new DataView(outBuffer);
  const channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // WAV header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit

  setUint32(0x61746164); // "data" chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([outBuffer], { type: 'audio/wav' });
}

/**
 * Generate colorful SVG cover artwork for songs without custom tags
 */
export function createDemoSVGArtworkUrl(title: string, genre: string, index = 0): string {
  const gradients = [
    ['#8B5CF6', '#EC4899', '#3B82F6'],
    ['#F59E0B', '#EF4444', '#8B5CF6'],
    ['#10B981', '#3B82F6', '#6366F1'],
    ['#6366F1', '#A855F7', '#EC4899'],
    ['#F97316', '#F59E0B', '#10B981'],
  ];

  const colors = gradients[index % gradients.length];
  const char = title.charAt(0).toUpperCase() || 'B';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="grad_${index}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colors[0]}" />
        <stop offset="50%" stop-color="${colors[1]}" />
        <stop offset="100%" stop-color="${colors[2]}" />
      </linearGradient>
      <radialGradient id="glow_${index}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.4" />
      </radialGradient>
    </defs>
    <rect width="400" height="400" fill="url(#grad_${index})" />
    <rect width="400" height="400" fill="url(#glow_${index})" />
    <circle cx="200" cy="200" r="140" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" />
    <circle cx="200" cy="200" r="90" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" stroke-dasharray="8 8" />
    <text x="200" y="220" font-family="Plus Jakarta Sans, system-ui, sans-serif" font-weight="800" font-size="110" fill="#ffffff" text-anchor="middle" opacity="0.95">${char}</text>
    <text x="200" y="340" font-family="Plus Jakarta Sans, system-ui, sans-serif" font-weight="600" font-size="18" fill="rgba(255,255,255,0.8)" text-anchor="middle" letter-spacing="2">${genre.toUpperCase()}</text>
  </svg>`;

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
