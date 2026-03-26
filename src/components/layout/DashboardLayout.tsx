import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWallet } from '@/hooks/useWallet';
import { useConversations } from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  ShoppingCart,
  ClipboardList, 
  User, 
  LogOut,
  Store,
  Menu as MenuIcon,
  BarChart3,
  Users,
  Settings,
  RotateCcw,
  Wallet,
  UtensilsCrossed,
  MessageSquare,
  Coins,
  Search,
  Sparkles
} from 'lucide-react';
import { UserRole } from '@/types/auth';
import { NotificationBell } from '@/components/NotificationBell';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  activeIcon?: ReactNode;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  customer: [
    { label: 'Home', href: '/customer', icon: <Home className="w-5 h-5" /> },
    { label: 'Explore', href: '/customer/explore', icon: <Search className="w-5 h-5" /> },
    { label: 'Coins', href: '/customer/coins', icon: <Coins className="w-5 h-5" /> },
    { label: 'Chat', href: '/customer/messages', icon: <MessageSquare className="w-5 h-5" /> },
    { label: 'Profile', href: '/customer/profile', icon: <User className="w-5 h-5" /> },
  ],
  restaurant: [
    { label: 'Dashboard', href: '/restaurant', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Menu', href: '/restaurant/menu', icon: <MenuIcon className="w-5 h-5" /> },
    { label: 'Orders', href: '/restaurant/orders', icon: <ClipboardList className="w-5 h-5" /> },
    { label: 'Settings', href: '/restaurant/settings', icon: <Settings className="w-5 h-5" /> },
  ],
  admin: [
    { label: 'Overview', href: '/admin', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Users', href: '/admin/users', icon: <Users className="w-5 h-5" /> },
    { label: 'Restaurants', href: '/admin/restaurants', icon: <Store className="w-5 h-5" /> },
    { label: 'Orders', href: '/admin/orders', icon: <ClipboardList className="w-5 h-5" /> },
    { label: 'Payouts', href: '/admin/payouts', icon: <Wallet className="w-5 h-5" /> },
    { label: 'Refunds', href: '/admin/refunds', icon: <RotateCcw className="w-5 h-5" /> },
  ],
};

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { data: wallet } = useWallet();
  const { data: conversations } = useConversations();
  const location = useLocation();
  usePushNotifications();

  if (!user) return null;

  const navItems = NAV_ITEMS[user.role];
  const isCustomer = user.role === 'customer';
  const totalUnread = conversations?.reduce((sum, c) => sum + (c.unread_count || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 bg-dot-pattern opacity-[0.12] pointer-events-none z-0" />

      <header className="sticky top-0 z-50 border-b border-border/80 glass-strong">
        <div className="container flex h-16 items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center shadow-soft">
              <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display font-bold text-lg leading-none text-secondary">Munchii</span>
              <p className="text-[11px] text-muted-foreground leading-none mt-1 hidden sm:block">Order. Earn. Share.</p>
            </div>
          </Link>

          <div className="flex items-center gap-1.5">
            {isCustomer && (
              <Link to="/customer/coins" className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-card border border-border shadow-soft mr-1">
                <span className="w-7 h-7 rounded-full gradient-coin flex items-center justify-center glow-coin">
                  <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                </span>
                <span className="text-xs font-bold text-foreground">{wallet?.total_coins || 0} pts</span>
              </Link>
            )}

            {isCustomer && (
              <Link to="/customer/cart" className="relative">
                <Button variant="ghost" size="icon" className="rounded-2xl h-10 w-10 bg-card/70 hover:bg-card shadow-soft">
                  <ShoppingCart className="w-4.5 h-4.5" />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] gradient-primary border-0 shadow-soft">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}
            <NotificationBell />
          </div>
        </div>
      </header>

      <div className="flex relative z-10">
        <aside className="hidden md:flex w-60 flex-col border-r border-border/70 bg-sidebar/80 min-h-[calc(100vh-4rem)] p-4 justify-between">
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              const badge = item.label === 'Chat' && totalUnread > 0 ? totalUnread : 0;
              return (
                <Link
                  key={item.href + item.label}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'gradient-royal text-secondary-foreground shadow-soft'
                      : 'bg-card/70 text-muted-foreground hover:text-foreground hover:-translate-y-0.5 shadow-soft'
                  )}
                >
                  {item.icon}
                  {item.label}
                  {badge > 0 && (
                    <Badge className="ml-auto h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] bg-primary/20 text-primary-foreground border-0">
                      {badge > 99 ? '99+' : badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {!isCustomer && (
            <button
              onClick={logout}
              className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-200 mt-4"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </button>
          )}
        </aside>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border/80 glass-strong z-50 safe-area-bottom">
        <div className={cn('grid gap-1 px-2 py-2', user.role === 'admin' ? 'grid-cols-7' : 'grid-cols-5')}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const badge = item.label === 'Chat' && totalUnread > 0 ? totalUnread : 0;
            return (
              <Link
                key={item.href + item.label}
                to={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-2 rounded-2xl text-[10px] font-semibold transition-all min-w-0',
                  isActive ? 'text-secondary' : 'text-muted-foreground'
                )}
              >
                <div className={cn('p-2 rounded-2xl transition-all relative', isActive && 'bg-secondary/12 shadow-soft')}>
                  {item.icon}
                  {badge > 0 && (
                    <Badge className="absolute -top-1 -right-2 h-4 min-w-4 px-1 flex items-center justify-center text-[9px] gradient-primary border-0">
                      {badge > 99 ? '99+' : badge}
                    </Badge>
                  )}
                </div>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
