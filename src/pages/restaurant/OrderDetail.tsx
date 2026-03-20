import { useParams, Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useRestaurantOrders, useUpdateOrderStatus } from '@/hooks/useRestaurantOrders';
import { OrderStatus } from '@/hooks/useOrders';
import { ArrowLeft, Clock, User, Phone, Banknote, Wallet, CreditCard, ChefHat, ShoppingBag, Package, Check, X, KeyRound, Loader2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; color: string; nextStatus?: OrderStatus; nextLabel?: string }> = {
  placed: { label: 'New', color: 'bg-secondary', nextStatus: 'accepted', nextLabel: 'Accept Order' },
  accepted: { label: 'Accepted', color: 'bg-accent', nextStatus: 'preparing', nextLabel: 'Start Preparing' },
  preparing: { label: 'Preparing', color: 'bg-primary', nextStatus: 'ready_for_pickup', nextLabel: 'Mark Ready for Pickup' },
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

export default function RestaurantOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data: orders, isLoading } = useRestaurantOrders();
  const updateStatus = useUpdateOrderStatus();
  const [cashCollected, setCashCollected] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState(false);

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

  const handleOtpVerifyAndPickup = () => {
    const orderOtp = (order as any)?.pickup_otp;
    if (!orderOtp || otpInput !== orderOtp) {
      setOtpError(true);
      toast.error('Invalid OTP. Please check with the customer.');
      return;
    }
    setOtpError(false);
    handleUpdateStatus('picked_up');
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

        {/* OTP Verification for Ready for Pickup */}
        {isReadyForPickup && (
          <Card className="border-primary/40">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                <span className="font-semibold text-primary">Verify Customer OTP</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Ask the customer for their 4-digit pickup OTP to verify and complete the handover.
              </p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Enter 4-digit OTP"
                  value={otpInput}
                  onChange={e => {
                    setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                    setOtpError(false);
                  }}
                  className={`flex-1 text-center text-xl tracking-[0.3em] font-bold rounded-xl ${otpError ? 'border-destructive' : ''}`}
                />
                <Button
                  onClick={handleOtpVerifyAndPickup}
                  disabled={otpInput.length !== 4 || updateStatus.isPending}
                  className="rounded-xl px-6"
                >
                  {updateStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                  Verify
                </Button>
              </div>
              {otpError && <p className="text-xs text-destructive">Invalid OTP. Please try again.</p>}
            </CardContent>
          </Card>
        )}

        {/* COD Cash Collection - only before OTP verify */}
        {isCOD && isReadyForPickup && (
          <Card className="border-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Banknote className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Collect Cash: ₹{Number(order.total_amount).toFixed(0)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Collect ₹{Number(order.total_amount).toFixed(0)} from customer (includes ₹{platformFee} platform fee). Your earning: ₹{itemTotal.toFixed(0)}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {!['ready_for_pickup', 'picked_up', 'completed', 'cancelled'].includes(order.status) && (
          <div className="flex gap-3">
            {isNew ? (
              <>
                <Button variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleUpdateStatus('cancelled')} disabled={updateStatus.isPending}>
                  <X className="w-4 h-4 mr-2" /> Reject
                </Button>
                <Button className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground" onClick={() => handleUpdateStatus('accepted')} disabled={updateStatus.isPending}>
                  <Check className="w-4 h-4 mr-2" /> Accept
                </Button>
              </>
            ) : config?.nextStatus ? (
              <Button className="w-full bg-restaurant hover:bg-restaurant/90" onClick={() => handleUpdateStatus(config.nextStatus!)} disabled={updateStatus.isPending}>
                {order.status === 'accepted' && <ChefHat className="w-4 h-4 mr-2" />}
                {order.status === 'preparing' && <ShoppingBag className="w-4 h-4 mr-2" />}
                {config.nextLabel}
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
