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
        .order('name', { ascending: true });

      if (error) throw error;
      return data as MenuItem[];
    },
    enabled: !!restaurant?.id,
  });
}

export function useMyMenuCategories() {
  const { data: restaurant } = useMyRestaurant();

  return useQuery({
    queryKey: ['my-menu-categories', restaurant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurant!.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as MenuCategory[];
    },
    enabled: !!restaurant?.id,
  });
}

export function useCreateMenuCategory() {
  const queryClient = useQueryClient();
  const { data: restaurant } = useMyRestaurant();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data: existing } = await supabase
        .from('menu_categories')
        .select('sort_order')
        .eq('restaurant_id', restaurant!.id)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

      const { data, error } = await supabase
        .from('menu_categories')
        .insert({ restaurant_id: restaurant!.id, name, sort_order: nextOrder } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-menu-categories'] });
      toast.success('Category added');
    },
    onError: () => toast.error('Failed to add category'),
  });
}

export function useUpdateMenuCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('menu_categories')
        .update({ name } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-menu-categories'] });
      toast.success('Category updated');
    },
    onError: () => toast.error('Failed to update category'),
  });
}

export function useDeleteMenuCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-menu-categories'] });
      queryClient.invalidateQueries({ queryKey: ['my-menu-items'] });
      toast.success('Category deleted');
    },
    onError: () => toast.error('Failed to delete category'),
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  const { data: restaurant } = useMyRestaurant();

  return useMutation({
    mutationFn: async (item: { name: string; price: number; image_url?: string; description?: string; discount_percent?: number; category_id?: string }) => {
      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          restaurant_id: restaurant!.id,
          name: item.name,
          price: item.price,
          available: true,
          image_url: item.image_url || null,
          description: item.description || null,
          discount_percent: item.discount_percent || 0,
          category_id: item.category_id || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-menu-items'] });
      toast.success('Menu item added');
    },
    onError: (error) => {
      console.error('Failed to add menu item:', error);
      toast.error('Failed to add menu item');
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; price?: number; available?: boolean; image_url?: string; description?: string; discount_percent?: number; category_id?: string | null }) => {
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-menu-items'] });
      toast.success('Menu item updated');
    },
    onError: (error) => {
      console.error('Failed to update menu item:', error);
      toast.error('Failed to update menu item');
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-menu-items'] });
      toast.success('Menu item deleted');
    },
    onError: (error) => {
      console.error('Failed to delete menu item:', error);
      toast.error('Failed to delete menu item');
    },
  });
}

export function useCreateRestaurant() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (restaurant: { name: string; address: string }) => {
      const { data, error } = await supabase
        .from('restaurants')
        .insert({
          owner_id: user!.id,
          name: restaurant.name,
          address: restaurant.address,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-restaurant'] });
      toast.success('Restaurant created!');
    },
    onError: (error) => {
      console.error('Failed to create restaurant:', error);
      toast.error('Failed to create restaurant');
    },
  });
}

// Restaurant payout hooks
export function useMyPayouts() {
  const { data: restaurant } = useMyRestaurant();

  return useQuery({
    queryKey: ['my-payouts', restaurant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter to only this restaurant's payouts by matching order_ids
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('restaurant_id', restaurant!.id);
      
      const orderIds = new Set(orders?.map(o => o.id) || []);
      return (data || []).filter((p: any) => orderIds.has(p.order_id));
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
      
      // Get completed orders
      const { data: completedOrders } = await supabase
        .from('orders')
        .select('id, total_amount')
        .eq('restaurant_id', restaurant!.id)
        .eq('status', 'completed');

      // Get payouts
      const { data: allPayouts } = await supabase
        .from('payouts')
        .select('order_id, restaurant_amount');

      const paidOrderIds = new Set(allPayouts?.map(p => p.order_id) || []);

      let totalEarned = 0;
      let totalPaid = 0;
      let pendingAmount = 0;

      (completedOrders || []).forEach(order => {
        const itemTotal = Math.max(Number(order.total_amount) - platformFee, 0);
        const netEarning = itemTotal * 0.9;
        totalEarned += netEarning;

        if (paidOrderIds.has(order.id)) {
          const payout = allPayouts?.find(p => p.order_id === order.id);
          totalPaid += Number(payout?.restaurant_amount || 0);
        } else {
          pendingAmount += netEarning;
        }
      });

      return { totalEarned, totalPaid, pendingAmount };
    },
    enabled: !!restaurant?.id,
  });
}