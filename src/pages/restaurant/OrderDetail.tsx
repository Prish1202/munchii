import { useParams, Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useRestaurantOrders, useUpdateOrderStatus } from '@/hooks/useRestaurantOrders';
import { OrderStatus } from '@/hooks/useOrders';
import { ArrowLeft, Clock, User, Phone, Banknote, Wallet, CreditCard, ChefHat, ShoppingBag, Package, Check, X } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

const STATUS_CONFIG: Record<string, { label: string; color: string; nextStatus?: OrderStatus; nextLabel?: string }> = {
  placed: { label: 'New', color: 'bg-blue-500', nextStatus: 'accepted', nextLabel: 'Accept Order' },
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

export default function RestaurantOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data: orders, isLoading } = useRestaurantOrders();
  const updateStatus = useUpdateOrderStatus();
  const [cashCollected, setCashCollected] = useState(false);

  const order = orders?.find(o => o.id === orderId);
  const config = order ? STATUS_CONFIG[order.status] : null;
  const platformFee = 4;
  const itemTotal = order ? Math.max(Number(order.total_amount) - platformFee, 0) : 0;
  const isCOD = order?.payment_method === 'cod';
  const isNew = order?.status === 'placed';
  const isReadyForPickup = order?.status === 'ready_for_pickup';
  const paymentInfo = PAYMENT_LABELS[order?.payment_method || 'cod'] || PAYMENT_LABELS.cod;
  const PaymentIcon = paymentInfo.icon;

  const handleUpdateStatus = (status: OrderStatus) => {
    if (!orderId) return;
    updateStatus.mutate({ orderId, status });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-4 pb-20 md:pb-0">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Order not found</p>
          <Link to="/restaurant/orders"><Button variant="outline">Back to Orders</Button></Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4 pb-20 md:pb-0">
        {/* Header */}
        <div>
          <button onClick={() => navigate(-1)} className="inline-flex items-center text-muted-foreground hover:text-foreground mb-2 text-sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Order #{order.id.slice(-6).toUpperCase()}</h1>
            {config && <Badge className={`${config.color} text-white`}>{config.label}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3" />
            {format(new Date(order.created_at), 'PPp')} ({formatDistanceToNow(new Date(order.created_at), { addSuffix: true })})
          </p>
        </div>

        {/* Customer Info */}
        {order.customer && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{order.customer.name}</span>
              </div>
              {order.customer.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{order.customer.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pickup Time */}
        {order.pickup_time && (
          <Card>
            <CardContent className="p-4 flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Pickup Time:</span>
              <span>{format(new Date(order.pickup_time), 'PPp')}</span>
            </CardContent>
          </Card>
        )}

        {/* Order Items */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.order_items?.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium bg-secondary rounded-md px-2 py-0.5">{item.quantity}x</span>
                    <span className="text-sm">{item.menu_item?.name || 'Item'}</span>
                  </div>
                  <span className="text-sm font-medium">₹{(item.quantity * Number(item.price_at_time)).toFixed(0)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-sm font-semibold">
                <span>Item Total</span>
                <span className="text-primary">₹{itemTotal.toFixed(0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PaymentIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{paymentInfo.label}</span>
            </div>
            <span className="text-sm font-semibold">₹{Number(order.total_amount).toFixed(0)}</span>
          </CardContent>
        </Card>

        {/* COD Cash Collection */}
        {isCOD && isReadyForPickup && (
          <Card className="border-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Banknote className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-amber-800 dark:text-amber-300">Collect Cash: ₹{Number(order.total_amount).toFixed(0)}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Collect ₹{Number(order.total_amount).toFixed(0)} from customer (includes ₹{platformFee} platform fee). Your earning: ₹{itemTotal.toFixed(0)}
              </p>
              {!cashCollected ? (
                <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setCashCollected(true)} disabled={updateStatus.isPending}>
                  <Banknote className="w-4 h-4 mr-2" /> Cash Collected
                </Button>
              ) : (
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => handleUpdateStatus('picked_up')} disabled={updateStatus.isPending}>
                  <Package className="w-4 h-4 mr-2" /> Complete Order (Picked Up)
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {!['picked_up', 'completed', 'cancelled'].includes(order.status) && (
          <div className="flex gap-3">
            {isNew ? (
              <>
                <Button variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleUpdateStatus('cancelled')} disabled={updateStatus.isPending}>
                  <X className="w-4 h-4 mr-2" /> Reject
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus('accepted')} disabled={updateStatus.isPending}>
                  <Check className="w-4 h-4 mr-2" /> Accept
                </Button>
              </>
            ) : (isCOD && isReadyForPickup) ? null : config?.nextStatus ? (
              <Button className="w-full bg-restaurant hover:bg-restaurant/90" onClick={() => handleUpdateStatus(config.nextStatus!)} disabled={updateStatus.isPending}>
                {order.status === 'accepted' && <ChefHat className="w-4 h-4 mr-2" />}
                {order.status === 'preparing' && <ShoppingBag className="w-4 h-4 mr-2" />}
                {!isCOD && isReadyForPickup && <Package className="w-4 h-4 mr-2" />}
                {config.nextLabel}
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
