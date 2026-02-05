import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      return profiles.map(profile => ({
        ...profile,
        role: roles.find(r => r.user_id === profile.id)?.role || 'customer'
      }));
    }
  });
}

export function useAdminOrders() {
  return useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant:restaurants(name),
          order_items(
            quantity,
            price_at_time,
            menu_item:menu_items(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });
}

export function useAdminPayouts() {
  return useQuery({
    queryKey: ['admin', 'payouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payouts')
        .select(`
          *,
          order:orders(
            id,
            total_amount,
            status,
            restaurant:restaurants(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    }
  });
}

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => {
      // Get total users count
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get orders
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, status, created_at');

      // Get restaurants count
      const { count: totalRestaurants } = await supabase
        .from('restaurants')
        .select('*', { count: 'exact', head: true });

      // Get payouts
      const { data: payouts } = await supabase
        .from('payouts')
        .select('platform_fee, restaurant_amount, delivery_amount');

      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
      const deliveredOrders = orders?.filter(o => o.status === 'delivered').length || 0;
      const cancelledOrders = orders?.filter(o => o.status === 'cancelled').length || 0;
      const platformFees = payouts?.reduce((sum, p) => sum + Number(p.platform_fee), 0) || 0;

      // Orders by status
      const ordersByStatus = orders?.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalUsers: totalUsers || 0,
        totalRestaurants: totalRestaurants || 0,
        totalOrders,
        totalRevenue,
        deliveredOrders,
        cancelledOrders,
        platformFees,
        ordersByStatus,
        deliveryRate: totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : '0'
      };
    }
  });
}
