import { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Club {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  city: string | null;
  cover_url: string | null;
  is_private: boolean;
  created_by: string;
  created_at: string;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: 'admin' | 'member';
}

export interface ClubWithMeta extends Club {
  memberCount: number;
  myRole: 'admin' | 'member' | null;
}

export function useClubs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const clubsQuery = useQuery({
    queryKey: ['clubs'],
    queryFn: async (): Promise<Club[]> => {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Club[];
    },
    staleTime: 30_000,
  });

  const membersQuery = useQuery({
    queryKey: ['club-members'],
    queryFn: async (): Promise<ClubMember[]> => {
      const { data, error } = await supabase.from('club_members').select('*');
      if (error) throw error;
      return (data || []) as ClubMember[];
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('clubs-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clubs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['clubs'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'club_members' }, () => {
        queryClient.invalidateQueries({ queryKey: ['club-members'] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const clubs: ClubWithMeta[] = useMemo(() => {
    const members = membersQuery.data || [];
    return (clubsQuery.data || []).map((c) => {
      const clubMembers = members.filter((m) => m.club_id === c.id);
      return {
        ...c,
        memberCount: clubMembers.length,
        myRole: clubMembers.find((m) => m.user_id === user?.id)?.role ?? null,
      };
    });
  }, [clubsQuery.data, membersQuery.data, user?.id]);

  const myClubs = useMemo(() => clubs.filter((c) => c.myRole), [clubs]);

  const createClub = useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      category?: string;
      city?: string;
      cover_url?: string | null;
      is_private?: boolean;
    }) => {
      if (!user) throw new Error('Please sign in to create a club');
      const { data, error } = await supabase
        .from('clubs')
        .insert({
          name: input.name.trim(),
          description: input.description?.trim() || null,
          category: input.category || null,
          city: input.city || null,
          cover_url: input.cover_url || null,
          is_private: input.is_private ?? false,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      const { error: memberError } = await supabase
        .from('club_members')
        .insert({ club_id: data.id, user_id: user.id, role: 'admin' });
      if (memberError) throw memberError;
      return data as Club;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['club-members'] });
      toast.success('Club created — you are the admin');
    },
    onError: (e: any) => toast.error(e.message || 'Could not create club'),
  });

  const joinClub = useMutation({
    mutationFn: async (clubId: string) => {
      if (!user) throw new Error('Please sign in to join a club');
      const { error } = await supabase
        .from('club_members')
        .insert({ club_id: clubId, user_id: user.id, role: 'member' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-members'] });
      toast.success('Joined club');
    },
    onError: (e: any) => toast.error(e.message || 'Could not join club'),
  });

  const leaveClub = useMutation({
    mutationFn: async (clubId: string) => {
      if (!user) throw new Error('Not signed in');
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-members'] });
      toast.success('Left club');
    },
    onError: (e: any) => toast.error(e.message || 'Could not leave club'),
  });

  const deleteClub = useMutation({
    mutationFn: async (clubId: string) => {
      const { error } = await supabase.from('clubs').delete().eq('id', clubId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['club-members'] });
      toast.success('Club deleted');
    },
    onError: (e: any) => toast.error(e.message || 'Could not delete club'),
  });

  return {
    clubs,
    myClubs,
    isLoading: clubsQuery.isLoading || membersQuery.isLoading,
    createClub,
    joinClub,
    leaveClub,
    deleteClub,
  };
}
