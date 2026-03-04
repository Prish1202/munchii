import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile, useUserStats } from '@/hooks/useProfile';
import { useWallet, useCoinTransactions } from '@/hooks/useWallet';
import { useFollowerCounts } from '@/hooks/useFollowers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Coins, Edit2, ShoppingBag, TrendingUp, ArrowUpRight, ArrowDownLeft, Save, X, Send, Sparkles, Trophy, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CoinTransfer } from '@/components/customer/CoinTransfer';
import { useCustomerOrders } from '@/hooks/useOrders';
import { motion } from 'framer-motion';

export default function Profile() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: wallet } = useWallet();
  const { data: transactions } = useCoinTransactions();
  const { data: stats } = useUserStats();
  const { data: counts } = useFollowerCounts(user?.id || '');
  const { data: orders } = useCustomerOrders();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: '', campus: '', phone: '' });
  const [activeTab, setActiveTab] = useState<'coins' | 'activity'>('coins');

  const startEdit = () => {
    setForm({
      username: profile?.username || '',
      campus: profile?.campus || '',
      phone: profile?.phone || '',
    });
    setEditing(true);
  };

  const saveEdit = () => {
    updateProfile.mutate({
      username: form.username || null,
      campus: form.campus || null,
      phone: form.phone || null,
    });
    setEditing(false);
  };

  const completedOrders = orders?.filter(o => o.status === 'completed').slice(0, 10) || [];
  const coinLevel = (wallet?.total_coins || 0) >= 500 ? 'Gold' : (wallet?.total_coins || 0) >= 100 ? 'Silver' : 'Bronze';
  const levelEmoji = coinLevel === 'Gold' ? '🥇' : coinLevel === 'Silver' ? '🥈' : '🥉';

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto pb-28 md:pb-6 space-y-4">
        {/* Profile Header - Social style */}
        <motion.div
          className="relative overflow-hidden rounded-3xl border border-border"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Cover gradient */}
          <div className="h-24 gradient-social" />
          
          <div className="bg-card px-5 pb-5">
            {/* Avatar */}
            <div className="-mt-10 flex items-end justify-between">
              <Avatar className="w-20 h-20 border-4 border-card shadow-lg">
                <AvatarFallback className="gradient-primary text-primary-foreground text-2xl font-display font-bold">
                  {profile?.name?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" onClick={editing ? () => setEditing(false) : startEdit} className="rounded-xl mb-1">
                {editing ? <X className="w-4 h-4 mr-1" /> : <Edit2 className="w-4 h-4 mr-1" />}
                {editing ? 'Cancel' : 'Edit'}
              </Button>
            </div>
            
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-xl">{profile?.name}</h1>
                <span className="text-sm">{levelEmoji}</span>
              </div>
              {profile?.username && (
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                {profile?.campus && (
                  <Badge variant="secondary" className="text-xs rounded-lg">🎓 {profile.campus}</Badge>
                )}
                <Badge variant="secondary" className="text-xs rounded-lg bg-coin/10 text-coin-foreground border-coin/20">
                  {coinLevel} Member
                </Badge>
              </div>
              
              {/* Follow stats */}
              <div className="flex gap-5 mt-3 text-sm">
                <Link to="/customer/profile/followers" className="hover:text-primary transition-colors">
                  <span className="font-bold">{counts?.followers || 0}</span>{' '}
                  <span className="text-muted-foreground">Followers</span>
                </Link>
                <Link to="/customer/profile/following" className="hover:text-primary transition-colors">
                  <span className="font-bold">{counts?.following || 0}</span>{' '}
                  <span className="text-muted-foreground">Following</span>
                </Link>
              </div>
            </div>

            {editing && (
              <div className="mt-4 space-y-3">
                <Separator />
                <div className="space-y-2">
                  <Input placeholder="Username" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} className="rounded-xl" />
                  <Input placeholder="Campus" value={form.campus} onChange={e => setForm(p => ({ ...p, campus: e.target.value }))} className="rounded-xl" />
                  <Input placeholder="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="rounded-xl" />
                </div>
                <Button onClick={saveEdit} className="w-full gradient-primary border-0 rounded-xl" disabled={updateProfile.isPending}>
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Row - Reward visual */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            className="bg-card rounded-2xl border border-border p-3.5 text-center hover:shadow-md transition-shadow"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="w-10 h-10 rounded-xl gradient-coin flex items-center justify-center mx-auto mb-2 shadow-md">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <p className="font-display font-bold text-lg">{wallet?.total_coins || 0}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Coins</p>
          </motion.div>
          <motion.div
            className="bg-card rounded-2xl border border-border p-3.5 text-center hover:shadow-md transition-shadow"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
          >
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-2 shadow-md">
              <ShoppingBag className="w-5 h-5 text-primary-foreground" />
            </div>
            <p className="font-display font-bold text-lg">{stats?.totalOrders || 0}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Orders</p>
          </motion.div>
          <motion.div
            className="bg-card rounded-2xl border border-border p-3.5 text-center hover:shadow-md transition-shadow"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-10 h-10 rounded-xl gradient-mint flex items-center justify-center mx-auto mb-2 shadow-md">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <p className="font-display font-bold text-lg">₹{Math.round((wallet?.total_coins || 0) / 10)}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Saved</p>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-secondary/50 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('coins')}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200',
              activeTab === 'coins' ? 'gradient-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            🪙 My Coins
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200',
              activeTab === 'activity' ? 'gradient-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            📋 Activity
          </button>
        </div>

        {activeTab === 'coins' && (
          <>
            <CoinTransfer availableCoins={wallet?.total_coins || 0} />

            <section className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <h3 className="font-display font-bold text-sm">Coin History</h3>
              {(!transactions || transactions.length === 0) ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No transactions yet. Earn coins by completing orders!</p>
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
                            {tx.type === 'earn' ? 'Earned' : tx.type === 'redeem' ? 'Redeemed' : 'Sent'}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={cn('text-sm font-bold', tx.type === 'earn' ? 'text-accent' : 'text-destructive')}>
                        {tx.type === 'earn' ? '+' : '-'}{tx.coins} 🪙
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'activity' && (
          <section className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <h3 className="font-display font-bold text-sm">Recent Activity</h3>
            {completedOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No completed orders yet.</p>
            ) : (
              <div className="space-y-1.5">
                {completedOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{order.restaurant?.name || 'Restaurant'}</p>
                        <p className="text-[11px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] rounded-lg bg-accent/10 text-accent border-0 font-semibold">
                      Completed ✓
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
