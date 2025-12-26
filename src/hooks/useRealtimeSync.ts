import { useEffect, useRef, useCallback, useState } from 'react';
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
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxRetries = 5;
  const retryDelay = 3000;

  const connect = useCallback(() => {
    if (!enabled) return;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: '' },
        broadcast: { self: true },
      },
    });

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
          console.log(`[${channelName}] Realtime event:`, payload.eventType, payload);
          
          onAny?.(payload);

          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload);
              break;
            case 'UPDATE':
              onUpdate?.(payload);
              break;
            case 'DELETE':
              onDelete?.(payload);
              break;
          }
        }
      )
      .subscribe((status, err) => {
        console.log(`[${channelName}] Subscription status:`, status);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionAttempts(0);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false);
          console.error(`[${channelName}] Channel error:`, err);
          
          // Retry connection with exponential backoff
          if (connectionAttempts < maxRetries) {
            const delay = retryDelay * Math.pow(2, connectionAttempts);
            console.log(`[${channelName}] Retrying in ${delay}ms (attempt ${connectionAttempts + 1}/${maxRetries})`);
            
            setTimeout(() => {
              setConnectionAttempts(prev => prev + 1);
              connect();
            }, delay);
          } else {
            toast.error('Lost connection to server. Please refresh the page.');
          }
        } else if (status === 'CLOSED') {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;
  }, [channelName, table, filter, onInsert, onUpdate, onDelete, onAny, enabled, connectionAttempts]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log(`[${channelName}] Browser came online, reconnecting...`);
      toast.info('Reconnecting...');
      setConnectionAttempts(0);
      connect();
    };

    const handleOffline = () => {
      console.log(`[${channelName}] Browser went offline`);
      setIsConnected(false);
      toast.warning('Connection lost. Will reconnect when online.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [channelName, connect]);

  // Initial connection
  useEffect(() => {
    connect();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [connect]);

  return { isConnected, reconnect: connect };
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
