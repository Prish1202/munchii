import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AudienceEntry {
  user_id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  liked: boolean;
  viewed_at: string | null;
}

/**
 * Viewers + likers for a pulse.
 * RLS: the pulse owner sees everyone; a normal viewer only sees their own rows.
 */
export function usePulseAudience(pulseId: string | undefined, enabled = true) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['pulse-audience', pulseId],
    enabled: !!pulseId && enabled,
    queryFn: async () => {
      const [{ data: views }, { data: likes }] = await Promise.all([
        supabase.from('pulse_views').select('viewer_id, created_at').eq('pulse_id', pulseId!),
        supabase.from('pulse_likes').select('user_id, created_at').eq('pulse_id', pulseId!),
      ]);

      const likeIds = new Set((likes || []).map((l: any) => l.user_id));
      const ids = [...new Set([...(views || []).map((v: any) => v.viewer_id), ...likeIds])];

      let profiles: any[] = [];
      if (ids.length) {
        const { data } = await supabase
          .from('profiles')
          .select('id, name, username, avatar_url')
          .in('id', ids);
        profiles = data || [];
      }
      const pmap = new Map(profiles.map((p) => [p.id, p]));
      const viewedAt = new Map((views || []).map((v: any) => [v.viewer_id, v.created_at]));

      const entries: AudienceEntry[] = ids.map((id) => ({
        user_id: id,
        name: pmap.get(id)?.name ?? null,
        username: pmap.get(id)?.username ?? null,
        avatar_url: pmap.get(id)?.avatar_url ?? null,
        liked: likeIds.has(id),
        viewed_at: viewedAt.get(id) ?? null,
      }));

      entries.sort((a, b) => (b.viewed_at || '').localeCompare(a.viewed_at || ''));

      return {
        entries,
        likeCount: likeIds.size,
        viewCount: (views || []).length,
        likedByMe: !!user && likeIds.has(user.id),
      };
    },
    staleTime: 10_000,
  });

  const toggleLike = useMutation({
    mutationFn: async (liked: boolean) => {
      if (!user || !pulseId) throw new Error('Please sign in');
      if (liked) {
        const { error } = await supabase
          .from('pulse_likes')
          .delete()
          .eq('pulse_id', pulseId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pulse_likes')
          .insert({ pulse_id: pulseId, user_id: user.id });
        if (error && !error.message.includes('duplicate')) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pulse-audience', pulseId] }),
    onError: (e: any) => toast.error(e.message || 'Could not update like'),
  });

  return {
    entries: query.data?.entries || [],
    likeCount: query.data?.likeCount || 0,
    viewCount: query.data?.viewCount || 0,
    likedByMe: query.data?.likedByMe || false,
    isLoading: query.isLoading,
    toggleLike,
  };
}
