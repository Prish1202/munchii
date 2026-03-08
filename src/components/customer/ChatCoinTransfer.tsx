import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface ChatCoinTransferProps {
  recipientId: string;
  recipientName: string;
  recipientUsername: string | null;
  availableCoins: number;
  onClose: () => void;
  onTransferSuccess?: (coins: number) => void;
}

export function ChatCoinTransfer({
  recipientId,
  recipientName,
  recipientUsername,
  availableCoins,
  onClose,
  onTransferSuccess,
}: ChatCoinTransferProps) {
  const [coins, setCoins] = useState('');
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();

  const coinsNum = parseInt(coins, 10);
  const isValid = !isNaN(coinsNum) && coinsNum >= 10 && coinsNum <= availableCoins;

  const handleTransfer = async () => {
    if (!isValid || !recipientUsername) {
      toast.error(recipientUsername ? 'Invalid amount' : 'Recipient needs a username');
      return;
    }
    setIsSending(true);
    try {
      const res = await supabase.functions.invoke('transfer-coins', {
        body: { username: recipientUsername, coins: coinsNum },
      });

      if (res.error) throw new Error(res.error.message);
      const result = res.data;
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Sent ${coinsNum} coins to ${recipientName}!`);
        onTransferSuccess?.(coinsNum);
        setCoins('');
        onClose();
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
        queryClient.invalidateQueries({ queryKey: ['coin-transactions'] });
      }
    } catch (err: any) {
      toast.error(err.message || 'Transfer failed');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-3 rounded-xl border border-border bg-secondary/30 space-y-2 mb-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">
          Send coins to {recipientName}
        </p>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Balance: {availableCoins} coins</p>
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="Min 10"
          value={coins}
          onChange={(e) => setCoins(e.target.value)}
          min={10}
          max={availableCoins}
          className="flex-1"
        />
        <Button onClick={handleTransfer} disabled={!isValid || isSending} size="sm">
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
      {coins && coinsNum < 10 && <p className="text-xs text-destructive">Minimum 10 coins</p>}
      {coins && coinsNum > availableCoins && <p className="text-xs text-destructive">Exceeds balance</p>}
    </div>
  );
}
