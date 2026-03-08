import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface RealtimeSyncOptions {
  channelName: string;
  table: string;
  filter?: string;
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onAny?: (payload: RealtimePostgresChangesPayload<any>) => void;
  enabled?: boolean;
}

export function useRealtimeSync({
  channelName,
  table,
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onAny,
  enabled = true,
}: RealtimeSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // Store callbacks in refs to avoid re-subscribing on every render
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete, onAny });
  callbacksRef.current = { onInsert, onUpdate, onDelete, onAny };

  useEffect(() => {
    if (!enabled) return;

    // Clean up any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter && { filter }),
        },
        (payload) => {
          const cbs = callbacksRef.current;
          cbs.onAny?.(payload);
          switch (payload.eventType) {
            case 'INSERT':
              cbs.onInsert?.(payload);
              break;
            case 'UPDATE':
              cbs.onUpdate?.(payload);
              break;
            case 'DELETE':
              cbs.onDelete?.(payload);
              break;
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (status === 'CLOSED') {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [channelName, table, filter, enabled]);

  return { isConnected };
}

// Convenience hook for order status updates with notifications
export function useOrderStatusNotifications(
  orderId: string | undefined,
  onStatusChange?: (newStatus: string) => void
) {
  const STATUS_MESSAGES: Record<string, string> = {
    placed: 'Order placed successfully!',
    accepted: 'Restaurant accepted your order!',
    preparing: 'Your food is being prepared!',
    ready: 'Order is ready for pickup!',
    picked_up: 'Delivery partner picked up your order!',
    delivered: 'Order has been delivered!',
    cancelled: 'Order was cancelled',
  };

  const { isConnected } = useRealtimeSync({
    channelName: `order-status-${orderId}`,
    table: 'orders',
    filter: orderId ? `id=eq.${orderId}` : undefined,
    enabled: !!orderId,
    onUpdate: (payload) => {
      const newStatus = payload.new?.status;
      if (newStatus && STATUS_MESSAGES[newStatus]) {
        toast.info(STATUS_MESSAGES[newStatus]);
        onStatusChange?.(newStatus);
      }
    },
  });

  return { isConnected };
}
