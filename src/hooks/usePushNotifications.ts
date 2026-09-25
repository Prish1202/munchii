import { useEffect, useCallback, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationPreferences } from './useNotificationPreferences';

type NotificationPreferenceKey =
  | 'order_notifications'
  | 'social_notifications'
  | 'message_notifications'
  | 'earning_notifications';

const TYPE_PREFERENCE_MAP: Record<string, NotificationPreferenceKey> = {
  order: 'order_notifications',
  social: 'social_notifications',
  message: 'message_notifications',
  earning: 'earning_notifications',
  info: 'order_notifications',
  error: 'order_notifications',
};

const ROLE_PERMISSION_COPY = {
  customer: 'Enable browser notifications for order updates, messages, follows, and reward activity.',
  restaurant: 'Enable browser notifications for new orders, payout updates, and urgent restaurant alerts.',
  admin: 'Enable browser notifications for important platform alerts and operational updates.',
} as const;

/**
 * Requests browser notification permission and shows native push notifications
 * for important events (orders, messages, follows) even when the tab is not focused.
 *
 * IMPORTANT: We only listen to the `notifications` table here. The DB trigger
 * `notify_new_message` already inserts a row when a message arrives, and
 * `trigger_push_notification` fires the push from that same row.
 * Listening to the `messages` table separately would cause duplicate alerts.
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const { preferences } = useNotificationPreferences();
  const isSupported = typeof Notification !== 'undefined';
  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : 'denied'
  );

  useEffect(() => {
    if (!isSupported) return;

    setPermission(Notification.permission);

    let permissionStatus: PermissionStatus | null = null;

    if ('permissions' in navigator && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'notifications' as PermissionName })
        .then((status) => {
          permissionStatus = status;
          status.onchange = () => setPermission(Notification.permission);
        })
        .catch(() => undefined);
    }

    return () => {
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, [isSupported]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return 'denied' as NotificationPermission;

    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    return nextPermission;
  }, [isSupported]);

  const permissionPromptCopy = useMemo(() => {
    if (!user?.role) return ROLE_PERMISSION_COPY.customer;
    return ROLE_PERMISSION_COPY[user.role];
  }, [user?.role]);

  const shouldNotifyForType = useCallback((type: string) => {
    if (!preferences.push_notifications) return false;

    const prefKey = TYPE_PREFERENCE_MAP[type] ?? 'order_notifications';
    return Boolean(preferences[prefKey]);
  }, [preferences]);

  const showNotification = useCallback((title: string, body: string, link?: string, dedupeKey?: string) => {
    if (!isSupported) return;
    if (permission !== 'granted') return;
    // Only show if tab is not focused (native push handles background delivery)
    if (document.hasFocus()) return;

    try {
      const notif = new Notification(title, {
        body,
        icon: '/favicon.png',
        // A stable tag means a second notification with the same tag REPLACES the
        // previous one rather than stacking — protects against any duplicate fires.
        tag: dedupeKey || `munchii-${title}-${body}`,
        renotify: false,
      } as NotificationOptions);
      if (link) {
        notif.onclick = () => {
          notif.close();
          window.focus();
          window.location.assign(link);
        };
      }
    } catch {
      // Notification not supported in this context
    }
  }, [isSupported, permission]);

  // Subscribe to the notifications table for real-time browser notifications.
  // Push delivery to the device (when the app is closed) is handled server-side
  // server-side.
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`push-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const n = payload.new;
          if (!n) return;
          if (!shouldNotifyForType(n.type)) return;

          showNotification(
            n.title || 'Munchii',
            n.message || '',
            n.link || undefined,
            `munchii-notif-${n.id}`,
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, shouldNotifyForType, showNotification]);

  return {
    showNotification,
    permission,
    isSupported,
    canRequestPermission: isSupported && permission === 'default',
    shouldPromptForPermission: isSupported && preferences.push_notifications && permission === 'default',
    shouldShowBlockedNotice: isSupported && preferences.push_notifications && permission === 'denied',
    permissionPromptCopy,
    requestPermission,
  };
}
