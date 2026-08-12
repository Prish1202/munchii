// Canonical public base URL for shareable links.
// Never use window.location.origin for shares: inside the Android/Capacitor
// webview it resolves to localhost / file:// and produces broken links.
export const PUBLIC_BASE_URL = 'https://munchii.in';

export const APP_SCHEME = 'munchii';

export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=in.munchii.app';

/** Public shareable profile link (goes through the /u interstitial). */
export function profileShareUrl(userId: string): string {
  return `${PUBLIC_BASE_URL}/u/${userId}`;
}

/** Deep link used to open the native app on a profile. */
export function profileDeepLink(userId: string): string {
  return `${APP_SCHEME}://user/${userId}`;
}

/** Public shareable club link. */
export function clubShareUrl(clubId: string): string {
  return `${PUBLIC_BASE_URL}/customer/club/${clubId}`;
}

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);
}

export function isInAppWebview(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).Capacitor);
}
