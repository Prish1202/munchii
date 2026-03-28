import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useBlockedUsers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['blocked-users', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('blocked_id, created_at')
        .eq('blocker_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useIsBlocked(targetUserId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-blocked', user?.id, targetUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', user!.id)
        .eq('blocked_id', targetUserId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user?.id && !!targetUserId && user?.id !== targetUserId,
  });
}

export function useToggleBlock() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetUserId, isBlocked }: { targetUserId: string; isBlocked: boolean }) => {
      if (isBlocked) {
        const { error } = await supabase
          .from('blocked_users')
          .delete()
          .eq('blocker_id', user!.id)
          .eq('blocked_id', targetUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blocked_users')
          .insert({ blocker_id: user!.id, blocked_id: targetUserId });
        if (error) throw error;
      }
    },
    onSuccess: (_, { targetUserId, isBlocked }) => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      queryClient.invalidateQueries({ queryKey: ['is-blocked', user?.id, targetUserId] });
      toast.success(isBlocked ? 'User unblocked' : 'User blocked');
    },
    onError: () => {
      toast.error('Failed to update block status');
    },
  });
}
