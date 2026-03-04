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
import { Coins, Edit2, ShoppingBag, Users, TrendingUp, ArrowUpRight, ArrowDownLeft, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCustomerOrders } from '@/hooks/useOrders';

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

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto pb-28 md:pb-6 space-y-5">
        {/* Profile Header */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20 border-2 border-primary">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-display font-bold">
                {profile?.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-bold text-xl truncate">{profile?.name}</h1>
              {profile?.username && (
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              )}
              {profile?.campus && (
                <Badge variant="secondary" className="mt-1 text-xs">🎓 {profile.campus}</Badge>
              )}
              <div className="flex gap-4 mt-3 text-sm">
                <Link to="/customer/profile/followers" className="hover:text-primary transition-colors">
                  <span className="font-semibold">{counts?.followers || 0}</span>{' '}
                  <span className="text-muted-foreground">Followers</span>
                </Link>
                <Link to="/customer/profile/following" className="hover:text-primary transition-colors">
                  <span className="font-semibold">{counts?.following || 0}</span>{' '}
                  <span className="text-muted-foreground">Following</span>
                </Link>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={editing ? () => setEditing(false) : startEdit}>
              {editing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            </Button>
          </div>

          {editing && (
            <div className="mt-4 space-y-3">
              <Separator />
              <div className="space-y-2">
                <Input placeholder="Username" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
                <Input placeholder="Campus" value={form.campus} onChange={e => setForm(p => ({ ...p, campus: e.target.value }))} />
                <Input placeholder="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <Button onClick={saveEdit} className="w-full" disabled={updateProfile.isPending}>
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <Coins className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="font-display font-bold text-lg">{wallet?.total_coins || 0}</p>
            <p className="text-xs text-muted-foreground">Coins</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <ShoppingBag className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="font-display font-bold text-lg">{stats?.totalOrders || 0}</p>
            <p className="text-xs text-muted-foreground">Orders</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="font-display font-bold text-lg">{Math.round((wallet?.total_coins || 0) / 10)}</p>
            <p className="text-xs text-muted-foreground">₹ Saved</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('coins')}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors',
              activeTab === 'coins' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            )}
          >
            🪙 My Coins
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors',
              activeTab === 'activity' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            )}
          >
            📋 Activity
          </button>
        </div>

        {activeTab === 'coins' && (
          <section className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <h3 className="font-display font-semibold text-sm">Coin History</h3>
            {(!transactions || transactions.length === 0) ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet. Earn coins by completing orders!</p>
            ) : (
              <div className="space-y-2">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      {tx.type === 'earn' ? (
                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                          <ArrowDownLeft className="w-4 h-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                          <ArrowUpRight className="w-4 h-4 text-red-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium capitalize">{tx.type === 'earn' ? 'Earned' : tx.type === 'redeem' ? 'Redeemed' : 'Transfer'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={cn('text-sm font-semibold', tx.type === 'earn' ? 'text-green-600' : 'text-red-500')}>
                      {tx.type === 'earn' ? '+' : '-'}{tx.coins} 🪙
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'activity' && (
          <section className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <h3 className="font-display font-semibold text-sm">Recent Activity</h3>
            {completedOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No completed orders yet.</p>
            ) : (
              <div className="space-y-2">
                {completedOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{order.restaurant?.name || 'Restaurant'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">Completed ✓</Badge>
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
