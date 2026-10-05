import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName?: string;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  imageName = 'Image',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = imageName || 'banter-image';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Top Header Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between text-white pointer-events-none">
        <span className="text-xs font-semibold max-w-[200px] sm:max-w-md truncate bg-black/40 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md pointer-events-auto">
          {imageName}
        </span>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleDownload}
            className="p-2 rounded-full bg-black/40 hover:bg-black/70 border border-white/10 text-white transition-colors cursor-pointer"
            title="Download Image"
            aria-label="Download image"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/40 hover:bg-black/70 border border-white/10 text-white transition-colors cursor-pointer"
            title="Close"
            aria-label="Close image viewer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Full Size Image */}
      <div className="relative z-10 max-w-full max-h-[85vh] flex items-center justify-center p-2">
        <img
          src={imageUrl}
          alt={imageName}
          className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
        />
      </div>
    </div>
  );
};
