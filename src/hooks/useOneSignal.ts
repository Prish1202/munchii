import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const ONESIGNAL_APP_ID = '15532f0a-ecb3-4cb1-afd4-b810b67edb32';

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: any) => void>;
    OneSignal?: any;
  }
}

function loadOneSignalScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById('onesignal-sdk')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'onesignal-sdk';
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load OneSignal SDK'));
    document.head.appendChild(script);
  });
}

async function upsertPlayerId(userId: string, playerId: string) {
  try {
    const { error } = await supabase
      .from('push_subscriptions' as any)
      .upsert(
        { user_id: userId, player_id: playerId, device_type: 'web' },
        { onConflict: 'player_id' }
      );
    if (error) console.error('[OneSignal] Failed to save player_id:', error);
    else console.log('[OneSignal] Player ID saved:', playerId);
  } catch (err) {
    console.error('[OneSignal] Upsert error:', err);
  }
}

async function syncSubscription(OneSignal: any, userId: string) {
  try {
    const sub = OneSignal.User?.PushSubscription;
    const playerId = sub?.id;
    const optedIn = sub?.optedIn;

    console.log('[OneSignal] Subscription state:', { playerId, optedIn });

    if (playerId && optedIn) {
      await upsertPlayerId(userId, playerId);
    }
  } catch (err) {
    console.error('[OneSignal] Sync error:', err);
  }
}

export function useOneSignal() {
  const { user } = useAuth();
  const initialized = useRef(false);
  const subscriptionListenerAdded = useRef(false);

  // Initialize OneSignal SDK once
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      try {
        await loadOneSignalScript();

        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async (OneSignal: any) => {
          await OneSignal.init({
            appId: ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: true,
            notifyButton: { enable: true },
          });
          console.log('[OneSignal] SDK initialized');

          // Auto-prompt for permission if not yet decided
          const permission = OneSignal.Notifications?.permission;
          console.log('[OneSignal] Current permission:', permission);
          if (!permission) {
            try {
              await OneSignal.Notifications.requestPermission();
              console.log('[OneSignal] Permission granted');
            } catch {
              console.log('[OneSignal] Permission denied or dismissed');
            }
          }
        });
      } catch (err) {
        console.error('[OneSignal] Init error:', err);
      }
    })();
  }, []);

  // When user logs in, link their player_id and listen for changes
  useEffect(() => {
    if (!user?.id) return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        // Set external user ID for targeting
        await OneSignal.login(user.id);
        console.log('[OneSignal] Logged in as:', user.id);

        // Sync current subscription
        await syncSubscription(OneSignal, user.id);

        // Listen for future subscription changes (only once)
        if (!subscriptionListenerAdded.current) {
          subscriptionListenerAdded.current = true;
          OneSignal.User?.PushSubscription?.addEventListener(
            'change',
            async (event: any) => {
              console.log('[OneSignal] Subscription changed:', event?.current);
              const newId = event?.current?.id;
              const optedIn = event?.current?.optedIn;
              if (newId && optedIn && user?.id) {
                await upsertPlayerId(user.id, newId);
              }
            }
          );
        }
      } catch (err) {
        console.error('[OneSignal] Sync error:', err);
      }
    });
  }, [user?.id]);
}
