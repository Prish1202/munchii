import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useRealtimeSync } from './useRealtimeSync';

export type OrderStatus = 'pending_payment' | 'placed' | 'accepted' | 'preparing' | 'ready_for_pickup' | 'picked_up' | 'completed' | 'cancelled';

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

const STATUS_MESSAGES: Partial<Record<OrderStatus, string>> = {
  placed: '🛒 Order placed successfully!',
  accepted: '✅ Restaurant accepted your order!',
  preparing: '👨‍🍳 Your food is being prepared!',
  ready_for_pickup: '📦 Your order is ready for pickup!',
  picked_up: '🎉 Your order has been picked up!',
  completed: '🏆 Order complete! Points have been credited to your wallet.',
  cancelled: '❌ Order was cancelled',
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
    // Send order completion email
    if (newStatus === 'completed' && payload.new?.id) {
      supabase.functions.invoke('send-order-completion-email', {
        body: { orderId: payload.new.id },
      }).catch(console.error);
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
    optionLabel?: string | null;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  paymentMethod: string;
  pickupTime?: string;
  prepMinutes?: number;
}

export function useCreateOrder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ restaurantId, items, totalAmount, paymentMethod, pickupTime, prepMinutes }: CreateOrderInput) => {
      // Generate 4-digit OTP
      const pickupOtp = String(Math.floor(1000 + Math.random() * 9000));
      // For online payment, start as pending_payment; for COD, start as placed
      const initialStatus = paymentMethod === 'razorpay' ? 'pending_payment' : 'placed';

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user!.id,
          restaurant_id: restaurantId,
          total_amount: totalAmount,
          status: initialStatus as any,
          payment_method: paymentMethod,
          pickup_time: pickupTime ?? null,
          pickup_otp: pickupOtp,
          prep_minutes: prepMinutes ?? 10,
        } as any)
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        price_at_time: item.price,
        option_label: item.optionLabel || null,
      })) as any;

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
    onError: (error: any) => {
      console.error('Order creation failed:', error);
      const msg = String(error?.message || '');
      if (msg.includes('SLOT_FULL')) toast.error('That pickup slot just filled up. Please pick the next available slot.');
      else if (msg.includes('not accepting orders')) toast.error('This restaurant has paused orders for a few minutes.');
      else if (msg.includes('no longer available')) toast.error('An item in your cart is no longer available.');
      else if (msg.includes('too soon') || msg.includes('too far')) toast.error('Please choose another pickup window.');
      else toast.error('Failed to place order. Please try again.');
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      toast.success('Order cancelled successfully');
    },
    onError: () => {
      toast.error('Failed to cancel order');
    },
  });
}
