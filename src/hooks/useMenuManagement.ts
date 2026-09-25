import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  price: number;
  available: boolean;
  image_url: string | null;
  description: string | null;
  discount_percent: number;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  preparation_time_minutes: number;
  fulfillment_type?: string;
  quantity_type?: string;
  quantity_options?: any;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export function useMyRestaurant() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-restaurant', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useMyMenuItems() {
  const { data: restaurant } = useMyRestaurant();

  return useQuery({
    queryKey: ['my-menu-items', restaurant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MenuItem[];
    },
    enabled: !!restaurant?.id,
  });
}

export function useMenuCategories(restaurantId?: string) {
  const { data: myRestaurant } = useMyRestaurant();
  const rId = restaurantId || myRestaurant?.id;

  return useQuery({
    queryKey: ['menu-categories', rId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', rId!)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as MenuCategory[];
    },
    enabled: !!rId,
  });
}

export function useAddMenuItem() {
  const { data: restaurant } = useMyRestaurant();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: {
      name: string;
      price: number;
      description?: string;
      image_url?: string;
      category_id?: string;
      discount_percent?: number;
      preparation_time_minutes?: number;
      fulfillment_type?: string;
      quantity_type?: string;
      quantity_options?: any;
    }) => {
      const { error } = await supabase.from('menu_items').insert({
        restaurant_id: restaurant!.id,
        name: item.name,
        price: item.price,
        description: item.description || null,
        image_url: item.image_url || null,
        category_id: item.category_id || null,
        discount_percent: item.discount_percent || 0,
        preparation_time_minutes: item.preparation_time_minutes || 10,
        fulfillment_type: item.fulfillment_type || 'PREPARE',
        quantity_type: item.quantity_type || 'FIXED',
        quantity_options: item.quantity_options || [],
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-menu-items'] });
      toast.success('Item added');
    },
    onError: () => toast.error('Failed to add item'),
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MenuItem> & { id: string }) => {
      const { error } = await supabase
        .from('menu_items')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-menu-items'] });
      toast.success('Item updated');
    },
    onError: () => toast.error('Failed to update item'),
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-menu-items'] });
      toast.success('Item deleted');
    },
    onError: () => toast.error('Failed to delete item'),
  });
}

export function useAddCategory() {
  const { data: restaurant } = useMyRestaurant();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('menu_categories').insert({
        restaurant_id: restaurant!.id,
        name,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      toast.success('Category added');
    },
    onError: () => toast.error('Failed to add category'),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('menu_categories')
        .update({ name })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      toast.success('Category updated');
    },
    onError: () => toast.error('Failed to update category'),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Unlink items first
      await supabase.from('menu_items').update({ category_id: null }).eq('category_id', id);
      const { error } = await supabase.from('menu_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      queryClient.invalidateQueries({ queryKey: ['my-menu-items'] });
      toast.success('Category deleted');
    },
    onError: () => toast.error('Failed to delete category'),
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categories: { id: string; sort_order: number }[]) => {
      for (const cat of categories) {
        await supabase.from('menu_categories').update({ sort_order: cat.sort_order }).eq('id', cat.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
    },
  });
}

// Aliases for backward compat
export const useCreateMenuItem = useAddMenuItem;
export const useMyMenuCategories = useMenuCategories;
export const useCreateMenuCategory = useAddCategory;
export const useDeleteMenuCategory = useDeleteCategory;

// Create restaurant hook used by Settings
export function useCreateRestaurant() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; address: string; city?: string; area?: string; university_name?: string }) => {
      const { error } = await supabase.from('restaurants').insert({
        owner_id: user!.id,
        name: data.name,
        address: data.address,
        city: data.city || null,
        area: data.area || null,
        university_name: data.university_name || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-restaurant'] });
      toast.success('Restaurant created');
    },
    onError: () => toast.error('Failed to create restaurant'),
  });
}

// Restaurant payout hooks
export function useMyPayouts() {
  const { data: restaurant } = useMyRestaurant();

  return useQuery({
    queryKey: ['my-payouts', restaurant?.id],
    queryFn: async () => {
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('restaurant_id', restaurant!.id);

      const orderIds = orders?.map(o => o.id) || [];
      if (orderIds.length === 0) return [];

      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .in('order_id', orderIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!restaurant?.id,
  });
}

export function useMyPayoutSummary() {
  const { data: restaurant } = useMyRestaurant();

  return useQuery({
    queryKey: ['my-payout-summary', restaurant?.id],
    queryFn: async () => {
      const platformFee = 4;

      // Get completed orders with payment method
      const { data: completedOrders } = await supabase
        .from('orders')
        .select('id, total_amount, payment_method, created_at')
        .eq('restaurant_id', restaurant!.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      // Get payouts
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('restaurant_id', restaurant!.id);
      const orderIds = orders?.map(o => o.id) || [];

      const { data: allPayouts } = orderIds.length > 0
        ? await supabase.from('payouts').select('*').in('order_id', orderIds)
        : { data: [] };

      const paidOrderIds = new Set(allPayouts?.map(p => p.order_id) || []);

      let totalEarned = 0;
      let totalPaid = 0;
      let pendingAmount = 0;
      let onlineOrders = 0;
      let codOrders = 0;
      let codDeductions = 0;
      let onlineCredits = 0;

      (completedOrders || []).forEach(order => {
        const isCod = order.payment_method === 'cod';
        const itemTotal = Math.max(Number(order.total_amount) - platformFee, 0);
        const commission = Math.round(itemTotal * 0.10 * 100) / 100;
        const netEarning = itemTotal - commission;
        totalEarned += netEarning;

        if (isCod) {
          codOrders++;
          codDeductions += platformFee + commission;
        } else {
          onlineOrders++;
          onlineCredits += netEarning;
        }

        if (paidOrderIds.has(order.id)) {
          const payout = allPayouts?.find(p => p.order_id === order.id);
          totalPaid += Number(payout?.restaurant_amount || 0);
        } else {
          pendingAmount += isCod ? -(platformFee + commission) : netEarning;
        }
      });

      // Weekly growth data
      const weeklyData: Record<string, { week: string; earned: number; orders: number }> = {};
      (completedOrders || []).forEach(order => {
        const weekStart = new Date(order.created_at);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { week: weekKey, earned: 0, orders: 0 };
        }
        const itemTotal = Math.max(Number(order.total_amount) - platformFee, 0);
        weeklyData[weekKey].earned += itemTotal * 0.9;
        weeklyData[weekKey].orders++;
      });

      const weeklyGrowth = Object.values(weeklyData).sort((a, b) => a.week.localeCompare(b.week)).slice(-8);

      return {
        totalEarned,
        totalPaid,
        pendingAmount,
        onlineOrders,
        codOrders,
        codDeductions,
        onlineCredits,
        weeklyGrowth,
        completedOrders: completedOrders || [],
      };
    },
    enabled: !!restaurant?.id,
  });
}
