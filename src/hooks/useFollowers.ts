import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useFollowerCounts(userId: string) {
  return useQuery({
    queryKey: ['follower-counts', userId],
    queryFn: async () => {
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
      ]);
      return { followers: followers || 0, following: following || 0 };
    },
    enabled: !!userId,
  });
}

export function useIsFollowing(targetUserId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['is-following', user?.id, targetUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', user!.id)
        .eq('following_id', targetUserId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id && !!targetUserId && user.id !== targetUserId,
  });
}

export function useToggleFollow() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetUserId, isFollowing }: { targetUserId: string; isFollowing: boolean }) => {
      if (isFollowing) {
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user!.id)
          .eq('following_id', targetUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('followers')
          .insert({ follower_id: user!.id, following_id: targetUserId });
        if (error) throw error;
      }
    },
    onSuccess: (_, { targetUserId, isFollowing }) => {
      queryClient.invalidateQueries({ queryKey: ['is-following'] });
      queryClient.invalidateQueries({ queryKey: ['follower-counts'] });
      toast.success(isFollowing ? '👋 Unfollowed' : '🎉 You are now following this user!');
    },
    onError: () => toast.error('Action failed'),
  });
}

export function useFollowersList(userId: string, type: 'followers' | 'following') {
  return useQuery({
    queryKey: ['followers-list', userId, type],
    queryFn: async () => {
      if (type === 'followers') {
        const { data, error } = await supabase
          .from('followers')
          .select('follower_id, created_at')
          .eq('following_id', userId);
        if (error) throw error;

        const userIds = data.map(d => d.follower_id);
        if (userIds.length === 0) return [];

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, username, avatar_url')
          .in('id', userIds);
        return profiles || [];
      } else {
        const { data, error } = await supabase
          .from('followers')
          .select('following_id, created_at')
          .eq('follower_id', userId);
        if (error) throw error;

        const userIds = data.map(d => d.following_id);
        if (userIds.length === 0) return [];

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, username, avatar_url')
          .in('id', userIds);
        return profiles || [];
      }
    },
    enabled: !!userId,
  });
}
