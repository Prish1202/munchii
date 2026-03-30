import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  city: string | null;
  is_active: boolean;
  created_at: string;
  owner_id: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  price: number;
  available: boolean;
  created_at: string;
  image_url?: string | null;
  description?: string | null;
  discount_percent?: number | null;
  category_id?: string | null;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
}

export function useMenuCategories(restaurantId: string) {
  return useQuery({
    queryKey: ['menu-categories', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as MenuCategory[];
    },
    enabled: !!restaurantId,
  });
}

export function useRestaurants(city?: string | null) {
  return useQuery({
    queryKey: ['restaurants', city],
    queryFn: async () => {
      let query = supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (city) {
        query = query.ilike('city', city);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Restaurant[];
    },
  });
}

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Restaurant | null;
    },
    enabled: !!id,
  });
}

export function useMenuItems(restaurantId: string) {
  return useQuery({
    queryKey: ['menu-items', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('available', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as MenuItem[];
    },
    enabled: !!restaurantId,
  });
}
