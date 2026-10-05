import { MAX_VIEW_ONCE_VIDEO_SECONDS } from './mediaLifecycle';

/**
 * Downscale + re-compress an image on device before it is encrypted and uploaded.
 * Falls back to the original file if anything goes wrong.
 */
export async function compressImage(file: File, maxDimension = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export type ImagePurpose = 'avatar' | 'catalog' | 'outlet' | 'general';

const IMAGE_PRESETS: Record<ImagePurpose, { maxWidth: number; maxHeight: number; quality: number }> = {
  avatar: { maxWidth: 720, maxHeight: 720, quality: 0.82 },
  catalog: { maxWidth: 1200, maxHeight: 1200, quality: 0.82 },
  outlet: { maxWidth: 1600, maxHeight: 1000, quality: 0.84 },
  general: { maxWidth: 1600, maxHeight: 1600, quality: 0.82 },
};

/** Resize and encode an image before upload. Existing non-image upload behavior is unchanged. */
export async function optimizeImageForUpload(file: File, purpose: ImagePurpose = 'general'): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const preset = IMAGE_PRESETS[purpose];
    const scale = Math.min(1, preset.maxWidth / bitmap.width, preset.maxHeight / bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close?.();
      return file;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const keepsTransparency = file.type === 'image/png' || file.type === 'image/webp';
    const preferredType = keepsTransparency ? 'image/webp' : 'image/webp';
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, preferredType, preset.quality));
    if (!blob) return compressImage(file, Math.max(preset.maxWidth, preset.maxHeight), preset.quality);

    const originalBase = file.name.replace(/\.[^.]+$/, '') || 'image';
    const optimized = new File([blob], `${originalBase}.webp`, { type: blob.type || preferredType, lastModified: Date.now() });
    return optimized.size < file.size || scale < 1 ? optimized : file;
  } catch {
    return compressImage(file, Math.max(IMAGE_PRESETS[purpose].maxWidth, IMAGE_PRESETS[purpose].maxHeight), IMAGE_PRESETS[purpose].quality);
  }
}

/** Read a video's duration (seconds). Returns null when it can't be determined. */
export function getVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    const done = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    video.onloadedmetadata = () => done(Number.isFinite(video.duration) ? video.duration : null);
    video.onerror = () => done(null);
    video.src = url;
  });
}

/** Returns an error message when the video is too long for view-once sharing. */
export async function validateVideoDuration(file: File): Promise<string | null> {
  const duration = await getVideoDuration(file);
  if (duration !== null && duration > MAX_VIEW_ONCE_VIDEO_SECONDS + 0.5) {
    return `Videos must be ${MAX_VIEW_ONCE_VIDEO_SECONDS} seconds or shorter`;
  }
  return null;
}
