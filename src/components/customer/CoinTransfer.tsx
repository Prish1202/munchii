import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface CoinTransferProps {
  availableCoins: number;
}

export function CoinTransfer({ availableCoins }: CoinTransferProps) {
  const [username, setUsername] = useState('');
  const [coins, setCoins] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const coinsNum = parseInt(coins, 10);
  const isValid =
    username.trim().length > 0 &&
    !isNaN(coinsNum) &&
    coinsNum >= 10 &&
    coinsNum <= availableCoins;

  const handleTransfer = async () => {
    if (!isValid) return;
    setIsSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await supabase.functions.invoke('transfer-coins', {
        body: { username: username.trim(), coins: coinsNum },
      });

      if (res.error) {
        throw new Error(res.error.message || 'Transfer failed');
      }

      const result = res.data;
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message || 'Coins sent!');
        setUsername('');
        setCoins('');
        setExpanded(false);
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
        queryClient.invalidateQueries({ queryKey: ['coin-transactions'] });
      }
    } catch (err: any) {
      toast.error(err.message || 'Transfer failed');
    } finally {
      setIsSending(false);
    }
  };

  if (!expanded) {
    return (
      <Button
        variant="outline"
        className="w-full rounded-xl"
        onClick={() => setExpanded(true)}
        disabled={availableCoins < 10}
      >
        <Send className="w-4 h-4 mr-2" /> Send Coins to Friend
      </Button>
    );
  }

  return (
    <div className="space-y-3 p-4 rounded-xl border border-border bg-secondary/30">
      <p className="text-sm font-semibold">Send Coins</p>
      <Input
        placeholder="Recipient's @username"
        value={username}
        onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
        maxLength={50}
      />
      <Input
        type="number"
        placeholder="Amount (min 10)"
        value={coins}
        onChange={(e) => setCoins(e.target.value)}
        min={10}
        max={availableCoins}
      />
      {coins && coinsNum < 10 && (
        <p className="text-xs text-destructive">Minimum transfer is 10 coins</p>
      )}
      {coins && coinsNum > availableCoins && (
        <p className="text-xs text-destructive">Exceeds your balance of {availableCoins}</p>
      )}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          className="flex-1"
          onClick={() => { setExpanded(false); setUsername(''); setCoins(''); }}
        >
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={handleTransfer}
          disabled={!isValid || isSending}
        >
          {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          Send {isValid ? `${coinsNum} 🪙` : ''}
        </Button>
      </div>
    </div>
  );
}
