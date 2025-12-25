import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  ShoppingBag, 
  ClipboardList, 
  User, 
  LogOut,
  Store,
  Menu as MenuIcon,
  BarChart3,
  Package,
  Truck,
  MapPin,
  Clock,
  Users,
  Settings,
  Utensils
} from 'lucide-react';
import { UserRole } from '@/types/auth';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  customer: [
    { label: 'Home', href: '/customer', icon: <Home className="w-5 h-5" /> },
    { label: 'Browse', href: '/customer/browse', icon: <Utensils className="w-5 h-5" /> },
    { label: 'Orders', href: '/customer/orders', icon: <ShoppingBag className="w-5 h-5" /> },
    { label: 'Profile', href: '/customer/profile', icon: <User className="w-5 h-5" /> },
  ],
  restaurant: [
    { label: 'Dashboard', href: '/restaurant', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Menu', href: '/restaurant/menu', icon: <MenuIcon className="w-5 h-5" /> },
    { label: 'Orders', href: '/restaurant/orders', icon: <ClipboardList className="w-5 h-5" /> },
    { label: 'Settings', href: '/restaurant/settings', icon: <Settings className="w-5 h-5" /> },
  ],
  delivery: [
    { label: 'Dashboard', href: '/delivery', icon: <Home className="w-5 h-5" /> },
    { label: 'Active', href: '/delivery/active', icon: <Truck className="w-5 h-5" /> },
    { label: 'History', href: '/delivery/history', icon: <Clock className="w-5 h-5" /> },
    { label: 'Earnings', href: '/delivery/earnings', icon: <Package className="w-5 h-5" /> },
  ],
  admin: [
    { label: 'Overview', href: '/admin', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Users', href: '/admin/users', icon: <Users className="w-5 h-5" /> },
    { label: 'Restaurants', href: '/admin/restaurants', icon: <Store className="w-5 h-5" /> },
    { label: 'Orders', href: '/admin/orders', icon: <ClipboardList className="w-5 h-5" /> },
  ],
};

const ROLE_COLORS: Record<UserRole, string> = {
  customer: 'bg-customer',
  restaurant: 'bg-restaurant',
  delivery: 'bg-delivery',
  admin: 'bg-admin',
};

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const navItems = NAV_ITEMS[user.role];
  const roleColor = ROLE_COLORS[user.role];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", roleColor)}>
              <Utensils className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">FoodMarket</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.name}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-card min-h-[calc(100vh-4rem)] p-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === item.href
                    ? `${roleColor} text-primary-foreground`
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur-sm">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs",
                location.pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
