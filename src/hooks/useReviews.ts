import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface OrderReview {
  id: string;
  order_id: string;
  customer_id: string;
  restaurant_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
}

export function useRestaurantRating(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['restaurant-rating', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_restaurant_avg_rating', { _restaurant_id: restaurantId! });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return {
        avgRating: Number(row?.avg_rating) || 0,
        reviewCount: Number(row?.review_count) || 0,
      };
    },
    enabled: !!restaurantId,
  });
}

export function useOrderReview(orderId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['order-review', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_reviews')
        .select('*')
        .eq('order_id', orderId!)
        .eq('customer_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as OrderReview | null;
    },
    enabled: !!orderId && !!user?.id,
  });
}

export function useSubmitReview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      restaurantId,
      rating,
      reviewText,
    }: {
      orderId: string;
      restaurantId: string;
      rating: number;
      reviewText?: string;
    }) => {
      const { error } = await supabase.from('order_reviews').insert({
        order_id: orderId,
        customer_id: user!.id,
        restaurant_id: restaurantId,
        rating,
        review_text: reviewText || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['order-review', vars.orderId] });
      queryClient.invalidateQueries({ queryKey: ['restaurant-rating', vars.restaurantId] });
      toast.success('Thanks for your review!');
    },
    onError: () => {
      toast.error('Failed to submit review');
    },
  });
}

export function useRestaurantReviews(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['restaurant-reviews', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_reviews')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as OrderReview[];
    },
    enabled: !!restaurantId,
  });
}
