import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useRealtimeSync } from './useRealtimeSync';

export type OrderStatus = 'placed' | 'accepted' | 'preparing' | 'ready_for_pickup' | 'picked_up' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  customer_id: string;
  restaurant_id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
  restaurant?: {
    name: string;
    address: string;
  };
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price_at_time: number;
  menu_item?: {
    name: string;
  };
}

const STATUS_MESSAGES: Record<OrderStatus, string> = {
  placed: 'Order placed!',
  accepted: 'Restaurant accepted your order!',
  preparing: 'Your food is being prepared!',
  ready_for_pickup: 'Your order is ready for pickup!',
  picked_up: 'Your order has been picked up!',
  completed: 'Your order is complete!',
  cancelled: 'Order cancelled',
};

export function useCustomerOrders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['customer-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant:restaurants(name, address)
        `)
        .eq('customer_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user?.id,
  });

  const handleUpdate = useCallback((payload: any) => {
    queryClient.invalidateQueries({ queryKey: ['customer-orders', user?.id] });
    const newStatus = payload.new?.status as OrderStatus;
    if (newStatus && STATUS_MESSAGES[newStatus]) {
      toast.info(STATUS_MESSAGES[newStatus]);
    }
  }, [queryClient, user?.id]);

  const handleInsert = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['customer-orders', user?.id] });
  }, [queryClient, user?.id]);

  const { isConnected } = useRealtimeSync({
    channelName: `customer-orders-${user?.id}`,
    table: 'orders',
    filter: `customer_id=eq.${user?.id}`,
    onUpdate: handleUpdate,
    onInsert: handleInsert,
    enabled: !!user?.id,
  });

  return { ...query, isConnected };
}

export function useOrderItems(orderId: string) {
  return useQuery({
    queryKey: ['order-items', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select(`*, menu_item:menu_items(name)`)
        .eq('order_id', orderId);

      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!orderId,
  });
}

interface CreateOrderInput {
  restaurantId: string;
  items: {
    menuItemId: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
}

export function useCreateOrder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ restaurantId, items, totalAmount }: CreateOrderInput) => {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user!.id,
          restaurant_id: restaurantId,
          total_amount: totalAmount,
          status: 'placed',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        price_at_time: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      toast.success('Order placed successfully!');
    },
    onError: (error) => {
      console.error('Order creation failed:', error);
      toast.error('Failed to place order. Please try again.');
    },
  });
}
