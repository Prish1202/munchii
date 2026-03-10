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
          order_items(quantity, price_at_time, menu_item:menu_items(name))
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
          order:orders(id, total_amount, status, restaurant:restaurants(name))
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

export function useAdminRestaurants() {
  return useQuery({
    queryKey: ['admin', 'restaurants'],
    queryFn: async () => {
      const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch owner details and bank details for all restaurants
      const ownerIds = restaurants.map(r => r.owner_id);
      const restaurantIds = restaurants.map(r => r.id);

      const { data: ownerDetails } = await supabase
        .from('restaurant_owner_details' as any)
        .select('*')
        .in('user_id', ownerIds);

      const { data: bankDetails } = await supabase
        .from('restaurant_bank_details' as any)
        .select('*')
        .in('restaurant_id', restaurantIds);

      return restaurants.map(r => ({
        ...r,
        verification_status: (r as any).verification_status || 'verified',
        fssai_license: (r as any).fssai_license,
        gst_number: (r as any).gst_number,
        contact_phone: (r as any).contact_phone,
        area: (r as any).area,
        university_name: (r as any).university_name,
        opening_hours: (r as any).opening_hours,
        closing_hours: (r as any).closing_hours,
        owner_details: (ownerDetails as any[])?.find((o: any) => o.user_id === r.owner_id) || null,
        bank_details: (bankDetails as any[])?.find((b: any) => b.restaurant_id === r.id) || null,
      }));
    }
  });
}

export function useVerifyRestaurant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ restaurantId, status }: { restaurantId: string; status: 'verified' | 'rejected' }) => {
      const updates: any = { verification_status: status };
      if (status === 'verified') {
        updates.is_active = true;
      }
      const { error } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', restaurantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'restaurants'] });
    }
  });
}

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => {
      const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { data: orders } = await supabase.from('orders').select('total_amount, status, created_at');
      const { count: totalRestaurants } = await supabase.from('restaurants').select('*', { count: 'exact', head: true });
      const { data: payouts } = await supabase.from('payouts').select('platform_fee, restaurant_amount');

      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
      const completedOrders = orders?.filter(o => o.status === 'completed').length || 0;
      const cancelledOrders = orders?.filter(o => o.status === 'cancelled').length || 0;
      const platformFees = payouts?.reduce((sum, p) => sum + Number(p.platform_fee), 0) || 0;

      const ordersByStatus = orders?.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalUsers: totalUsers || 0,
        totalRestaurants: totalRestaurants || 0,
        totalOrders,
        totalRevenue,
        completedOrders,
        cancelledOrders,
        platformFees,
        ordersByStatus,
        completionRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : '0'
      };
    }
  });
}
