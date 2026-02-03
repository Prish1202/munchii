import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurantOrders } from '@/hooks/useRestaurantOrders';
import { useMyRestaurant } from '@/hooks/useMenuManagement';
import { 
  TrendingUp, 
  DollarSign, 
  Coffee, 
  Clock,
  ChevronRight,
  Store,
  AlertCircle
} from 'lucide-react';

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const { data: restaurant, isLoading: loadingRestaurant } = useMyRestaurant();
  const { data: orders, isLoading: loadingOrders } = useRestaurantOrders();

  const pendingOrders = orders?.filter(o => o.status === 'placed') || [];
  const activeOrders = orders?.filter(o => ['accepted', 'preparing', 'ready'].includes(o.status)) || [];
  const todayOrders = orders?.filter(o => {
    const orderDate = new Date(o.created_at).toDateString();
    return orderDate === new Date().toDateString();
  }) || [];

  const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  if (loadingRestaurant) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!restaurant) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Store className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-display font-bold mb-2">Set Up Your Café</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            You haven't created your café profile yet. Set it up to start receiving orders.
          </p>
          <Link to="/restaurant/settings">
            <Button size="lg" className="bg-cafe hover:bg-cafe/90">
              Create Café Profile
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">{restaurant.name}</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name}</p>
          </div>
          <Link to="/restaurant/menu">
            <Button className="bg-cafe hover:bg-cafe/90">
              Manage Menu
            </Button>
          </Link>
        </div>

        {/* Pending Orders Alert */}
        {pendingOrders.length > 0 && (
          <Card className="border-accent bg-accent/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center animate-pulse">
                    <AlertCircle className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-accent">
                      {pendingOrders.length} New Order{pendingOrders.length > 1 ? 's' : ''} Waiting!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Accept or reject incoming orders
                    </p>
                  </div>
                </div>
                <Link to="/restaurant/orders">
                  <Button variant="outline" className="border-accent text-accent hover:bg-accent/10">
                    View Orders
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-cafe/10 flex items-center justify-center">
                  <Coffee className="w-5 h-5 text-cafe" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-display font-bold">{todayOrders.length}</div>
                <div className="text-sm text-muted-foreground">Today's Orders</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-cafe/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-cafe" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-display font-bold">₹{todayRevenue.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">Today's Revenue</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-display font-bold">{pendingOrders.length}</div>
                <div className="text-sm text-muted-foreground">Pending Orders</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-delivery/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-delivery" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-display font-bold">{activeOrders.length}</div>
                <div className="text-sm text-muted-foreground">Active Orders</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link to="/restaurant/orders">
            <Card className="hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cafe/10 flex items-center justify-center">
                  <Coffee className="w-6 h-6 text-cafe" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Manage Orders</h3>
                  <p className="text-sm text-muted-foreground">View and process incoming orders</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link to="/restaurant/menu">
            <Card className="hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cafe/10 flex items-center justify-center">
                  <Store className="w-6 h-6 text-cafe" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Menu Management</h3>
                  <p className="text-sm text-muted-foreground">Add, edit, or disable menu items</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
