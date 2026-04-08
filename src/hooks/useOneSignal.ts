import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const ONESIGNAL_APP_ID = '15532f0a-ecb3-4cb1-afd4-b810b67edb32';
const SYNC_RETRY_DELAY_MS = 1500;
const SYNC_MAX_ATTEMPTS = 5;

type OneSignalInstance = {
  init: (options: Record<string, unknown>) => Promise<void>;
  login?: (externalId: string) => Promise<void>;
  Notifications?: {
    permission?: NotificationPermission | string | null;
    requestPermission?: () => Promise<void>;
  };
  User?: {
    PushSubscription?: {
      id?: string | null;
      optedIn?: boolean | null;
      addEventListener?: (event: 'change', listener: (event: any) => void) => void;
    };
  };
};

type MedianOneSignalInfo = {
  oneSignalId?: string | null;
  oneSignalUserId?: string | null;
  externalId?: string | null;
  oneSignalSubscribed?: boolean | null;
  platform?: string | null;
  legacy?: boolean | null;
  subscription?: {
    id?: string | null;
    token?: string | null;
    optedIn?: boolean | null;
  } | null;
};

type MedianBridge = {
  onesignal?: {
    login?: (externalId: string) => Promise<unknown> | unknown;
    info?: (options?: { callback?: string }) => Promise<MedianOneSignalInfo> | MedianOneSignalInfo;
    onesignalInfo?: (options?: { callback?: string }) => Promise<MedianOneSignalInfo> | MedianOneSignalInfo;
  };
};

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalInstance) => void>;
    OneSignal?: OneSignalInstance;
    median?: MedianBridge;
    median_onesignal_info?: (oneSignalInfo: MedianOneSignalInfo) => void;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isMedianEnvironment() {
  return typeof window !== 'undefined' && Boolean(window.median?.onesignal);
}

function getDeviceType(oneSignalInfo?: MedianOneSignalInfo | null) {
  if (!isMedianEnvironment()) return 'web';
  const platform = oneSignalInfo?.platform?.toLowerCase();
  return platform ? `median-${platform}` : 'median';
}

function extractMedianPlayerId(oneSignalInfo?: MedianOneSignalInfo | null) {
  return oneSignalInfo?.subscription?.id ?? oneSignalInfo?.oneSignalUserId ?? null;
}

function extractMedianOptIn(oneSignalInfo?: MedianOneSignalInfo | null) {
  if (typeof oneSignalInfo?.subscription?.optedIn === 'boolean') {
    return oneSignalInfo.subscription.optedIn;
  }

  if (typeof oneSignalInfo?.oneSignalSubscribed === 'boolean') {
    return oneSignalInfo.oneSignalSubscribed;
  }

  return false;
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

async function waitForMedianBridge(): Promise<MedianBridge> {
  if (window.median?.onesignal) return window.median;

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      if (window.median?.onesignal) {
        window.clearInterval(intervalId);
        resolve(window.median);
        return;
      }

      if (Date.now() - startedAt >= 4000) {
        window.clearInterval(intervalId);
        reject(new Error('Median OneSignal bridge not available'));
      }
    }, 250);
  });
}

async function getMedianOneSignalInfo(bridge: MedianBridge) {
  const infoFn = bridge.onesignal?.info ?? bridge.onesignal?.onesignalInfo;
  if (!infoFn) {
    console.warn('[OneSignal][Median] info() is unavailable on the Median bridge');
    return null;
  }

  const oneSignalInfo = await Promise.resolve(infoFn());
  console.log('[OneSignal][Median] Bridge info received:', oneSignalInfo);
  return oneSignalInfo ?? null;
}

async function upsertPlayerId(userId: string, playerId: string, deviceType: string) {
  try {
    console.log('[OneSignal] Saving player_id to Supabase:', { userId, playerId, deviceType });

    const { error } = await supabase
      .from('push_subscriptions' as any)
      .upsert(
        { user_id: userId, player_id: playerId, device_type: deviceType },
        { onConflict: 'player_id' }
      );

    if (error) {
      console.error('[OneSignal] Failed to save player_id:', error);
      return false;
    }

    console.log('[OneSignal] Supabase upsert successful for player_id:', playerId);
    return true;
  } catch (err) {
    console.error('[OneSignal] Upsert error:', err);
    return false;
  }
}

