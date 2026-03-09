import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  user_id: string;
  total_coins: number;
  name: string;
  username: string | null;
  avatar_url: string | null;
  campus: string | null;
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard-top10'],
    queryFn: async () => {
      // Get top 10 wallets
      const { data: wallets, error: wErr } = await supabase
        .from('user_wallet')
        .select('user_id, total_coins')
        .order('total_coins', { ascending: false })
        .limit(10);

      if (wErr) throw wErr;
      if (!wallets || wallets.length === 0) return [];

      const userIds = wallets.map(w => w.user_id);
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url, campus')
        .in('id', userIds);

      if (pErr) throw pErr;

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      return wallets
        .filter(w => w.total_coins > 0)
        .map(w => {
          const p = profileMap.get(w.user_id);
          return {
            user_id: w.user_id,
            total_coins: w.total_coins,
            name: p?.name || 'Unknown',
            username: p?.username || null,
            avatar_url: p?.avatar_url || null,
            campus: p?.campus || null,
          } as LeaderboardEntry;
        });
    },
    staleTime: 60_000,
  });
}
