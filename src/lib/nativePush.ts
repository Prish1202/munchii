import { Capacitor } from '@capacitor/core';
import { PushNotifications, type ActionPerformed, type PushNotificationSchema } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

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
let currentToken: string | null = null;

/**
 * Links the device token strictly to the signed-in user. The server moves the
 * token away from any previous account on this phone (no-op when signed out).
 */
async function saveToken(token: string) {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user?.id) return;
  const { error } = await (supabase.rpc as any)('claim_push_token', {
    _token: token,
    _device_type: Capacitor.getPlatform(),
  });
  if (error) console.error('[Push] Failed to save token:', error);
}

/** Forces a fresh native registration; the 'registration' listener saves the token. */
export async function refreshNativePushToken() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'granted') await PushNotifications.register();
    else if (currentToken) await saveToken(currentToken);
  } catch (e) {
    console.error('[Push] Refresh failed:', e);
  }
}

/** Removes this device's token for the user who is signing out. Call BEFORE signOut. */
export async function clearNativePushToken(userId: string | undefined) {
  if (!Capacitor.isNativePlatform() || !userId || !currentToken) return;
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('player_id', currentToken);
  if (error) console.error('[Push] Failed to clear token:', error);
}

/**
 * Initializes native push listeners and registers the device token.
 * No-op on the web. Returns a cleanup function.
 */
export async function initNativePush(navigate: NavigateFn): Promise<() => void> {
  if (!Capacitor.isNativePlatform() || initialized) return () => {};
  initialized = true;

  const { data: authSub } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      setTimeout(() => { refreshNativePushToken(); }, 0);
    }
  });

  const handles = await Promise.all([
    PushNotifications.addListener('registration', (token) => {
      console.log('[Push] Device token:', token.value);
      currentToken = token.value;
      saveToken(token.value).catch((e) => console.error('[Push] Save error:', e));
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
    authSub.subscription.unsubscribe();
    initialized = false;
  };
}
