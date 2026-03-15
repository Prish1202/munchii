import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
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
  ShoppingBag,
  Clock,
  Wifi,
  WifiOff,
  KeyRound,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { OrderProgressBar } from '@/components/customer/OrderProgressBar';

const ORDER_STEPS: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'placed', label: 'Order Placed', icon: <Package className="w-4 h-4" /> },
  { status: 'accepted', label: 'Accepted', icon: <Store className="w-4 h-4" /> },
  { status: 'preparing', label: 'Preparing', icon: <ChefHat className="w-4 h-4" /> },
  { status: 'ready_for_pickup', label: 'Ready for Pickup', icon: <ShoppingBag className="w-4 h-4" /> },
  { status: 'picked_up', label: 'Picked Up', icon: <ShoppingBag className="w-4 h-4" /> },
  { status: 'completed', label: 'Completed', icon: <CheckCircle2 className="w-4 h-4" /> },
];

const STATUS_ORDER: OrderStatus[] = ['placed', 'accepted', 'preparing', 'ready_for_pickup', 'picked_up', 'completed'];

const STATUS_MESSAGES: Record<OrderStatus, string> = {
  placed: '🛒 Order placed!',
  accepted: '✅ Restaurant accepted your order!',
  preparing: '👨‍🍳 Your food is being prepared!',
  ready_for_pickup: '📦 Your order is ready for pickup!',
  picked_up: '🎉 Your order has been picked up!',
  completed: '🏆 Order complete! Points credited to your wallet.',
  cancelled: '❌ Order was cancelled',
};

export default function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, restaurant:restaurants(name, address)`)
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

  const { isConnected } = useRealtimeSync({
    channelName: `order-tracking-${id}`,
    table: 'orders',
    filter: `id=eq.${id}`,
    onUpdate: handleOrderUpdate,
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <h2 className="font-display font-semibold text-xl">Order not found</h2>
          <Link to="/customer/orders" className="text-primary text-sm hover:underline mt-2 inline-block">
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
      <div className="max-w-xl mx-auto pb-20 md:pb-0 space-y-5">
        <div>
          <Link
            to="/customer/orders"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to orders
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="font-display font-bold text-2xl">Order #{id?.slice(-6).toUpperCase()}</h1>
            <div className="flex items-center gap-2">
              {isCancelled && <Badge variant="destructive">Cancelled</Badge>}
              <Badge variant={isConnected ? 'default' : 'secondary'} className="gap-1 text-xs">
                {isConnected ? <><Wifi className="w-3 h-3" /> Live</> : <><WifiOff className="w-3 h-3" /> Connecting</>}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
          </p>
        </div>

        {/* OTP Card - show when order is active (not completed/cancelled) */}
        {!isCancelled && order.status !== 'completed' && (order as any).pickup_otp && (
          <div className="bg-primary/5 border-2 border-primary/30 rounded-2xl p-5 text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-sm text-primary">Pickup OTP</h3>
            </div>
            <p className="text-3xl font-display font-bold tracking-[0.3em] text-primary">
              {(order as any).pickup_otp}
            </p>
            <p className="text-xs text-muted-foreground">
              Share this code with the restaurant when you pick up your order
            </p>
          </div>
        )}

        {!isCancelled && (

        {!isCancelled && (
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-display font-semibold text-sm mb-5">Order Status</h3>
            <div className="relative">
              {ORDER_STEPS.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                const isLast = index === ORDER_STEPS.length - 1;
                return (
                  <div key={step.status} className="flex gap-4 relative">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0',
                          isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
                      </div>
                      {!isLast && (
                        <div className={cn('w-0.5 h-8 my-1', isCompleted && index < currentStatusIndex ? 'bg-primary' : 'bg-border')} />
                      )}
                    </div>
                    <div className="pt-1">
                      <p className={cn('text-sm font-medium', isCompleted ? 'text-foreground' : 'text-muted-foreground')}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-primary animate-pulse mt-0.5">In progress…</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Store className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm">{order.restaurant?.name}</h3>
            <p className="text-xs text-muted-foreground">{order.restaurant?.address}</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <h3 className="font-display font-semibold text-sm">Order Items</h3>
          {orderItems?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span><span className="font-medium">{item.quantity}×</span> {item.menu_item?.name || 'Item'}</span>
              <span>₹{(Number(item.price_at_time) * item.quantity).toFixed(0)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span className="text-primary">₹{Number(order.total_amount).toFixed(0)}</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 space-y-2 text-sm">
          <h3 className="font-display font-semibold text-sm mb-1">Order Details</h3>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-mono text-xs">#{order.id.slice(-6).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Placed at</span>
            <span>{format(new Date(order.created_at), 'PPp')}</span>
          </div>
          {order.pickup_time && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pickup Time</span>
              <span className="font-medium text-primary">{format(new Date(order.pickup_time), 'PPp')}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span>Pickup</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
