import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useWallet, useCoinTransactions } from '@/hooks/useWallet';
import { CoinTransfer } from '@/components/customer/CoinTransfer';
import { Sparkles, ArrowDownLeft, ArrowUpRight, Send, Info, Gift, ShoppingBag, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

function AnimatedCoinCount({ value }: { value: number }) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toString());
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) motionVal.set(value);
  }, [inView, value, motionVal]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

export default function Coins() {
  const { data: wallet } = useWallet();
  const { data: transactions } = useCoinTransactions();

  const totalEarned = transactions?.filter(t => t.type === 'earn').reduce((s, t) => s + t.coins, 0) || 0;
  const totalRedeemed = transactions?.filter(t => t.type === 'redeem').reduce((s, t) => s + t.coins, 0) || 0;
  const totalSent = transactions?.filter(t => t.type === 'transfer').reduce((s, t) => s + t.coins, 0) || 0;
  const balance = wallet?.total_coins || 0;

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto pb-28 md:pb-6 space-y-5">
        <motion.div
          className="rounded-[2rem] gradient-primary p-6 text-primary-foreground shadow-soft relative overflow-hidden"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100 }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary-foreground/10 -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary-foreground/10 -ml-8 -mb-8" />

          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute text-xl"
              initial={{ opacity: 0, y: 28, x: 24 + i * 16 }}
              animate={{ opacity: [0, 1, 0], y: [28, -18], x: [24 + i * 16, 14 + i * 20] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.4, delay: i * 0.3 }}
            >
              🪙
            </motion.div>
          ))}

          <p className="text-sm opacity-80 font-medium">Your Points Balance</p>
          <div className="flex items-baseline gap-2 mt-1">
            <motion.span
              className="text-4xl font-display font-bold"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.55, repeat: Infinity, repeatDelay: 2.4 }}
            >
              <AnimatedCoinCount value={balance} />
            </motion.span>
            <span className="text-lg opacity-70">pts</span>
          </div>
          <p className="text-xs mt-2 opacity-80">1 point = ₹1 • Redeem on your next order</p>

          <div className="mt-5 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/75">
              <span>Reward Level</span>
              <span>{Math.min(balance, 500)}/500</span>
            </div>
            <div className="h-3 rounded-full bg-primary-foreground/20 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary-foreground"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((balance / 500) * 100, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-primary-foreground/80">Keep ordering to unlock the next badge tier faster.</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: 'Earned', value: totalEarned },
              { label: 'Redeemed', value: totalRedeemed },
              { label: 'Shared', value: totalSent },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="bg-primary-foreground/12 rounded-2xl p-3 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-[10px] opacity-80 uppercase tracking-[0.14em]">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <CoinTransfer availableCoins={balance} />
        </motion.div>

        <motion.div
          className="gradient-surface rounded-[1.7rem] border border-border p-4 space-y-3 shadow-soft"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            <h3 className="font-display font-bold text-sm">How Points Work</h3>
          </div>
          <div className="space-y-2.5">
            {[
              { icon: ShoppingBag, color: 'text-accent', bg: 'bg-accent/10', title: 'Earn 3% on every order', desc: 'Points are credited automatically when your order is completed.' },
              { icon: Gift, color: 'text-primary', bg: 'bg-primary/10', title: 'Redeem on next order', desc: 'Use points to pay (1 pt = ₹1). Max 50% of order subtotal.' },
              { icon: Users, color: 'text-social', bg: 'bg-social/10', title: 'Share with friends', desc: 'Send points to any friend using their @username. Minimum 10 pts per transfer.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <div className={`w-9 h-9 rounded-2xl ${item.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="gradient-surface rounded-[1.7rem] border border-border p-4 space-y-2 shadow-soft">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.18em]">Guidelines</h4>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li>• Points are for in-app use only — they cannot be withdrawn as cash.</li>
            <li>• Minimum 10 points per transfer to friends.</li>
            <li>• Max 10 transfers per hour to prevent misuse.</li>
            <li>• Points earned never expire.</li>
            <li>• Munchii reserves the right to modify the rewards program.</li>
          </ul>
        </div>

        <section className="gradient-surface rounded-[1.7rem] border border-border p-4 space-y-3 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display font-bold text-sm">Points History</h3>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">Live wallet activity</span>
          </div>
          {(!transactions || transactions.length === 0) ? (
            <div className="text-center py-8">
              <motion.div
                className="text-4xl mb-3"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🪙
              </motion.div>
              <p className="text-sm text-muted-foreground">No transactions yet. Order food to earn points!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx, i) => (
                <motion.div
                  key={tx.id}
                  className="flex items-center justify-between py-3 px-3 rounded-2xl bg-card/80 border border-border/70 transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div className="flex items-center gap-3">
                    {tx.type === 'earn' ? (
                      <motion.div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center" whileHover={{ scale: 1.1 }}>
                        <ArrowDownLeft className="w-4 h-4 text-accent" />
                      </motion.div>
                    ) : tx.type === 'transfer' ? (
                      <div className="w-10 h-10 rounded-2xl bg-social/10 flex items-center justify-center">
                        <Send className="w-4 h-4 text-social" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-destructive/10 flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4 text-destructive" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold capitalize">{tx.type === 'earn' ? 'Earned' : tx.type === 'redeem' ? 'Redeemed' : 'Shared'}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <motion.span className={cn('text-sm font-bold', tx.type === 'earn' ? 'text-accent' : 'text-destructive')} initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                    {tx.type === 'earn' ? '+' : '-'}{tx.coins} pts
                  </motion.span>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
