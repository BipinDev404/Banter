import React, { useState } from 'react';
import { X, Edit3, Image, Save, Star, Music } from 'lucide-react';
import { Song } from '../types';
import { useAudio } from '../context/AudioContext';

interface TagEditorModalProps {
  song: Song | null;
  onClose: () => void;
}

export const TagEditorModal: React.FC<TagEditorModalProps> = ({ song, onClose }) => {
  const { updateMetadata } = useAudio();

  const [title, setTitle] = useState(song?.title || '');
  const [artist, setArtist] = useState(song?.artist || '');
  const [album, setAlbum] = useState(song?.album || '');
  const [genre, setGenre] = useState(song?.genre || '');
  const [year, setYear] = useState(song?.year || '');
  const [trackNumber, setTrackNumber] = useState(song?.trackNumber?.toString() || '');
  const [lyrics, setLyrics] = useState(song?.lyrics || '');
  const [rating, setRating] = useState(song?.rating || 0);
  const [coverUrl, setCoverUrl] = useState(song?.coverUrl || '');

  if (!song) return null;

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverUrl(url);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMetadata(song.id, {
      title,
      artist,
      album,
      genre,
      year,
      trackNumber: trackNumber ? parseInt(trackNumber, 10) : undefined,
      lyrics,
      rating,
      coverUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 space-y-6 relative text-zinc-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display">Edit Song Tags & Metadata</h2>
              <p className="text-xs text-zinc-400">Modify ID3 tags stored in your local library</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Cover Art Upload Preview */}
          <div className="flex items-center gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-800 shrink-0 relative border border-zinc-700">
              {coverUrl ? (
                <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  <Music className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="space-y-1 flex-1">
              <label className="text-xs font-bold text-zinc-300">Album Artwork</label>
              <p className="text-[10px] text-zinc-500">Upload custom cover image for this track</p>
              <label className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors mt-1">
                <Image className="w-3.5 h-3.5 text-amber-400" />
                <span>Choose Image</span>
                <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-100 focus:border-amber-500/50 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Artist</label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-100 focus:border-amber-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Album</label>
              <input
                type="text"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-100 focus:border-amber-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Genre</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-100 focus:border-amber-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Release Year</label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-100 focus:border-amber-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Track #</label>
              <input
                type="number"
                value={trackNumber}
                onChange={(e) => setTrackNumber(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-100 focus:border-amber-500/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-zinc-400 font-semibold text-xs mb-1">Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star === rating ? 0 : star)}
                  className="p-1 text-amber-400"
                >
                  <Star className={`w-5 h-5 ${star <= rating ? 'fill-amber-400' : 'text-zinc-700'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Lyrics */}
          <div>
            <label className="block text-zinc-400 font-semibold text-xs mb-1">Lyrics & Synced Text</label>
            <textarea
              rows={4}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="[00:12.00] Enter lyrics line by line..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 font-mono focus:border-amber-500/50 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Save Metadata</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
