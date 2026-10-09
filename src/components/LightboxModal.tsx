import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  imageName = 'image.jpeg',
}) => {
  return (
    <AnimatePresence>
      {isOpen && imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 select-none"
        >
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative z-10 max-w-4xl max-h-[90vh] flex flex-col items-center"
          >
            {/* Top bar controls */}
            <div className="absolute -top-12 right-0 flex items-center gap-3 text-white">
              <a
                href={imageUrl}
                download={imageName}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                title="Download image"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-5 h-5" />
              </a>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                title="Close lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Display */}
            <img
              src={imageUrl}
              alt={imageName}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10 select-none"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
