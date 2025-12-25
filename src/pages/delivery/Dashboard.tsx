import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { 
  Package, 
  DollarSign, 
  MapPin,
  Clock,
  Navigation,
  Phone
} from 'lucide-react';
import { useState } from 'react';

const ACTIVE_ORDER = {
  id: '#1234',
  restaurant: 'Spice Garden',
  restaurantAddress: '456 Food Court, Downtown',
  customer: 'John Doe',
  customerAddress: '123 Main Street, Apt 4B',
  items: '2x Butter Chicken, 1x Naan, 1x Raita',
  total: '₹650',
  distance: '3.2 km',
  estimatedTime: '15 min',
};

const TODAY_STATS = [
  { label: 'Deliveries', value: '8', icon: Package },
  { label: 'Earnings', value: '₹640', icon: DollarSign },
  { label: 'Distance', value: '24 km', icon: MapPin },
  { label: 'Avg. Time', value: '22 min', icon: Clock },
];

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 md:pb-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Hey, {user?.name}!</h1>
            <p className="text-muted-foreground">Ready to deliver?</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-muted-foreground'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
            <Switch checked={isOnline} onCheckedChange={setIsOnline} />
          </div>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {TODAY_STATS.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-delivery/10 flex items-center justify-center mb-2">
                  <stat.icon className="w-5 h-5 text-delivery" />
                </div>
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active Order */}
        {isOnline && (
          <Card className="border-delivery/50 bg-delivery/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-delivery">Active Delivery</CardTitle>
                <span className="px-3 py-1 rounded-full bg-delivery text-white text-xs font-medium">
                  In Progress
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{ACTIVE_ORDER.id}</span>
                <span className="font-semibold">{ACTIVE_ORDER.total}</span>
              </div>

              <div className="space-y-3">
                {/* Pickup */}
                <div className="flex gap-3 p-3 rounded-lg bg-card">
                  <div className="w-8 h-8 rounded-full bg-restaurant/10 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-restaurant" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{ACTIVE_ORDER.restaurant}</div>
                    <div className="text-sm text-muted-foreground">{ACTIVE_ORDER.restaurantAddress}</div>
                  </div>
                  <Button size="icon" variant="outline" className="shrink-0">
                    <Navigation className="w-4 h-4" />
                  </Button>
                </div>

                {/* Delivery */}
                <div className="flex gap-3 p-3 rounded-lg bg-card">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{ACTIVE_ORDER.customer}</div>
                    <div className="text-sm text-muted-foreground">{ACTIVE_ORDER.customerAddress}</div>
                  </div>
                  <Button size="icon" variant="outline" className="shrink-0">
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{ACTIVE_ORDER.distance} away</span>
                <span>ETA: {ACTIVE_ORDER.estimatedTime}</span>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">Mark Picked Up</Button>
                <Button className="flex-1 bg-delivery hover:bg-delivery/90">Complete Delivery</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isOnline && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">You're offline</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Go online to start receiving delivery requests
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
