import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useWallet, useCoinTransactions } from '@/hooks/useWallet';
import { CoinTransfer } from '@/components/customer/CoinTransfer';
import { Sparkles, ArrowDownLeft, ArrowUpRight, Send, Info, Gift, ShoppingBag, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function Coins() {
  const { data: wallet } = useWallet();
  const { data: transactions } = useCoinTransactions();

  const totalEarned = transactions?.filter(t => t.type === 'earn').reduce((s, t) => s + t.coins, 0) || 0;
  const totalRedeemed = transactions?.filter(t => t.type === 'redeem').reduce((s, t) => s + t.coins, 0) || 0;
  const totalSent = transactions?.filter(t => t.type === 'transfer').reduce((s, t) => s + t.coins, 0) || 0;

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto pb-28 md:pb-6 space-y-5">
        {/* Balance Card */}
        <motion.div
          className="rounded-3xl gradient-primary p-6 text-primary-foreground shadow-lg relative overflow-hidden"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 -ml-8 -mb-8" />
          <p className="text-sm opacity-80 font-medium">Your Points Balance</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-display font-bold">{wallet?.total_coins || 0}</span>
            <span className="text-lg opacity-70">pts</span>
          </div>
          <p className="text-xs mt-2 opacity-70">1 point = ₹1 • Redeem on your next order</p>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-lg font-bold">{totalEarned}</p>
              <p className="text-[10px] opacity-80">Earned</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-lg font-bold">{totalRedeemed}</p>
              <p className="text-[10px] opacity-80">Redeemed</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-lg font-bold">{totalSent}</p>
              <p className="text-[10px] opacity-80">Shared</p>
            </div>
          </div>
        </motion.div>

        {/* Share Coins */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <CoinTransfer availableCoins={wallet?.total_coins || 0} />
        </motion.div>

        {/* How Points Work */}
        <motion.div
          className="bg-card rounded-2xl border border-border p-4 space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            <h3 className="font-display font-bold text-sm">How Points Work</h3>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShoppingBag className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold">Earn 3% on every order</p>
                <p className="text-xs text-muted-foreground">Points are credited automatically when your order is completed.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Gift className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Redeem on next order</p>
                <p className="text-xs text-muted-foreground">Use points to pay (1 pt = ₹1). Max 50% of order subtotal.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-social/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="w-4 h-4 text-social" />
              </div>
              <div>
                <p className="text-sm font-semibold">Share with friends</p>
                <p className="text-xs text-muted-foreground">Send points to any friend using their @username. Minimum 10 pts per transfer.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Rules */}
        <div className="bg-secondary/50 rounded-2xl p-4 space-y-2">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Guidelines</h4>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li>• Points are for in-app use only — they cannot be withdrawn as cash.</li>
            <li>• Minimum 10 points per transfer to friends.</li>
            <li>• Max 10 transfers per hour to prevent misuse.</li>
            <li>• Points earned never expire.</li>
            <li>• Munchii reserves the right to modify the rewards program.</li>
          </ul>
        </div>

        {/* Transaction History */}
        <section className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <h3 className="font-display font-bold text-sm">Points History</h3>
          {(!transactions || transactions.length === 0) ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No transactions yet. Order food to earn points!</p>
          ) : (
            <div className="space-y-1.5">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {tx.type === 'earn' ? (
                      <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                        <ArrowDownLeft className="w-4 h-4 text-accent" />
                      </div>
                    ) : tx.type === 'transfer' ? (
                      <div className="w-9 h-9 rounded-xl bg-social/10 flex items-center justify-center">
                        <Send className="w-4 h-4 text-social" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4 text-destructive" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold capitalize">
                        {tx.type === 'earn' ? 'Earned' : tx.type === 'redeem' ? 'Redeemed' : 'Shared'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={cn('text-sm font-bold', tx.type === 'earn' ? 'text-accent' : 'text-destructive')}>
                    {tx.type === 'earn' ? '+' : '-'}{tx.coins} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
