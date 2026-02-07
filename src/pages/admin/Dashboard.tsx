import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminAnalytics, useAdminOrders } from '@/hooks/useAdminData';
import { 
  Users, 
  Store, 
  ShoppingBag, 
  TrendingUp,
  ArrowUp,
  CheckCircle,
  XCircle,
  Wallet
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-yellow-500',
  accepted: 'bg-blue-500',
  preparing: 'bg-orange-500',
  ready: 'bg-purple-500',
  picked_up: 'bg-indigo-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-destructive',
};

export default function AdminDashboard() {
  const { data: analytics, isLoading: analyticsLoading } = useAdminAnalytics();
  const { data: orders, isLoading: ordersLoading } = useAdminOrders();

  const recentOrders = orders?.slice(0, 5) || [];

  const stats = [
    { 
      label: 'Total Users', 
      value: analytics?.totalUsers || 0, 
      icon: Users, 
      color: 'bg-admin',
      change: '+12%'
    },
    { 
      label: 'Active Restaurants', 
      value: analytics?.totalRestaurants || 0, 
      icon: Store, 
      color: 'bg-restaurant',
      change: '+5%'
    },
    { 
      label: 'Total Orders', 
      value: analytics?.totalOrders || 0, 
      icon: ShoppingBag, 
      color: 'bg-customer',
      change: '+23%'
    },
    { 
      label: 'Total Revenue', 
      value: `₹${(analytics?.totalRevenue || 0).toLocaleString()}`, 
      icon: TrendingUp, 
      color: 'bg-delivery',
      change: '+18%'
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform overview and analytics</p>
          </div>
          <Link to="/admin/orders">
            <Button className="bg-admin hover:bg-admin/90">
              View All Orders
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.color}/10 flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <ArrowUp className="w-3 h-3" />
                    {stat.change}
                  </div>
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Order Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Order Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Delivered Orders</span>
                  </div>
                  <span className="font-bold text-green-600">{analytics?.deliveredOrders || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-destructive" />
                    <span>Cancelled Orders</span>
                  </div>
                  <span className="font-bold text-destructive">{analytics?.cancelledOrders || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-primary" />
                    <span>Platform Fees Earned</span>
                  </div>
                  <span className="font-bold text-primary">₹{analytics?.platformFees || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span>Delivery Rate</span>
                  </div>
                  <span className="font-bold text-blue-600">{analytics?.deliveryRate || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link to="/admin/orders">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No orders yet</div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div>
                        <p className="font-medium">{order.restaurant?.name || 'Unknown Restaurant'}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), 'MMM d, HH:mm')} • ₹{Number(order.total_amount).toFixed(0)}
                        </p>
                      </div>
                      <Badge className={`${STATUS_COLORS[order.status]} text-white`}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Link to="/admin/users">
            <Card className="hover:border-admin/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-admin/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-admin" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Users</h3>
                  <p className="text-sm text-muted-foreground">View all platform users</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/orders">
            <Card className="hover:border-admin/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-customer/10 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-customer" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Orders</h3>
                  <p className="text-sm text-muted-foreground">Track and update orders</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/payouts">
            <Card className="hover:border-admin/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-delivery/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-delivery" />
                </div>
                <div>
                  <h3 className="font-semibold">View Payouts</h3>
                  <p className="text-sm text-muted-foreground">Track earnings and fees</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
