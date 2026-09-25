import { Capacitor } from '@capacitor/core';
import { PushNotifications, type ActionPerformed, type PushNotificationSchema } from '@capacitor/push-notifications';

type NavigateFn = (path: string) => void;

/** Maps a notification's data payload to an in-app route. */
export function routeForPushData(data: Record<string, unknown> | undefined | null): string | null {
  if (!data) return null;
  const type = String(data.type ?? '').toLowerCase();
  if (type === 'order' && data.id) return `/customer/orders/${encodeURIComponent(String(data.id))}`;
  if (type === 'offer') return '/customer?tab=offers';
  return null;
}

let initialized = false;

/**
 * Initializes native push listeners and registers the device token.
 * No-op on the web. Returns a cleanup function.
 */
export async function initNativePush(navigate: NavigateFn): Promise<() => void> {
  if (!Capacitor.isNativePlatform() || initialized) return () => {};
  initialized = true;

  const handles = await Promise.all([
    PushNotifications.addListener('registration', (token) => {
      console.log('[Push] Device token:', token.value);
    }),
    PushNotifications.addListener('registrationError', (err) => {
      console.error('[Push] Registration error:', err);
    }),
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('[Push] Received:', notification);
    }),
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      const path = routeForPushData(action.notification?.data);
      if (path) navigate(path);
    }),
  ]);

  try {
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive === 'granted') {
      await PushNotifications.register();
    } else {
      console.warn('[Push] Permission not granted:', perm.receive);
    }
  } catch (err) {
    console.error('[Push] Init failed:', err);
  }

  return () => {
    handles.forEach((h) => h.remove());
    initialized = false;
  };
}
