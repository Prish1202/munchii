import { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PulseAuthor {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export interface Pulse {
  id: string;
  user_id: string;
  media_type: 'image' | 'video' | 'text';
  media_url: string | null;
  text_content: string | null;
  background_color: string | null;
  created_at: string;
  expires_at: string;
  author?: PulseAuthor;
}

export interface PulseGroup {
  user_id: string;
  author?: PulseAuthor;
  pulses: Pulse[];
  latestAt: string;
}

export function usePulses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['pulses'],
    queryFn: async (): Promise<Pulse[]> => {
      const { data, error } = await supabase
        .from('pulses')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true });
      if (error) throw error;

      const rows = (data || []) as Pulse[];
      const ids = [...new Set(rows.map((r) => r.user_id))];
      if (ids.length === 0) return rows;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .in('id', ids);

      const map = new Map((profiles || []).map((p: any) => [p.id, p as PulseAuthor]));
      return rows.map((r) => ({ ...r, author: map.get(r.user_id) }));
    },
    staleTime: 30_000,
  });

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('pulses-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pulses' }, () => {
        queryClient.invalidateQueries({ queryKey: ['pulses'] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Drop expired pulses from cache as time passes
  useEffect(() => {
    const id = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['pulses'] });
    }, 60_000);
    return () => clearInterval(id);
  }, [queryClient]);

  const { myPulses, groups } = useMemo(() => {
    const all = query.data || [];
    const mine = all.filter((p) => p.user_id === user?.id);
    const others = all.filter((p) => p.user_id !== user?.id);

    const byUser = new Map<string, PulseGroup>();
    for (const p of others) {
      const g = byUser.get(p.user_id) || {
        user_id: p.user_id,
        author: p.author,
        pulses: [],
        latestAt: p.created_at,
      };
      g.pulses.push(p);
      if (p.created_at > g.latestAt) g.latestAt = p.created_at;
      byUser.set(p.user_id, g);
    }

    return {
      myPulses: mine,
      groups: [...byUser.values()].sort((a, b) => b.latestAt.localeCompare(a.latestAt)),
    };
  }, [query.data, user?.id]);

  const createPulse = useMutation({
    mutationFn: async (input: {
      media_type: 'image' | 'video' | 'text';
      media_url?: string | null;
      text_content?: string | null;
      background_color?: string | null;
    }) => {
      if (!user) throw new Error('Please sign in to post a Pulse');
      const { error } = await supabase.from('pulses').insert({
        user_id: user.id,
        media_type: input.media_type,
        media_url: input.media_url ?? null,
        text_content: input.text_content ?? null,
        background_color: input.background_color ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pulses'] });
      toast.success('Pulse posted — live for 24 hours');
    },
    onError: (e: any) => toast.error(e.message || 'Could not post Pulse'),
  });

  const deletePulse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pulses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pulses'] });
      toast.success('Pulse removed');
    },
    onError: (e: any) => toast.error(e.message || 'Could not remove Pulse'),
  });

  const markViewed = async (pulseId: string) => {
    if (!user) return;
    await supabase
      .from('pulse_views')
      .upsert({ pulse_id: pulseId, viewer_id: user.id }, { onConflict: 'pulse_id,viewer_id' });
  };

  return {
    isLoading: query.isLoading,
    myPulses,
    groups,
    createPulse,
    deletePulse,
    markViewed,
  };
}

export function timeLeft(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours}h left`;
  return `${Math.max(1, Math.floor(ms / 60_000))}m left`;
}
