import { ChatAttachment } from '../types';

/**
 * Formats byte size into human-readable strings (e.g. 240 KB, 1.5 MB)
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Client-side image compressor & reader.
 * Downscales images to max 1200x1200px and compresses JPEG quality to ~0.80
 * so image data payloads stay light (< 250KB) and transmit instantly in real time.
 */
export async function processImageAttachment(file: File): Promise<ChatAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;

        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to process image canvas context'));
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG at 0.80 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.80);

        resolve({
          id: 'att_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7),
          type: 'image',
          url: dataUrl,
          name: file.name,
          size: Math.round((dataUrl.length * 3) / 4), // Approx size in bytes
          mimeType: 'image/jpeg',
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image file'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * General file reader for documents (PDF, TXT, DOCX, ZIP, Audio, Code).
 * Caps file size at 1.5MB to maintain Firestore limits and fast real-time sync.
 */
export async function processFileAttachment(file: File): Promise<ChatAttachment> {
  const MAX_FILE_SIZE = 1.5 * 1024 * 1024; // 1.5MB max for non-compressed raw files

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File is too large (${formatFileSize(file.size)}). Max allowed size is 1.5 MB.`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const isImage = file.type.startsWith('image/');

      resolve({
        id: 'att_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7),
        type: isImage ? 'image' : 'file',
        url: dataUrl,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
      });
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}
