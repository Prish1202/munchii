import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Clock,
  ArrowUp,
  ArrowDown,
  MoreVertical
} from 'lucide-react';

const STATS = [
  { label: "Today's Orders", value: '24', change: '+12%', up: true, icon: ShoppingBag },
  { label: "Today's Revenue", value: '₹18,450', change: '+8%', up: true, icon: DollarSign },
  { label: 'Pending Orders', value: '5', change: '-2', up: false, icon: Clock },
  { label: 'Avg. Prep Time', value: '18 min', change: '-3 min', up: true, icon: TrendingUp },
];

const RECENT_ORDERS = [
  { id: '#1234', items: '2x Butter Chicken, 1x Naan', status: 'preparing', time: '5 min ago', total: '₹650' },
  { id: '#1233', items: '1x Biryani, 2x Raita', status: 'ready', time: '12 min ago', total: '₹450' },
  { id: '#1232', items: '3x Paneer Tikka', status: 'delivered', time: '25 min ago', total: '₹380' },
  { id: '#1231', items: '1x Thali Set', status: 'delivered', time: '40 min ago', total: '₹550' },
];

const STATUS_COLORS = {
  preparing: 'bg-amber-100 text-amber-700',
  ready: 'bg-green-100 text-green-700',
  delivered: 'bg-blue-100 text-blue-700',
};

export default function RestaurantDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Restaurant Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name}</p>
          </div>
          <Button className="bg-restaurant hover:bg-restaurant/90">
            Open Menu Editor
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-restaurant/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-restaurant" />
                  </div>
                  <span className={`text-xs font-medium flex items-center gap-1 ${stat.up ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {stat.change}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button variant="outline" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {RECENT_ORDERS.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{order.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{order.items}</p>
                    <p className="text-xs text-muted-foreground">{order.time}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{order.total}</div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
