/**
 * Best-effort secure window (screenshot / screen-recording protection).
 *
 * On Android via Capacitor we ask a privacy-screen plugin to set FLAG_SECURE while
 * a view-once item is on screen. This is NOT available on the web or on iOS, where
 * screenshots cannot be reliably blocked — never present this as absolute protection.
 */
type AnyWin = typeof window & { Capacitor?: any };

function plugin() {
  const w = window as AnyWin;
  const plugins = w?.Capacitor?.Plugins;
  return plugins?.PrivacyScreen || plugins?.ScreenProtector || null;
}

export function isSecureWindowSupported() {
  const w = window as AnyWin;
  return !!plugin() && w?.Capacitor?.getPlatform?.() === 'android';
}

export async function enableSecureWindow() {
  const p = plugin();
  if (!p) return false;
  try {
    if (typeof p.enable === 'function') await p.enable();
    else if (typeof p.preventScreenshot === 'function') await p.preventScreenshot();
    else return false;
    return true;
  } catch {
    return false;
  }
}

export async function disableSecureWindow() {
  const p = plugin();
  if (!p) return;
  try {
    if (typeof p.disable === 'function') await p.disable();
    else if (typeof p.allowScreenshot === 'function') await p.allowScreenshot();
  } catch {
    /* ignore */
  }
}
