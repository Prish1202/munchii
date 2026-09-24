import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PauseOrdersControl } from '@/components/restaurant/PickupCapacitySettings';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRestaurantOrders, useUpdateOrderStatus, RestaurantOrder } from '@/hooks/useRestaurantOrders';
import { useMyRestaurant } from '@/hooks/useMenuManagement';
import { OrderStatus } from '@/hooks/useOrders';
import { 
  ArrowLeft, Check, X, ChefHat, Package, Clock, User, ShoppingBag, Banknote, CreditCard, Wallet
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { formatPickupWindow } from '@/lib/pickupWindows';

const STATUS_CONFIG: Record<string, { label: string; color: string; nextStatus?: OrderStatus; nextLabel?: string }> = {
  placed: { label: 'New', color: 'bg-secondary', nextStatus: 'accepted', nextLabel: 'Accept' },
  accepted: { label: 'Accepted', color: 'bg-accent', nextStatus: 'preparing', nextLabel: 'Start Preparing' },
  preparing: { label: 'Preparing', color: 'bg-primary', nextStatus: 'ready_for_pickup', nextLabel: 'Mark Ready' },
  ready_for_pickup: { label: 'Ready for Pickup', color: 'bg-primary' },
  picked_up: { label: 'Picked Up', color: 'bg-secondary' },
  completed: { label: 'Completed', color: 'bg-secondary' },
  cancelled: { label: 'Cancelled', color: 'bg-destructive' },
};

const PAYMENT_LABELS: Record<string, { label: string; icon: typeof Banknote }> = {
  cod: { label: 'Cash on Pickup', icon: Banknote },
  upi: { label: 'UPI', icon: Wallet },
  card: { label: 'Card', icon: CreditCard },
};

export default function RestaurantOrders() {
  const { data: restaurant } = useMyRestaurant();
  const { data: orders, isLoading } = useRestaurantOrders();
  const updateStatus = useUpdateOrderStatus();

  const queryClient = useQueryClient();
  const [, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30_000); return () => clearInterval(id); }, []);
  const updateRestaurant = async (patch: Record<string, unknown>) => {
    const { error } = await supabase.from('restaurants').update(patch as any).eq('id', restaurant!.id);
    if (error) { toast.error('Could not update'); return; }
    queryClient.invalidateQueries({ queryKey: ['my-restaurant'] });
  };
  const byPickup = (a: RestaurantOrder, b: RestaurantOrder) =>
    new Date(a.pickup_time || a.created_at).getTime() - new Date(b.pickup_time || b.created_at).getTime();
  const nowMs = Date.now();
  const startsNow = (o: RestaurantOrder) => !(o as any).prep_start_at || new Date((o as any).prep_start_at).getTime() <= nowMs;
  const pendingOrders = (orders?.filter(o => o.status === 'placed') || []).sort(byPickup);
  const preparingOrders = (orders?.filter(o => o.status === 'preparing' || (o.status === 'accepted' && startsNow(o))) || []).sort(byPickup);
  const upcomingOrders = (orders?.filter(o => o.status === 'accepted' && !startsNow(o)) || []).sort(byPickup);
  const readyOrders = (orders?.filter(o => o.status === 'ready_for_pickup') || []).sort(byPickup);
  const completedOrders = orders?.filter(o => ['picked_up', 'completed', 'cancelled'].includes(o.status)) || [];
  const sections: [string, RestaurantOrder[]][] = [['Preparing Now', preparingOrders], ['Upcoming', upcomingOrders], ['Ready for Pickup', readyOrders]];

  if (!restaurant) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please set up your restaurant first.</p>
          <Link to="/restaurant/settings" className="text-primary hover:underline">Go to Settings</Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 md:pb-0">
        <div>
          <Link to="/restaurant" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Kitchen queue, sorted by pickup window</p>
        </div>
        <PauseOrdersControl restaurant={restaurant} update={updateRestaurant} />

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-48 w-full" />))}
          </div>
        ) : (
          <>
            {pendingOrders.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                  New Orders ({pendingOrders.length})
                </h2>
                <div className="space-y-4">
                  {pendingOrders.map((order) => (
                    <OrderCard key={order.id} order={order} onUpdateStatus={(status) => updateStatus.mutate({ orderId: order.id, status })} isUpdating={updateStatus.isPending} />
                  ))}
                </div>
              </section>
            )}

            {sections.map(([title, list]) => list.length > 0 && (
              <section key={title}>
                <h2 className="text-lg font-semibold mb-4">{title} ({list.length})</h2>
                <div className="space-y-4">
                  {list.map((order) => (
                    <OrderCard key={order.id} order={order} onUpdateStatus={(status) => updateStatus.mutate({ orderId: order.id, status })} isUpdating={updateStatus.isPending} />
                  ))}
                </div>
              </section>
            ))}

            {orders?.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No orders yet</h3>
                  <p className="text-sm text-muted-foreground">Orders will appear here when customers place them</p>
                </CardContent>
              </Card>
            )}

            {completedOrders.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4">Completed ({completedOrders.length})</h2>
                <div className="space-y-4">
                  {completedOrders.map((order) => (<OrderCard key={order.id} order={order} compact />))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function OrderCard({ order, onUpdateStatus, isUpdating, compact = false }: { order: RestaurantOrder; onUpdateStatus?: (status: OrderStatus) => void; isUpdating?: boolean; compact?: boolean }) {
  const config = STATUS_CONFIG[order.status];
  const isNew = order.status === 'placed';
  const isCOD = (order as any).payment_method === 'cod';
  const isReadyForPickup = order.status === 'ready_for_pickup';
  const [cashCollected, setCashCollected] = useState(false);

  const paymentInfo = PAYMENT_LABELS[(order as any).payment_method || 'cod'] || PAYMENT_LABELS.cod;
  const PaymentIcon = paymentInfo.icon;

  // Restaurant sees item amount (excluding ₹5 platform fee)
  const platformFee = 4;
  const itemTotal = Math.max(Number(order.total_amount) - platformFee, 0);
  const orderItems = order.order_items?.map(item => `${item.quantity}x ${item.menu_item?.name || 'Item'}`).join(', ') || 'No items';

  const pickupTimeLabel = order.pickup_time
    ? `${format(new Date(order.pickup_time), 'd MMM')} · ${formatPickupWindow(order.pickup_time)}`
    : null;

  return (
    <Link to={`/restaurant/orders/${order.id}`}>
    <Card className={`${isNew ? 'border-amber-500 shadow-lg' : ''} hover:shadow-md transition-shadow cursor-pointer`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">#{order.id.slice(-6).toUpperCase()}</span>
              <Badge className={`${config.color} text-white`}>{config.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-lg text-primary">₹{itemTotal.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Item total</p>
          </div>
        </div>

        {/* Payment Method Badge */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="flex items-center gap-1.5">
            <PaymentIcon className="w-3.5 h-3.5" />
            {paymentInfo.label}
          </Badge>
        </div>

        {!compact && (
          <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            {order.customer && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <User className="w-4 h-4" />
                <span>{order.customer.name}</span>
                {order.customer.phone && <span>• {order.customer.phone}</span>}
              </div>
            )}

            {pickupTimeLabel && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Clock className="w-4 h-4" />
                <span>Pickup: <b className="text-foreground">{pickupTimeLabel}</b></span>
              </div>
            )}
            {(order as any).prep_start_at && ['placed', 'accepted'].includes(order.status) && (
              <div className="flex items-center gap-2 text-sm mb-3 text-primary font-medium">
                <ChefHat className="w-4 h-4" />
                <span>Start preparing at {format(new Date((order as any).prep_start_at), 'h:mm a')}</span>
              </div>
            )}

            <div className="bg-secondary/50 rounded-lg p-3 mb-4">
              <p className="text-sm">{orderItems}</p>
            </div>

            {/* OTP Required for Pickup - redirect to detail page */}
            {isReadyForPickup && onUpdateStatus && (
              <div className="bg-primary/5 border border-primary/30 rounded-xl p-4 mb-4 text-center">
                <p className="text-sm font-medium text-primary">OTP verification required</p>
                <p className="text-xs text-muted-foreground mt-1">Tap to open order details and verify customer OTP</p>
              </div>
            )}

            {onUpdateStatus && (
              <div className="flex gap-2">
                {isNew ? (
                  <>
                    <Button variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive/10" onClick={() => onUpdateStatus('cancelled')} disabled={isUpdating}>
                      <X className="w-4 h-4 mr-2" />Reject
                    </Button>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => onUpdateStatus('accepted')} disabled={isUpdating}>
                      <Check className="w-4 h-4 mr-2" />Accept
                    </Button>
                  </>
                ) : isReadyForPickup ? null : config.nextStatus ? (
                  <Button className="w-full bg-restaurant hover:bg-restaurant/90" onClick={() => onUpdateStatus(config.nextStatus!)} disabled={isUpdating}>
                    {order.status === 'accepted' && <ChefHat className="w-4 h-4 mr-2" />}
                    {order.status === 'preparing' && <ShoppingBag className="w-4 h-4 mr-2" />}
                    {!isCOD && order.status === 'ready_for_pickup' && <Package className="w-4 h-4 mr-2" />}
                    {config.nextLabel}
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    </Link>
  );
}
