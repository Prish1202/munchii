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
  created_at: string;
  updated_at: string;
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

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  const { data: restaurant } = useMyRestaurant();

  return useMutation({
    mutationFn: async (item: { name: string; price: number; image_url?: string; description?: string; discount_percent?: number }) => {
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
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; price?: number; available?: boolean; image_url?: string; description?: string; discount_percent?: number }) => {
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
