import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Requests browser notification permission and shows native push notifications
 * for important events (orders, messages, follows) even when the tab is not focused.
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const permissionRef = useRef(typeof Notification !== 'undefined' ? Notification.permission : 'denied');

  // Request permission on mount
  useEffect(() => {
    if (typeof Notification === 'undefined' || !user?.id) return;
    if (Notification.permission === 'default') {
      // Small delay so it doesn't fire immediately on page load
      const timer = setTimeout(() => {
        Notification.requestPermission().then((perm) => {
          permissionRef.current = perm;
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
    permissionRef.current = Notification.permission;
  }, [user?.id]);

  const showNotification = useCallback((title: string, body: string, link?: string) => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    // Only show if tab is not focused
    if (document.hasFocus()) return;

    try {
      const notif = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: `foodyzone-${Date.now()}`,
      });
      if (link) {
        notif.onclick = () => {
          window.focus();
          window.location.href = link;
        };
      }
    } catch {
      // Notification not supported in this context
    }
  }, []);

  // Subscribe to the notifications table for real-time browser push
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
          if (n) {
            showNotification(n.title || 'FoodyZone', n.message || '', n.link || undefined);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, showNotification]);

  return { showNotification };
}
