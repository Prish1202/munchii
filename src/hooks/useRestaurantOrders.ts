import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { OrderStatus } from '@/hooks/useOrders';
import { useRealtimeSync } from './useRealtimeSync';
import { useOrderRingSound } from './useNotificationSound';

export interface RestaurantOrder {
  id: string;
  customer_id: string;
  restaurant_id: string;
  status: OrderStatus;
  total_amount: number;
  payment_method: string;
  pickup_time: string | null;
  pickup_otp: string | null;
  created_at: string;
  updated_at: string;
  customer?: {
    name: string;
    phone: string | null;
  };
  order_items?: {
    id: string;
    quantity: number;
    price_at_time: number;
    menu_item: {
      name: string;
    } | null;
  }[];
}

export function useRestaurantOrders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: restaurant } = useQuery({
    queryKey: ['my-restaurant', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('owner_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const ordersQuery = useQuery({
    queryKey: ['restaurant-orders', restaurant?.id],
    queryFn: async () => {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            id,
            quantity,
            price_at_time,
            menu_item:menu_items(name)
          )
        `)
        .eq('restaurant_id', restaurant!.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const customerIds = [...new Set(ordersData.map(o => o.customer_id).filter(Boolean))];
      let customerMap: Record<string, { name: string; phone: string | null }> = {};
      
      if (customerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, phone')
          .in('id', customerIds);
        
        if (profiles) {
          customerMap = profiles.reduce((acc, p) => {
            acc[p.id] = { name: p.name, phone: p.phone };
            return acc;
          }, {} as Record<string, { name: string; phone: string | null }>);
        }
      }

      return ordersData.map(order => ({
        ...order,
        customer: order.customer_id ? customerMap[order.customer_id] : undefined,
      })) as RestaurantOrder[];
    },
    enabled: !!restaurant?.id,
  });

  // Ringing sound for pending orders
  const { playRing, stop: stopRing } = useOrderRingSound();
  const prevPendingCountRef = useRef(0);

  // Start/stop ringing based on pending orders
  useEffect(() => {
    const pendingOrders = ordersQuery.data?.filter(o => o.status === 'placed') || [];
    const pendingCount = pendingOrders.length;

    if (pendingCount > 0) {
      playRing();
    } else {
      stopRing();
    }

    // Play ring on NEW incoming order (count increased)
    if (pendingCount > prevPendingCountRef.current && prevPendingCountRef.current >= 0) {
      playRing();
    }

    prevPendingCountRef.current = pendingCount;
  }, [ordersQuery.data, playRing, stopRing]);

  const handleNewOrder = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['restaurant-orders', restaurant?.id] });
    toast.info('🔔 New order received!', { description: 'Check your incoming orders' });
  }, [queryClient, restaurant?.id]);

  const handleOrderUpdate = useCallback((payload: any) => {
    queryClient.invalidateQueries({ queryKey: ['restaurant-orders', restaurant?.id] });
    const newStatus = payload?.new?.status;
    if (newStatus === 'completed') {
      const amount = Number(payload.new.total_amount || 0);
      const platformFee = 4;
      const itemTotal = Math.max(amount - platformFee, 0);
      const commission = Math.round(itemTotal * 0.10 * 100) / 100;
      const credited = Math.round((itemTotal - commission) * 100) / 100;
      toast.success(`💰 Order completed! ₹${credited} credited`, {
        description: `After 10% commission (₹${commission})`,
      });
    } else if (newStatus === 'cancelled') {
      toast.error('❌ Order was cancelled');
    }
  }, [queryClient, restaurant?.id]);

  const { isConnected } = useRealtimeSync({
    channelName: `restaurant-orders-${restaurant?.id}`,
    table: 'orders',
    filter: `restaurant_id=eq.${restaurant?.id}`,
    onInsert: handleNewOrder,
    onUpdate: handleOrderUpdate,
    enabled: !!restaurant?.id,
  });

  return { ...ordersQuery, restaurant, isConnected };
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-orders'] });
      toast.success('Order status updated');
    },
    onError: (error) => {
      console.error('Failed to update order:', error);
      toast.error('Failed to update order status');
    },
  });
}
