import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  DollarSign, 
  MapPin,
  Clock,
  Navigation,
  CheckCircle,
  Loader2,
  UtensilsCrossed
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useDeliveryOrders, useUpdateDeliveryStatus, useUpdateLocation, type DeliveryOrder } from '@/hooks/useDeliveryOrders';
import { formatDistanceToNow } from 'date-fns';

const STATUS_FLOW: Record<string, { next: string; orderStatus?: string; label: string }> = {
  assigned: { next: 'en_route_pickup', label: 'Accept & Head to Pickup' },
  en_route_pickup: { next: 'at_restaurant', label: 'Arrived at Restaurant' },
  at_restaurant: { next: 'en_route_delivery', orderStatus: 'picked_up', label: 'Picked Up - Start Delivery' },
  en_route_delivery: { next: 'delivered', orderStatus: 'delivered', label: 'Mark as Delivered' },
};

const STATUS_LABELS: Record<string, string> = {
  assigned: 'Assigned',
  en_route_pickup: 'Heading to Restaurant',
  at_restaurant: 'At Restaurant',
  en_route_delivery: 'Out for Delivery',
  delivered: 'Delivered',
};

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [watchId, setWatchId] = useState<number | null>(null);
  const { deliveries, isLoading } = useDeliveryOrders();
  const updateStatus = useUpdateDeliveryStatus();
  const updateLocation = useUpdateLocation();

  const activeDeliveries = deliveries.filter(d => d.status !== 'delivered');
  const completedToday = deliveries.filter(d => {
    if (d.status !== 'delivered') return false;
    const today = new Date();
    const deliveryDate = new Date(d.updated_at);
    return deliveryDate.toDateString() === today.toDateString();
  });

  const startLocationTracking = useCallback((deliveryId: string) => {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (position) => {
        updateLocation.mutate({
          deliveryId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => console.error('GPS Error:', error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    setWatchId(id);
  }, [updateLocation]);

  const stopLocationTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  useEffect(() => {
    const enRouteDelivery = activeDeliveries.find(
      d => d.status === 'en_route_pickup' || d.status === 'en_route_delivery'
    );
    
    if (enRouteDelivery && isOnline) {
      startLocationTracking(enRouteDelivery.id);
    } else {
      stopLocationTracking();
    }

    return () => stopLocationTracking();
  }, [activeDeliveries, isOnline, startLocationTracking, stopLocationTracking]);

  const handleStatusUpdate = (delivery: DeliveryOrder) => {
    const flow = STATUS_FLOW[delivery.status];
    if (!flow) return;

    updateStatus.mutate({
      deliveryId: delivery.id,
      status: flow.next as any,
      orderStatus: flow.orderStatus as any,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-accent/10 text-accent border-accent/20';
      case 'en_route_pickup': return 'bg-delivery/10 text-delivery border-delivery/20';
      case 'at_restaurant': return 'bg-restaurant/10 text-restaurant border-restaurant/20';
      case 'en_route_delivery': return 'bg-primary/10 text-primary border-primary/20';
      case 'delivered': return 'bg-green-500/10 text-green-600 border-green-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 md:pb-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Hey, {user?.name}! 🚀</h1>
            <p className="text-muted-foreground">Ready to deliver some meals?</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${isOnline ? 'text-delivery' : 'text-muted-foreground'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
            <Switch checked={isOnline} onCheckedChange={setIsOnline} />
          </div>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
              </div>
              <div className="text-xl font-display font-bold">{completedToday.length}</div>
              <div className="text-xs text-muted-foreground">Delivered Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-accent/10 flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div className="text-xl font-display font-bold">{activeDeliveries.length}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-delivery/10 flex items-center justify-center mb-2">
                <DollarSign className="w-5 h-5 text-delivery" />
              </div>
              <div className="text-xl font-display font-bold">
                ₹{completedToday.reduce((sum, d) => sum + (d.order?.total_amount || 0) * 0.1, 0).toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">Earnings</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-restaurant/10 flex items-center justify-center mb-2">
                <MapPin className="w-5 h-5 text-restaurant" />
              </div>
              <div className="text-xl font-display font-bold">{watchId !== null ? 'Active' : 'Off'}</div>
              <div className="text-xs text-muted-foreground">GPS Tracking</div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        )}

        {/* Active Deliveries */}
        {isOnline && activeDeliveries.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-display font-semibold text-lg">Active Deliveries</h2>
            {activeDeliveries.map((delivery) => (
              <Card key={delivery.id} className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-display">
                      Order #{delivery.order_id.slice(0, 8)}
                    </CardTitle>
                    <Badge className={getStatusColor(delivery.status)}>
                      {STATUS_LABELS[delivery.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(delivery.created_at), { addSuffix: true })}
                    </span>
                    <span className="font-semibold">₹{delivery.order?.total_amount}</span>
                  </div>

                  {/* Restaurant Info */}
                  <div className="flex gap-3 p-3 rounded-lg bg-card border">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <UtensilsCrossed className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{delivery.order?.restaurant?.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {delivery.order?.restaurant?.address}
                      </div>
                    </div>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="shrink-0"
                      onClick={() => {
                        if (delivery.order?.restaurant?.address) {
                          window.open(`https://maps.google.com/?q=${encodeURIComponent(delivery.order.restaurant.address)}`);
                        }
                      }}
                    >
                      <Navigation className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Location Status */}
                  {delivery.current_lat && delivery.current_lng && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Location: {delivery.current_lat.toFixed(4)}, {delivery.current_lng.toFixed(4)}
                    </div>
                  )}

                  {/* Action Button */}
                  {STATUS_FLOW[delivery.status] && (
                    <Button 
                      className="w-full"
                      onClick={() => handleStatusUpdate(delivery)}
                      disabled={updateStatus.isPending}
                    >
                      {updateStatus.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : delivery.status === 'en_route_delivery' ? (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      ) : null}
                      {STATUS_FLOW[delivery.status].label}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Active Deliveries */}
        {isOnline && !isLoading && activeDeliveries.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                <UtensilsCrossed className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg">No active deliveries</h3>
              <p className="text-muted-foreground text-sm mt-1">
                New food orders will appear here when assigned
              </p>
            </CardContent>
          </Card>
        )}

        {/* Offline State */}
        {!isOnline && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                <UtensilsCrossed className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg">You're offline</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Go online to receive delivery assignments
              </p>
            </CardContent>
          </Card>
        )}

        {/* Completed Today */}
        {completedToday.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-display font-semibold text-lg">Completed Today</h2>
            <div className="space-y-2">
              {completedToday.map((delivery) => (
                <Card key={delivery.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-delivery/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-delivery" />
                      </div>
                      <div>
                        <div className="font-medium">{delivery.order?.restaurant?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(delivery.updated_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <div className="font-semibold">₹{((delivery.order?.total_amount || 0) * 0.1).toFixed(0)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
