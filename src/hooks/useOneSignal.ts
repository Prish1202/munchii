import { useEffect, useRef } from 'react';
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
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { user_id: userId, player_id: playerId, device_type: 'web' },
      { onConflict: 'player_id' }
    );
  if (error) console.error('Failed to save OneSignal player_id:', error);
}

export function useOneSignal() {
  const { user } = useAuth();
  const initialized = useRef(false);

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
          });
        });
      } catch (err) {
        console.error('OneSignal init error:', err);
      }
    })();
  }, []);

  // When user logs in, link their player_id
  useEffect(() => {
    if (!user?.id) return;

    const syncPlayerId = () => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          // Set external user id for targeting
          await OneSignal.login(user.id);

          const sub = OneSignal.User?.PushSubscription;
          const playerId = sub?.id;
          if (playerId) {
            await upsertPlayerId(user.id, playerId);
          }

          // Listen for future subscription changes
          OneSignal.User?.PushSubscription?.addEventListener(
            'change',
            async (event: any) => {
              const newId = event?.current?.id;
              if (newId && user?.id) {
                await upsertPlayerId(user.id, newId);
              }
            }
          );
        } catch (err) {
          console.error('OneSignal sync error:', err);
        }
      });
    };

    syncPlayerId();
  }, [user?.id]);
}
