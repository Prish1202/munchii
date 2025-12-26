import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useOrderItems, OrderStatus } from '@/hooks/useOrders';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Store, 
  ChefHat, 
  Package, 
  Truck, 
  MapPin,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

const ORDER_STEPS: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'placed', label: 'Order Placed', icon: <Package className="w-5 h-5" /> },
  { status: 'accepted', label: 'Accepted', icon: <Store className="w-5 h-5" /> },
  { status: 'preparing', label: 'Preparing', icon: <ChefHat className="w-5 h-5" /> },
  { status: 'ready', label: 'Ready for Pickup', icon: <Package className="w-5 h-5" /> },
  { status: 'picked_up', label: 'On the Way', icon: <Truck className="w-5 h-5" /> },
  { status: 'delivered', label: 'Delivered', icon: <MapPin className="w-5 h-5" /> },
];

const STATUS_ORDER: OrderStatus[] = ['placed', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered'];

const STATUS_MESSAGES: Record<OrderStatus, string> = {
  placed: 'Order placed!',
  accepted: 'Restaurant accepted your order!',
  preparing: 'Your food is being prepared!',
  ready: 'Your order is ready for pickup!',
  picked_up: 'Delivery partner is on the way!',
  delivered: 'Your order has been delivered!',
  cancelled: 'Order was cancelled',
};

export default function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant:restaurants(name, address)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: orderItems } = useOrderItems(id!);

  const handleOrderUpdate = useCallback((payload: any) => {
    queryClient.invalidateQueries({ queryKey: ['order', id] });
    queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
    
    const newStatus = payload.new?.status as OrderStatus;
    if (newStatus && STATUS_MESSAGES[newStatus]) {
      toast.info(STATUS_MESSAGES[newStatus]);
    }
  }, [id, queryClient]);

  // Real-time subscription with reconnection handling
  const { isConnected } = useRealtimeSync({
    channelName: `order-tracking-${id}`,
    table: 'orders',
    filter: `id=eq.${id}`,
    onUpdate: handleOrderUpdate,
    enabled: !!id,
  });

  // Also subscribe to delivery updates for this order
  useRealtimeSync({
    channelName: `order-delivery-${id}`,
    table: 'deliveries',
    filter: `order_id=eq.${id}`,
    onUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Order not found</h2>
          <Link to="/customer/orders" className="text-primary hover:underline">
            Back to orders
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const currentStatusIndex = STATUS_ORDER.indexOf(order.status as OrderStatus);
  const isCancelled = order.status === 'cancelled';

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 md:pb-0">
        {/* Header */}
        <div>
          <Link
            to="/customer/orders"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to orders
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Order #{id?.slice(-6).toUpperCase()}</h1>
            <div className="flex items-center gap-2">
              {isCancelled && (
                <Badge variant="destructive">Cancelled</Badge>
              )}
              <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
                {isConnected ? (
                  <><Wifi className="w-3 h-3" /> Live</>
                ) : (
                  <><WifiOff className="w-3 h-3" /> Connecting...</>
                )}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Clock className="w-4 h-4" />
            Placed {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
          </p>
        </div>

        {/* Order Progress */}
        {!isCancelled && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ORDER_STEPS.map((step, index) => {
                  const isCompleted = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;
                  
                  return (
                    <div key={step.status} className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          step.icon
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={cn(
                          "font-medium",
                          isCompleted ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-sm text-primary animate-pulse">In progress...</p>
                        )}
                      </div>
                      {index < ORDER_STEPS.length - 1 && (
                        <div className="absolute left-5 mt-10 w-0.5 h-8 bg-muted" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Restaurant Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Store className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{order.restaurant?.name}</h3>
                <p className="text-sm text-muted-foreground">{order.restaurant?.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orderItems?.map((item) => (
              <div key={item.id} className="flex justify-between">
                <div>
                  <span className="font-medium">{item.quantity}x</span>{' '}
                  <span>{item.menu_item?.name || 'Item'}</span>
                </div>
                <span>₹{(Number(item.price_at_time) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <Separator className="my-3" />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span className="text-primary">₹{Number(order.total_amount).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Placed at</span>
              <span>{format(new Date(order.created_at), 'PPp')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment</span>
              <span>Cash on Delivery</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
