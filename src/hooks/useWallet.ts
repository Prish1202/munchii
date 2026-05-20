import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Wallet {
  id: string;
  user_id: string;
  total_coins: number;
  updated_at: string;
}

export interface CoinTransaction {
  id: string;
  user_id: string;
  order_id: string | null;
  coins: number;
  type: 'earn' | 'redeem' | 'transfer';
  created_at: string;
}

export function useWallet(userId?: string) {
  const { user } = useAuth();
  const targetId = userId || user?.id;

  return useQuery({
    queryKey: ['wallet', targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_wallet')
        .select('*')
        .eq('user_id', targetId!)
        .maybeSingle();
      if (error) throw error;
      return data as Wallet | null;
    },
    enabled: !!targetId,
  });
}

export function useCoinTransactions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['coin-transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coin_transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as CoinTransaction[];
    },
    enabled: !!user?.id,
  });
}

export function useRedeemCoins() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ coins, orderId }: { coins: number; orderId?: string }) => {
      const { error } = await supabase.rpc('redeem_coins', {
        _coins: coins,
        _order_id: orderId || null,
      });
      if (error) throw error;
      return { redeemed: coins };
    },
    onSuccess: ({ redeemed }) => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['coin-transactions'] });
      toast.success(`🪙 ${redeemed} points redeemed on this order!`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to redeem coins');
    },
  });
}
