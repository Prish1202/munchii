import { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ClubMessage {
  id: string;
  club_id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  media_name: string | null;
  media_size: number | null;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export function useClub(clubId?: string) {
  return useQuery({
    queryKey: ['club', clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!clubId,
  });
}

export function useClubMembership(clubId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['club-membership', clubId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_members')
        .select('*')
        .eq('club_id', clubId!)
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as { role: 'admin' | 'member' } | null;
    },
    enabled: !!clubId && !!user?.id,
  });
}

export function useClubMessages(clubId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['club-messages', clubId],
    queryFn: async (): Promise<ClubMessage[]> => {
      const { data, error } = await supabase
        .from('club_messages')
        .select('*')
        .eq('club_id', clubId!)
        .order('created_at', { ascending: true })
        .limit(500);
      if (error) throw error;

      const rows = (data || []) as ClubMessage[];
      const senderIds = Array.from(new Set(rows.map((r) => r.sender_id)));
      if (senderIds.length === 0) return rows;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .in('id', senderIds);

      const map = new Map((profiles || []).map((p: any) => [p.id, p]));
      return rows.map((r) => ({ ...r, sender: map.get(r.sender_id) ?? null }));
    },
    enabled: !!clubId,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!clubId) return;
    const channel = supabase
      .channel(`club-messages-${clubId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'club_messages', filter: `club_id=eq.${clubId}` },
        () => queryClient.invalidateQueries({ queryKey: ['club-messages', clubId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [clubId, queryClient]);

  return query;
}

export function useSendClubMessage(clubId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      content?: string;
      media_url?: string | null;
      media_type?: string | null;
      media_name?: string | null;
      media_size?: number | null;
    }) => {
      if (!user) throw new Error('Please sign in');
      if (!clubId) throw new Error('Missing club');
      const { error } = await supabase.from('club_messages').insert({
        club_id: clubId,
        sender_id: user.id,
        content: input.content?.trim() || null,
        media_url: input.media_url || null,
        media_type: input.media_type || null,
        media_name: input.media_name || null,
        media_size: input.media_size ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-messages', clubId] });
    },
    onError: (e: any) => toast.error(e.message || 'Could not send message'),
  });
}

export function useDeleteClubMessage(clubId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase.from('club_messages').delete().eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-messages', clubId] });
      toast.success('Message deleted');
    },
    onError: (e: any) => toast.error(e.message || 'Could not delete message'),
  });
}

export function useClubMembers(clubId?: string) {
  const membersQuery = useQuery({
    queryKey: ['club-member-list', clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_members')
        .select('*')
        .eq('club_id', clubId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!clubId,
  });

  return useMemo(() => ({ members: membersQuery.data || [], isLoading: membersQuery.isLoading }), [membersQuery.data, membersQuery.isLoading]);
}
