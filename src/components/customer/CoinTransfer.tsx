import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface CoinTransferProps {
  availableCoins: number;
  prefillUsername?: string;
}

interface ProfileSuggestion {
  id: string;
  username: string;
  name: string;
  avatar_url: string | null;
}

export function CoinTransfer({ availableCoins, prefillUsername }: CoinTransferProps) {
  const [username, setUsername] = useState(prefillUsername || '');
  const [coins, setCoins] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [expanded, setExpanded] = useState(!!prefillUsername);
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const queryClient = useQueryClient();
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const coinsNum = parseInt(coins, 10);
  const isValid =
    username.trim().length > 0 &&
    !isNaN(coinsNum) &&
    coinsNum >= 10 &&
    coinsNum <= availableCoins;

  // Search usernames as user types
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = username.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, username, name, avatar_url')
        .not('username', 'is', null)
        .ilike('username', `%${q}%`)
        .limit(5);
      setSuggestions((data as ProfileSuggestion[]) || []);
      setShowSuggestions(true);
      setSearchLoading(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [username]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectSuggestion = (profile: ProfileSuggestion) => {
    setUsername(profile.username);
    setShowSuggestions(false);
  };

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
        toast.success(`🎁 ${coins} points sent to @${username}!`);
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
      <div className="relative" ref={suggestionsRef}>
        <Input
          placeholder="Recipient's @username"
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
          maxLength={50}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />
        {searchLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((profile) => (
              <button
                key={profile.id}
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/60 transition-colors text-left"
                onClick={() => selectSuggestion(profile)}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                  ) : (
                    profile.name?.charAt(0)?.toUpperCase() || '?'
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{profile.name}</p>
                  <p className="text-xs text-muted-foreground">@{profile.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
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
