import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  name: string;
  phone: string | null;
  username: string | null;
  campus: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile(userId?: string) {
  const { user } = useAuth();
  const targetId = userId || user?.id;

  return useQuery({
    queryKey: ['profile', targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId!)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!targetId,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, 'name' | 'phone' | 'username' | 'campus' | 'avatar_url'>>) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update profile');
    },
  });
}

export function useUserStats(userId?: string) {
  const { user } = useAuth();
  const targetId = userId || user?.id;

  return useQuery({
    queryKey: ['user-stats', targetId],
    queryFn: async () => {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', targetId!)
        .eq('status', 'completed');
      return { totalOrders: count || 0 };
    },
    enabled: !!targetId,
  });
}
