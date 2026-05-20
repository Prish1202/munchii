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

      const { data: contacts } = await supabase
        .from('user_contact_info')
        .select('user_id, phone');
      const phoneByUser: Record<string, string | null> = {};
      (contacts || []).forEach(c => { phoneByUser[c.user_id] = c.phone; });

      return profiles.map(profile => ({
        ...profile,
        phone: phoneByUser[profile.id] ?? null,
        role: roles.find(r => r.user_id === profile.id)?.role || 'customer'
      }));
    }
  });
}

export function useAdminUserDetail(userId: string | null) {
  return useQuery({
    queryKey: ['admin', 'user-detail', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;

      const [profileRes, roleRes, walletRes, ordersRes, followersRes, followingRes, transactionsRes, contactRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
        supabase.from('user_wallet').select('total_coins').eq('user_id', userId).maybeSingle(),
        supabase.from('orders').select('id, total_amount, status, created_at, restaurant:restaurants(name)').eq('customer_id', userId).order('created_at', { ascending: false }),
        supabase.from('followers').select('id').eq('following_id', userId),
        supabase.from('followers').select('id').eq('follower_id', userId),
        supabase.from('coin_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
        supabase.from('user_contact_info').select('phone').eq('user_id', userId).maybeSingle(),
      ]);

      return {
        profile: profileRes.data ? { ...profileRes.data, phone: contactRes.data?.phone ?? null } : null,
        role: roleRes.data?.role || 'customer',
        wallet: walletRes.data,
        orders: ordersRes.data || [],
        followersCount: followersRes.data?.length || 0,
        followingCount: followingRes.data?.length || 0,
        coinTransactions: transactionsRes.data || [],
        totalOrders: ordersRes.data?.length || 0,
        completedOrders: ordersRes.data?.filter(o => o.status === 'completed').length || 0,
        totalSpent: ordersRes.data?.filter(o => o.status === 'completed').reduce((s, o) => s + Number(o.total_amount), 0) || 0,
      };
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
          order:orders(id, total_amount, status, restaurant_id, restaurant:restaurants(name))
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });
}

export function useAdminRestaurantPayoutSummary() {
  return useQuery({
    queryKey: ['admin', 'restaurant-payout-summary'],
    queryFn: async () => {
      // Get all completed orders with their restaurant info
      const { data: completedOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount, restaurant_id, restaurant:restaurants(name, city)')
        .eq('status', 'completed');
      if (ordersError) throw ordersError;

      // Get all payouts
      const { data: payouts, error: payoutsError } = await supabase
        .from('payouts')
        .select('order_id, restaurant_amount, platform_fee');
      if (payoutsError) throw payoutsError;

      const paidOrderIds = new Set(payouts?.map(p => p.order_id) || []);

      // Group by restaurant
      const restaurantMap: Record<string, {
        name: string;
        city: string;
        completedOrders: number;
        totalRevenue: number;
        totalPaid: number;
        totalPlatformFee: number;
        pendingAmount: number;
      }> = {};

      completedOrders?.forEach(order => {
        const rId = order.restaurant_id || 'unknown';
        if (!restaurantMap[rId]) {
          restaurantMap[rId] = {
            name: (order.restaurant as any)?.name || 'Unknown',
            city: (order.restaurant as any)?.city || '-',
            completedOrders: 0,
            totalRevenue: 0,
            totalPaid: 0,
            totalPlatformFee: 0,
            pendingAmount: 0,
          };
        }
        const r = restaurantMap[rId];
        r.completedOrders++;
        const itemTotal = Math.max(Number(order.total_amount) - 4, 0);
        const commission = Math.round(itemTotal * 0.10 * 100) / 100;
        const restaurantShare = itemTotal - commission;
        r.totalRevenue += Number(order.total_amount);

        if (paidOrderIds.has(order.id)) {
          const payout = payouts?.find(p => p.order_id === order.id);
          r.totalPaid += Number(payout?.restaurant_amount || 0);
          r.totalPlatformFee += Number(payout?.platform_fee || 0);
        } else {
          r.pendingAmount += restaurantShare;
          r.totalPlatformFee += commission;
        }
      });

      return Object.entries(restaurantMap).map(([id, data]) => ({ id, ...data }));
    }
  });
}

export function useAdminRefunds() {
  return useQuery({
    queryKey: ['admin', 'refunds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('refunds' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    }
  });
}

export function useUpdateRefundStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ refundId, status, adminNotes }: { refundId: string; status: string; adminNotes?: string }) => {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (adminNotes !== undefined) updates.admin_notes = adminNotes;
      const { error } = await supabase
        .from('refunds' as any)
        .update(updates)
        .eq('id', refundId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'refunds'] });
    }
  });
}

export function useCreateRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, customerId, amount, reason }: { orderId: string; customerId: string; amount: number; reason: string }) => {
      const { error } = await supabase
        .from('refunds' as any)
        .insert({ order_id: orderId, customer_id: customerId, amount, reason, status: 'pending' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'refunds'] });
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

      const ownerIds = restaurants.map(r => r.owner_id);
      const restaurantIds = restaurants.map(r => r.id);

      const [ownerRes, bankRes, ordersRes] = await Promise.all([
        supabase.from('restaurant_owner_details' as any).select('*').in('user_id', ownerIds),
        supabase.from('restaurant_bank_details' as any).select('*').in('restaurant_id', restaurantIds),
        supabase.from('orders').select('restaurant_id, status, total_amount').in('restaurant_id', restaurantIds),
      ]);

      return restaurants.map(r => {
        const rOrders = ordersRes.data?.filter(o => o.restaurant_id === r.id) || [];
        const completedOrders = rOrders.filter(o => o.status === 'completed');
        return {
          ...r,
          verification_status: (r as any).verification_status || 'verified',
          fssai_license: (r as any).fssai_license,
          gst_number: (r as any).gst_number,
          contact_phone: (r as any).contact_phone,
          area: (r as any).area,
          university_name: (r as any).university_name,
          opening_hours: (r as any).opening_hours,
          closing_hours: (r as any).closing_hours,
          owner_details: (ownerRes.data as any[])?.find((o: any) => o.user_id === r.owner_id) || null,
          bank_details: (bankRes.data as any[])?.find((b: any) => b.restaurant_id === r.id) || null,
          totalOrders: rOrders.length,
          completedOrders: completedOrders.length,
          totalRevenue: completedOrders.reduce((s, o) => s + Number(o.total_amount), 0),
          cancelledOrders: rOrders.filter(o => o.status === 'cancelled').length,
        };
      });
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
