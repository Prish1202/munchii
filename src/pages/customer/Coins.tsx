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
        {/* Balance Card */}
        <motion.div
          className="rounded-3xl gradient-primary p-6 text-primary-foreground shadow-lg relative overflow-hidden"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 -ml-8 -mb-8" />
          
          {/* Floating coin animation */}
          <motion.div
            className="absolute top-4 right-4 text-3xl"
            animate={{ y: [0, -8, 0], rotateY: [0, 360] }}
            transition={{ y: { duration: 3, repeat: Infinity }, rotateY: { duration: 4, repeat: Infinity, ease: "linear" } }}
          >
            🪙
          </motion.div>

          <p className="text-sm opacity-80 font-medium">Your Points Balance</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-display font-bold">
              <AnimatedCoinCount value={balance} />
            </span>
            <span className="text-lg opacity-70">pts</span>
          </div>
          <p className="text-xs mt-2 opacity-70">1 point = ₹1 • Redeem on your next order</p>

          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: 'Earned', value: totalEarned },
              { label: 'Redeemed', value: totalRedeemed },
              { label: 'Shared', value: totalSent },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="bg-white/10 rounded-xl p-2.5 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-[10px] opacity-80">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Share Coins */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <CoinTransfer availableCoins={balance} />
        </motion.div>

        {/* How Points Work */}
        <motion.div
          className="bg-card rounded-2xl border border-border p-4 space-y-3"
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
                <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
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
            <div className="space-y-1.5">
              {transactions.map((tx, i) => (
                <motion.div
                  key={tx.id}
                  className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-secondary/50 transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div className="flex items-center gap-3">
                    {tx.type === 'earn' ? (
                      <motion.div
                        className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center"
                        whileHover={{ scale: 1.1 }}
                      >
                        <ArrowDownLeft className="w-4 h-4 text-accent" />
                      </motion.div>
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
                  <motion.span
                    className={cn('text-sm font-bold', tx.type === 'earn' ? 'text-accent' : 'text-destructive')}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                  >
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
