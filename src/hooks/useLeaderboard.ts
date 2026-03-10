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
      const { data, error } = await supabase.rpc('get_leaderboard_top10');
      if (error) throw error;
      return (data || []) as LeaderboardEntry[];
    },
    staleTime: 60_000,
  });
}
