import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUserStats } from '@/hooks/useProfile';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShoppingBag, Sparkles, Settings, ClipboardList } from 'lucide-react';
import { useCustomerOrders } from '@/hooks/useOrders';
import { motion } from 'framer-motion';
import { resolveStorageUrl } from '@/lib/utils';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: wallet } = useWallet();
  const { data: stats } = useUserStats();
  const { data: orders } = useCustomerOrders();

  const hasLiveOrder = orders?.some(o => !['completed', 'cancelled'].includes(o.status)) || false;
  const completedOrders = orders?.filter(o => o.status === 'completed').slice(0, 10) || [];


  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto pb-28 md:pb-6 space-y-4">
        {/* Profile Header */}
        <motion.div
          className="relative overflow-hidden rounded-3xl border border-border"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="h-24 gradient-social" />
          <div className="bg-card px-5 pb-5">
            <div className="-mt-10 flex items-end justify-between">
              <Avatar className="w-20 h-20 border-4 border-card shadow-lg">
                {profile?.avatar_url ? (
                  <AvatarImage src={resolveStorageUrl(profile.avatar_url) || undefined} alt={profile.name} />
                ) : null}
                <AvatarFallback className="gradient-primary text-primary-foreground text-2xl font-display font-bold">
                  {profile?.name?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 mb-1">
                <Button variant="outline" size="sm" onClick={() => navigate('/customer/orders')} className="rounded-xl relative">
                  <ClipboardList className="w-4 h-4 mr-1" /> Orders
                  {hasLiveOrder && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-pulse border-2 border-card" />
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/customer/profile/settings')} className="rounded-xl">
                  <Settings className="w-4 h-4 mr-1" /> Settings
                </Button>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-xl">{profile?.name}</h1>
                
              </div>
              {profile?.campus && (
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="secondary" className="text-xs rounded-lg">🎓 {profile.campus}</Badge>
                </div>
              )}

            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Link to="/customer/coins">
            <motion.div className="bg-card rounded-2xl border border-border p-3.5 text-center hover:border-coin/40 transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <div className="w-10 h-10 rounded-xl gradient-coin flex items-center justify-center mx-auto mb-2 shadow-md">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <p className="font-display font-bold text-lg">{wallet?.total_coins || 0}</p>
              <p className="text-[11px] text-muted-foreground font-medium">Points</p>
            </motion.div>
          </Link>
          <motion.div className="bg-card rounded-2xl border border-border p-3.5 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-2 shadow-md">
              <ShoppingBag className="w-5 h-5 text-primary-foreground" />
            </div>
            <p className="font-display font-bold text-lg">{stats?.totalOrders || 0}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Orders</p>
          </motion.div>
          <motion.div className="bg-card rounded-2xl border border-border p-3.5 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="w-10 h-10 rounded-xl gradient-mint flex items-center justify-center mx-auto mb-2 shadow-md">
              <span className="text-lg">🎓</span>
            </div>
            <p className="font-display font-bold text-sm truncate">{profile?.campus || '—'}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Campus</p>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <section className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <h3 className="font-display font-bold text-sm">Recent Orders</h3>
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
      </div>
    </DashboardLayout>
  );
}
