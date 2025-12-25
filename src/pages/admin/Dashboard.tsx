import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  Store, 
  ShoppingBag, 
  TrendingUp,
  ArrowUp,
  AlertCircle
} from 'lucide-react';

const OVERVIEW_STATS = [
  { label: 'Total Users', value: '12,458', change: '+342 this week', icon: Users, color: 'admin' },
  { label: 'Active Restaurants', value: '284', change: '+12 this week', icon: Store, color: 'restaurant' },
  { label: 'Orders Today', value: '1,847', change: '+23% vs yesterday', icon: ShoppingBag, color: 'customer' },
  { label: 'Revenue Today', value: '₹4,82,000', change: '+18% vs yesterday', icon: TrendingUp, color: 'delivery' },
];

const RECENT_ACTIVITY = [
  { type: 'user', message: 'New restaurant "Taco Bell" registered', time: '2 min ago' },
  { type: 'alert', message: '3 delivery partners went offline', time: '15 min ago' },
  { type: 'user', message: '28 new customers signed up', time: '1 hour ago' },
  { type: 'alert', message: 'High order volume detected in Downtown area', time: '2 hours ago' },
];

const PENDING_APPROVALS = [
  { name: 'Fresh Bites Cafe', type: 'Restaurant', submitted: '2 hours ago' },
  { name: 'Quick Delivery Co', type: 'Delivery Partner', submitted: '5 hours ago' },
  { name: 'Mama\'s Kitchen', type: 'Restaurant', submitted: '1 day ago' },
];

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform overview and management</p>
          </div>
          <Button className="bg-admin hover:bg-admin/90">
            Generate Report
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {OVERVIEW_STATS.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-${stat.color}/10 flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                  </div>
                  <ArrowUp className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
                <div className="text-xs text-green-600 mt-1">{stat.change}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {RECENT_ACTIVITY.map((activity, i) => (
                  <div key={i} className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      activity.type === 'alert' ? 'bg-destructive/10' : 'bg-admin/10'
                    }`}>
                      {activity.type === 'alert' ? (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      ) : (
                        <Users className="w-4 h-4 text-admin" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pending Approvals</CardTitle>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {PENDING_APPROVALS.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.type} • {item.submitted}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Reject</Button>
                      <Button size="sm">Approve</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
