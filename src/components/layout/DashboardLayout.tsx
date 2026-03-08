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
  UtensilsCrossed,
  MessageSquare,
  Coins,
  Search,
  Sparkles
} from 'lucide-react';
import { UserRole } from '@/types/auth';
import { NotificationBell } from '@/components/NotificationBell';

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
    { label: 'Orders', href: '/customer/orders', icon: <ClipboardList className="w-5 h-5" /> },
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

  if (!user) return null;

  const navItems = NAV_ITEMS[user.role];
  const isCustomer = user.role === 'customer';
  const totalUnread = conversations?.reduce((sum, c) => sum + (c.unread_count || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background pattern */}
      <div className="fixed inset-0 bg-dot-pattern opacity-[0.02] pointer-events-none z-0" />
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b glass-strong">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shadow-md">
              <UtensilsCrossed className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">FoodyZone</span>
          </Link>
          
          <div className="flex items-center gap-1.5">
            {/* Coin balance pill */}
            {isCustomer && (
              <Link to="/customer/coins" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-coin/10 border border-coin/20 mr-1">
                <Sparkles className="w-3.5 h-3.5 text-coin" />
                <span className="text-xs font-bold text-coin-foreground">{wallet?.total_coins || 0}</span>
              </Link>
            )}
            
            {isCustomer && (
              <Link to="/customer/cart" className="relative">
                <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9">
                  <ShoppingCart className="w-4.5 h-4.5" />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4.5 w-4.5 p-0 flex items-center justify-center text-[10px] gradient-primary border-0">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={logout} className="rounded-xl h-9 w-9">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - desktop */}
        <aside className="hidden md:flex w-56 flex-col border-r bg-card/50 min-h-[calc(100vh-3.5rem)] p-3">
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              const badge = item.label === 'Chat' && totalUnread > 0 ? totalUnread : 0;
              return (
                <Link
                  key={item.href + item.label}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "gradient-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {item.icon}
                  {item.label}
                  {badge > 0 && (
                    <Badge className="ml-auto h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] gradient-primary border-0">
                      {badge > 99 ? '99+' : badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav - sticky */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t glass-strong z-50 safe-area-bottom">
        <div className="flex justify-around py-1.5 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href + item.label}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all min-w-[3.5rem]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "p-1 rounded-xl transition-all",
                  isActive && "bg-primary/10"
                )}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
