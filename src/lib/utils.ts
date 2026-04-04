import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a raw Backblaze B2 URL into a proxied URL through our edge function,
 * so the browser never hits B2 directly (avoids CORS / auth issues).
 * Already-proxied URLs and non-B2 URLs pass through unchanged.
 */
export function resolveStorageUrl(url?: string | null): string {
  if (!url) return '';

  const proxyBase = import.meta.env.VITE_SUPABASE_URL
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/b2-signed-url`
    : '';

  // Already proxied
  if (!proxyBase || url.startsWith(proxyBase)) return url;

  // Detect raw B2 download URLs: …/file/<bucket>/<path>
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const fileIdx = parts.indexOf('file');
    if (fileIdx !== -1 && parts.length > fileIdx + 2) {
      const filePath = parts.slice(fileIdx + 2).map(decodeURIComponent).join('/');
      return `${proxyBase}?filePath=${encodeURIComponent(filePath)}`;
    }
  } catch {
    // not a URL, return as-is
  }

  return url;
}
