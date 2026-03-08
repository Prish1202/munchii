import { useState } from 'react';
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

const STATUS_CONFIG: Record<string, { label: string; color: string; nextStatus?: OrderStatus; nextLabel?: string }> = {
  placed: { label: 'New', color: 'bg-blue-500', nextStatus: 'accepted', nextLabel: 'Accept' },
  accepted: { label: 'Accepted', color: 'bg-indigo-500', nextStatus: 'preparing', nextLabel: 'Start Preparing' },
  preparing: { label: 'Preparing', color: 'bg-yellow-500', nextStatus: 'ready_for_pickup', nextLabel: 'Mark Ready for Pickup' },
  ready_for_pickup: { label: 'Ready for Pickup', color: 'bg-orange-500', nextStatus: 'picked_up', nextLabel: 'Mark Picked Up' },
  picked_up: { label: 'Picked Up', color: 'bg-purple-500' },
  completed: { label: 'Completed', color: 'bg-green-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500' },
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

  const pendingOrders = orders?.filter(o => o.status === 'placed') || [];
  const activeOrders = orders?.filter(o => ['accepted', 'preparing', 'ready_for_pickup'].includes(o.status)) || [];
  const completedOrders = orders?.filter(o => ['picked_up', 'completed', 'cancelled'].includes(o.status)) || [];

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
          <p className="text-muted-foreground">Manage incoming and active orders</p>
        </div>

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
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
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

            {activeOrders.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4">Active Orders ({activeOrders.length})</h2>
                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <OrderCard key={order.id} order={order} onUpdateStatus={(status) => updateStatus.mutate({ orderId: order.id, status })} isUpdating={updateStatus.isPending} />
                  ))}
                </div>
              </section>
            )}

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
                <h2 className="text-lg font-semibold mb-4">Recent Completed ({completedOrders.length})</h2>
                <div className="space-y-4">
                  {completedOrders.slice(0, 5).map((order) => (<OrderCard key={order.id} order={order} compact />))}
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
  const platformFee = 5;
  const itemTotal = Math.max(Number(order.total_amount) - platformFee, 0);

  const orderItems = order.order_items?.map(item => 
    `${item.quantity}x ${item.menu_item?.name || 'Item'}`
  ).join(', ') || 'No items';

  return (
    <Card className={isNew ? 'border-amber-500 shadow-lg' : ''}>
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
          <>
            {order.customer && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <User className="w-4 h-4" />
                <span>{order.customer.name}</span>
                {order.customer.phone && <span>• {order.customer.phone}</span>}
              </div>
            )}

            <div className="bg-secondary/50 rounded-lg p-3 mb-4">
              <p className="text-sm">{orderItems}</p>
            </div>

            {/* COD Cash Collection for ready_for_pickup */}
            {isCOD && isReadyForPickup && onUpdateStatus && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Banknote className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-amber-800 dark:text-amber-300">Collect Cash: ₹{Number(order.total_amount).toFixed(0)}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Collect ₹{Number(order.total_amount).toFixed(0)} from customer (includes ₹{platformFee} platform fee). Your earning: ₹{itemTotal.toFixed(0)}
                </p>
                {!cashCollected ? (
                  <Button
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => setCashCollected(true)}
                    disabled={isUpdating}
                  >
                    <Banknote className="w-4 h-4 mr-2" />
                    Cash Collected
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => onUpdateStatus('picked_up')}
                    disabled={isUpdating}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Complete Order (Picked Up)
                  </Button>
                )}
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
                ) : (isCOD && isReadyForPickup) ? null : config.nextStatus ? (
                  <Button className="w-full bg-restaurant hover:bg-restaurant/90" onClick={() => onUpdateStatus(config.nextStatus!)} disabled={isUpdating}>
                    {order.status === 'accepted' && <ChefHat className="w-4 h-4 mr-2" />}
                    {order.status === 'preparing' && <ShoppingBag className="w-4 h-4 mr-2" />}
                    {!isCOD && order.status === 'ready_for_pickup' && <Package className="w-4 h-4 mr-2" />}
                    {config.nextLabel}
                  </Button>
                ) : null}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
