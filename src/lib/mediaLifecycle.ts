/**
 * Media lifecycle policies used across Munchii.
 *
 * VIEW_ONCE_MEDIA — chat/club photos & videos. Encrypted client-side, stored on B2,
 *                   openable exactly once by the authorized recipient, then purged
 *                   server-side (object + metadata).
 * PERSISTENT_FILE — documents / study material. Shared normally, kept until the
 *                   message or file is deleted.
 * RESTAURANT_MEDIA — menu / thumbnail images. Permanent until replaced or deleted.
 * PULSE_24H       — Pulse stories. Automatically expire after 24 hours.
 */
export const MEDIA_LIFECYCLE = {
  VIEW_ONCE_MEDIA: 'VIEW_ONCE_MEDIA',
  PERSISTENT_FILE: 'PERSISTENT_FILE',
  RESTAURANT_MEDIA: 'RESTAURANT_MEDIA',
  PULSE_24H: 'PULSE_24H',
} as const;

export type MediaLifecycle = (typeof MEDIA_LIFECYCLE)[keyof typeof MEDIA_LIFECYCLE];

/** Max duration (seconds) allowed for view-once videos. */
export const MAX_VIEW_ONCE_VIDEO_SECONDS = 60;

/** Document / study-material types allowed as PERSISTENT_FILE. */
const ALLOWED_DOCUMENT_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/rtf',
  'application/zip',
  'application/epub+zip',
];

const ALLOWED_DOCUMENT_EXT = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'txt', 'csv', 'md', 'rtf', 'zip', 'epub',
];

/** Executable / script types we never accept. */
const BLOCKED_EXT = [
  'exe', 'msi', 'bat', 'cmd', 'com', 'scr', 'apk', 'app',
  'sh', 'jar', 'js', 'vbs', 'ps1', 'dll', 'deb', 'dmg',
];

export function fileExtension(name: string) {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export function classifyChatFile(file: File): {
  kind: 'image' | 'video' | 'file';
  lifecycle: MediaLifecycle;
} {
  if (file.type.startsWith('image/')) {
    return { kind: 'image', lifecycle: MEDIA_LIFECYCLE.VIEW_ONCE_MEDIA };
  }
  if (file.type.startsWith('video/')) {
    return { kind: 'video', lifecycle: MEDIA_LIFECYCLE.VIEW_ONCE_MEDIA };
  }
  return { kind: 'file', lifecycle: MEDIA_LIFECYCLE.PERSISTENT_FILE };
}

/** Returns an error message when the file should not be shared, otherwise null. */
export function validateChatFile(file: File): string | null {
  const ext = fileExtension(file.name);

  if (BLOCKED_EXT.includes(ext)) {
    return `${file.name}: this file type is not allowed`;
  }

  if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) {
    return null;
  }

  const okMime = ALLOWED_DOCUMENT_MIME.includes(file.type);
  const okExt = ALLOWED_DOCUMENT_EXT.includes(ext);
  if (!okMime && !okExt) {
    return `${file.name}: unsupported document type`;
  }

  return null;
}
