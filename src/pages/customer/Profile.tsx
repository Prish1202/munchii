import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUserStats } from '@/hooks/useProfile';
import { useWallet } from '@/hooks/useWallet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShoppingBag, Coins, Settings, HelpCircle, ChevronRight, ArrowLeft, UserRound } from 'lucide-react';
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

  const completedOrders = orders?.filter(o => o.status === 'completed') || [];

  const profileLinks = [
    { label: 'My Orders', href: '/customer/orders', icon: ShoppingBag },
    { label: 'My Coins', href: '/customer/coins', icon: Coins },
    { label: 'Help & Support', href: '/contact', icon: HelpCircle },
    { label: 'Settings', href: '/customer/profile/settings', icon: Settings },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto pb-28 md:pb-6">
        <div className="flex items-center justify-between h-12">
          <button onClick={() => navigate('/customer')} aria-label="Back to home" className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-lg">Profile</h1>
          <button onClick={() => navigate('/customer/profile/settings')} aria-label="Open settings" className="p-2 rounded-xl hover:bg-muted transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <motion.section className="flex flex-col items-center pt-5 pb-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Avatar className="w-24 h-24 border-4 border-card shadow-soft">
            {profile?.avatar_url ? <AvatarImage src={resolveStorageUrl(profile.avatar_url) || undefined} alt={profile.name} /> : null}
            <AvatarFallback className="gradient-primary text-primary-foreground text-3xl font-display font-bold">
              {profile?.name?.charAt(0)?.toUpperCase() || <UserRound className="w-8 h-8" />}
            </AvatarFallback>
          </Avatar>
          <h2 className="font-display font-bold text-xl mt-3">{profile?.name || 'Munchii Foodie'}</h2>
          <p className="text-sm text-muted-foreground">{profile?.username ? `@${profile.username}` : profile?.campus || user?.email}</p>
        </motion.section>

        <motion.div className="grid grid-cols-2 rounded-xl border border-border bg-card mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Link to="/customer/orders" className="py-4 text-center border-r border-border">
            <p className="font-display font-bold text-xl">{stats?.totalOrders || completedOrders.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Orders</p>
          </Link>
          <Link to="/customer/coins" className="py-4 text-center">
            <p className="font-display font-bold text-xl text-primary">{wallet?.total_coins || 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Coins</p>
          </Link>
        </motion.div>

        <motion.nav className="border-y border-border bg-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          {profileLinks.map(({ label, href, icon: Icon }, index) => (
            <Link key={label} to={href} className={`flex items-center gap-4 px-3 py-4 hover:bg-muted/60 transition-colors ${index < profileLinks.length - 1 ? 'border-b border-border' : ''}`}>
              <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="w-4.5 h-4.5" />
              </span>
              <span className="flex-1 text-sm font-semibold">{label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          ))}
        </motion.nav>
      </div>
    </DashboardLayout>
  );
}