export function useOneSignal() {
  const { user } = useAuth();
  const initialized = useRef(false);
  const subscriptionListenerAdded = useRef(false);
  const lastSyncedKey = useRef<string | null>(null);
  const activeUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeUserIdRef.current = user?.id ?? null;

    if (!user?.id) {
      lastSyncedKey.current = null;
    }
  }, [user?.id]);

  const syncPlayerIdToSupabase = useCallback(
    async (userId: string, playerId: string, deviceType: string, source: string) => {
      if (activeUserIdRef.current !== userId) {
        console.log('[OneSignal] Skipping sync for stale user session:', { userId, source });
        return;
      }

      const syncKey = `${userId}:${playerId}`;
      if (lastSyncedKey.current === syncKey) {
        console.log('[OneSignal] player_id already synced:', { userId, playerId, source });
        return;
      }

      console.log('[OneSignal] player_id fetched:', { userId, playerId, deviceType, source });
      const saved = await upsertPlayerId(userId, playerId, deviceType);

      if (saved) {
        lastSyncedKey.current = syncKey;
      }
    },
    []
  );

  const syncWebSubscription = useCallback(
    async (oneSignal: OneSignalInstance, userId: string, attempt = 1): Promise<void> => {
      const subscription = oneSignal.User?.PushSubscription;
      const playerId = subscription?.id ?? null;
      const optedIn = Boolean(subscription?.optedIn);

      console.log('[OneSignal] Web subscription state:', { playerId, optedIn, attempt });

      if (playerId && optedIn) {
        await syncPlayerIdToSupabase(userId, playerId, 'web', 'web-sdk');
        return;
      }

      if (attempt >= SYNC_MAX_ATTEMPTS) {
        console.warn('[OneSignal] player_id unavailable from web SDK after retries');
        return;
      }

      await delay(SYNC_RETRY_DELAY_MS);
      await syncWebSubscription(oneSignal, userId, attempt + 1);
    },
    [syncPlayerIdToSupabase]
  );

  const syncMedianSubscription = useCallback(
    async (userId: string, attempt = 1): Promise<void> => {
      try {
        const bridge = await waitForMedianBridge();
        console.log('[OneSignal][Median] Bridge ready');

        if (typeof bridge.onesignal?.login === 'function') {
          await Promise.resolve(bridge.onesignal.login(userId));
          console.log('[OneSignal][Median] Logged in as:', userId);
        } else {
          console.warn('[OneSignal][Median] login() is unavailable on the Median bridge');
        }

        const oneSignalInfo = await getMedianOneSignalInfo(bridge);
        const playerId = extractMedianPlayerId(oneSignalInfo);
        const optedIn = extractMedianOptIn(oneSignalInfo);
        const deviceType = getDeviceType(oneSignalInfo);

        console.log('[OneSignal][Median] Parsed subscription:', {
          playerId,
          optedIn,
          deviceType,
          attempt,
        });

        if (playerId && optedIn) {
          await syncPlayerIdToSupabase(userId, playerId, deviceType, 'median-bridge');
          return;
        }

        if (attempt >= SYNC_MAX_ATTEMPTS) {
          console.warn('[OneSignal][Median] player_id unavailable after retries');
          return;
        }

        console.log('[OneSignal][Median] player_id not ready yet, retrying...');
        await delay(SYNC_RETRY_DELAY_MS);
        await syncMedianSubscription(userId, attempt + 1);
      } catch (err) {
        console.error('[OneSignal][Median] Sync error:', err);
      }
    },
    [syncPlayerIdToSupabase]
  );

  useEffect(() => {
    window.median_onesignal_info = (oneSignalInfo: MedianOneSignalInfo) => {
      console.log('[OneSignal][Median] median_onesignal_info callback fired:', oneSignalInfo);

      const userId = activeUserIdRef.current;
      if (!userId) {
        console.log('[OneSignal][Median] Callback received before login; waiting for authenticated user.');
        return;
      }

      const playerId = extractMedianPlayerId(oneSignalInfo);
      const optedIn = extractMedianOptIn(oneSignalInfo);

      if (!playerId || !optedIn) {
        console.log('[OneSignal][Median] Callback did not include a subscribed player_id:', {
          playerId,
          optedIn,
        });
        return;
      }

      void syncPlayerIdToSupabase(userId, playerId, getDeviceType(oneSignalInfo), 'median-callback');
    };

    return () => {
      delete window.median_onesignal_info;
    };
  }, [syncPlayerIdToSupabase]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (isMedianEnvironment()) {
      console.log('[OneSignal][Median] Native environment detected. Using Median bridge for initialization.');
      waitForMedianBridge()
        .then(() => console.log('[OneSignal][Median] OneSignal bridge initialized on app load'))
        .catch((error) => console.warn('[OneSignal][Median] Bridge init warning:', error));
      return;
    }

    (async () => {
      try {
        await loadOneSignalScript();

        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async (oneSignal: OneSignalInstance) => {
          await oneSignal.init({
            appId: ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: true,
            notifyButton: { enable: true },
          });
          console.log('[OneSignal] SDK initialized');

          const permission = oneSignal.Notifications?.permission;
          console.log('[OneSignal] Current permission:', permission);

          if (permission === 'default') {
            try {
              await oneSignal.Notifications?.requestPermission?.();
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

  useEffect(() => {
    if (!user?.id) return;

    if (isMedianEnvironment()) {
      void syncMedianSubscription(user.id);

      const refreshMedianSubscription = () => {
        if (document.visibilityState && document.visibilityState !== 'visible') return;
        void syncMedianSubscription(user.id);
      };

      window.addEventListener('focus', refreshMedianSubscription);
      document.addEventListener('visibilitychange', refreshMedianSubscription);

      return () => {
        window.removeEventListener('focus', refreshMedianSubscription);
        document.removeEventListener('visibilitychange', refreshMedianSubscription);
      };
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (oneSignal: OneSignalInstance) => {
      try {
        await oneSignal.login?.(user.id);
        console.log('[OneSignal] Logged in as:', user.id);

        await syncWebSubscription(oneSignal, user.id);

        if (!subscriptionListenerAdded.current && oneSignal.User?.PushSubscription?.addEventListener) {
          subscriptionListenerAdded.current = true;
          oneSignal.User.PushSubscription.addEventListener('change', async (event: any) => {
            const playerId = event?.current?.id ?? null;
            const optedIn = Boolean(event?.current?.optedIn);

            console.log('[OneSignal] Subscription changed:', { playerId, optedIn });

            const currentUserId = activeUserIdRef.current;
            if (!currentUserId || !playerId || !optedIn) return;

            await syncPlayerIdToSupabase(currentUserId, playerId, 'web', 'web-subscription-change');
          });
        }
      } catch (err) {
        console.error('[OneSignal] Sync error:', err);
      }
    });
  }, [syncMedianSubscription, syncPlayerIdToSupabase, syncWebSubscription, user?.id]);
}
