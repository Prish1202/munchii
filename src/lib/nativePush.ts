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

/** Saves the device token for the signed-in user (no-op when signed out). */
async function saveToken(token: string) {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user?.id;
  if (!userId) return;
  const { data: existing } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('player_id', token)
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) {
    await supabase.from('push_subscriptions').update({ updated_at: new Date().toISOString() }).eq('id', existing.id);
    return;
  }
  const { error } = await supabase.from('push_subscriptions').insert({ user_id: userId, player_id: token });
  if (error && error.code !== '23505') console.error('[Push] Failed to save token:', error);
}

/**
 * Initializes native push listeners and registers the device token.
 * No-op on the web. Returns a cleanup function.
 */
export async function initNativePush(navigate: NavigateFn): Promise<() => void> {
  if (!Capacitor.isNativePlatform() || initialized) return () => {};
  initialized = true;

  const { data: authSub } = supabase.auth.onAuthStateChange((event) => {
    if (currentToken && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
      saveToken(currentToken).catch((e) => console.error('[Push] Save error:', e));
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
