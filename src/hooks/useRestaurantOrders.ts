import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { OrderStatus } from '@/hooks/useOrders';

export interface RestaurantOrder {
  id: string;
  customer_id: string;
  restaurant_id: string;
  delivery_partner_id: string | null;
  status: OrderStatus;
  total_amount: number;
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

  // First get the restaurant for this owner
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
      // First get orders
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

      // Fetch customer profiles separately
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

      // Merge customer data
      const ordersWithCustomers = ordersData.map(order => ({
        ...order,
        customer: order.customer_id ? customerMap[order.customer_id] : undefined,
      }));

      return ordersWithCustomers as RestaurantOrder[];
    },
    enabled: !!restaurant?.id,
  });

  // Real-time subscription for new orders
  useEffect(() => {
    if (!restaurant?.id) return;

    const channel = supabase
      .channel('restaurant-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        (payload) => {
          console.log('Restaurant order update:', payload);
          queryClient.invalidateQueries({ queryKey: ['restaurant-orders', restaurant.id] });
          
          if (payload.eventType === 'INSERT') {
            toast.info('New order received!', {
              description: 'Check your incoming orders',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurant?.id, queryClient]);

  return { ...ordersQuery, restaurant };
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
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
