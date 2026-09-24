import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateOrder } from '@/hooks/useOrders';
import { useRazorpay } from '@/hooks/useRazorpay';
import { ArrowLeft, Phone, CreditCard, Banknote, Loader2, Coins, Clock3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWallet, useRedeemCoins } from '@/hooks/useWallet';
import { toast } from 'sonner';
import { useAvailablePickupWindows } from '@/hooks/useAvailablePickupWindows';
import { formatPickupWindow } from '@/lib/pickupWindows';

const PAYMENT_METHODS = [
  { id: 'razorpay', label: 'Pay Online (UPI / Card)', icon: CreditCard },
];

const PLATFORM_FEE = 4;

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    items,
    restaurantId,
    restaurantName,
    totalAmount,
    clearCart,
    longestPreparationMinutes,
    restaurantBufferMinutes,
    selectedPickupTime,
    setSelectedPickupTime,
  } = useCart();
  const createOrder = useCreateOrder();
  const { initiatePayment, isProcessing: isRazorpayProcessing } = useRazorpay();

  const { data: wallet } = useWallet();
  const redeemCoins = useRedeemCoins();

  const [phone, setPhone] = useState(user?.phone || '');
  const [payment, setPayment] = useState('razorpay');
  const [isPlacing, setIsPlacing] = useState(false);
  const [useCoins, setUseCoins] = useState(false);
  const [coinInputValue, setCoinInputValue] = useState('');

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const { windows, paused: ordersPaused, slotMinutes } = useAvailablePickupWindows({
    restaurantId,
    preparationMinutes: longestPreparationMinutes,
    bufferMinutes: restaurantBufferMinutes,
    now,
  });

  const pickupTime = selectedPickupTime && windows.some((w) => w.value === selectedPickupTime)
    ? selectedPickupTime
    : windows[0]?.value || '';

  useEffect(() => {
    if (pickupTime && pickupTime !== selectedPickupTime) setSelectedPickupTime(pickupTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupTime]);

  const subtotalWithFees = totalAmount + PLATFORM_FEE;
  const availableCoins = wallet?.total_coins || 0;
  const maxCoinDiscount = Math.min(availableCoins, Math.floor(subtotalWithFees * 0.5));
  const parsedCoinInput = Math.min(Math.max(parseInt(coinInputValue) || 0, 0), maxCoinDiscount);
  const coinDiscount = useCoins ? parsedCoinInput : 0;
  const grandTotal = subtotalWithFees - coinDiscount;
  const estimatedPoints = Math.round(totalAmount * 0.03);

  const canPlace = phone.trim().length >= 10 && items.length > 0 && !!pickupTime;

  const handlePlaceOrder = async () => {
    if (!restaurantId || !canPlace) {
      if (!pickupTime) toast.error('Please select a pickup window.');
      return;
    }

    setIsPlacing(true);
    try {
      // Create order in DB with status 'placed'
      const order = await createOrder.mutateAsync({
        restaurantId,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: grandTotal,
        paymentMethod: payment === 'razorpay' ? 'razorpay' : 'cod',
        pickupTime: pickupTime || undefined,
        prepMinutes: longestPreparationMinutes,
      });

      // Redeem coins if applicable
      if (coinDiscount > 0) {
        await redeemCoins.mutateAsync({ coins: coinDiscount, orderId: order.id });
      }

      // Initiate Razorpay payment
      initiatePayment({
        orderId: order.id,
        userName: user?.name,
        userEmail: user?.email,
        userPhone: phone,
        onSuccess: (orderId) => {
          clearCart();
          navigate(`/customer/order-success/${orderId}`);
        },
        onFailure: () => {
          setIsPlacing(false);
          toast.error('Payment failed. You can retry from your orders page.');
        },
      });
    } catch {
      // error handled by hook
    } finally {
      // Payment processing handled by Razorpay callback
    }
  };

  if (items.length === 0) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="font-display font-semibold text-xl">Your cart is empty</h2>
          <Link to="/customer/browse" className="text-primary text-sm hover:underline mt-2 inline-block">
            Browse restaurants
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const busy = isPlacing || isRazorpayProcessing;

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto pb-28 md:pb-6 space-y-5">
        <Link to="/customer/cart" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to cart
        </Link>

        <h1 className="font-display font-bold text-2xl">Checkout</h1>

        {/* Phone */}
        <section className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Phone className="w-4 h-4 text-primary" />
            Contact Number
          </div>
          <Input placeholder="Your phone number" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
        </section>

        {/* Payment */}
        <section className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="text-sm font-semibold">Payment Method</div>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setPayment(m.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left',
                    payment === m.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  <Icon className={cn('w-5 h-5', payment === m.id ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="text-sm font-medium">{m.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Pickup window */}
        <section className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Clock3 className="w-4 h-4 text-primary" />
            Pickup Window <span className="text-destructive">*</span>
          </div>
          {windows.length === 0 && (<p className="text-sm rounded-xl bg-muted p-3 text-muted-foreground">{ordersPaused ? 'This restaurant has paused new orders for a short while. Please check back soon.' : 'All pickup slots are full right now. Please check back in a few minutes.'}</p>)}
          <div className="grid grid-cols-2 gap-2">
            {windows.map((w) => (
              <button
                key={w.value}
                onClick={() => setSelectedPickupTime(w.value)}
                className={cn(
                  'px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors text-center',
                  pickupTime === w.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-muted-foreground/30 text-muted-foreground'
                )}
              >
                {w.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Earliest window uses the longest prep time in your cart ({longestPreparationMinutes} min) plus a{' '}
            {restaurantBufferMinutes} min kitchen buffer.
          </p>
        </section>

        {/* Coins Discount */}
        {availableCoins > 0 && (
          <section className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <button
              onClick={() => {
                const next = !useCoins;
                setUseCoins(next);
                if (next && !coinInputValue) setCoinInputValue(String(maxCoinDiscount));
              }}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors',
                useCoins ? 'border-primary bg-primary/5' : 'border-border'
              )}
            >
              <div className="flex items-center gap-3">
                <Coins className={cn('w-5 h-5', useCoins ? 'text-primary' : 'text-muted-foreground')} />
                <div className="text-left">
                  <span className="text-sm font-medium">Use Points</span>
                  <p className="text-xs text-muted-foreground">
                    Balance: {availableCoins} pts · Max: {maxCoinDiscount} pts (50% cap)
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 transition-colors',
                  useCoins ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                )}
              />
            </button>
            {useCoins && (
              <div className="flex items-center gap-3 px-1">
                <Input
                  type="number"
                  min={0}
                  max={maxCoinDiscount}
                  value={coinInputValue}
                  onChange={e => setCoinInputValue(e.target.value)}
                  placeholder={`Enter points (max ${maxCoinDiscount})`}
                  className="flex-1 rounded-xl"
                />
                <button
                  onClick={() => setCoinInputValue(String(maxCoinDiscount))}
                  className="text-xs font-semibold text-primary hover:underline whitespace-nowrap"
                >
                  Use Max
                </button>
              </div>
            )}
            {useCoins && parsedCoinInput > 0 && (
              <p className="text-xs text-primary font-medium px-1">
                Saving ₹{parsedCoinInput} with {parsedCoinInput} points
              </p>
            )}
          </section>
        )}

        {/* Order summary */}
        <section className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <h3 className="text-sm font-semibold">Order Summary — {restaurantName}</h3>
          <div className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-muted-foreground">
                  {item.quantity}× {item.name}
                </span>
                <span>₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{totalAmount.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform Fee</span>
              <span>₹{PLATFORM_FEE}</span>
            </div>
            {pickupTime && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pickup Window</span>
                <span>{formatPickupWindow(pickupTime, slotMinutes)}</span>
              </div>
            )}
          </div>
          {coinDiscount > 0 && (
            <div className="flex justify-between text-primary">
              <span className="text-muted-foreground">Points Discount</span>
              <span>-₹{coinDiscount}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-primary">₹{grandTotal.toFixed(0)}</span>
          </div>
          {estimatedPoints > 0 && (
            <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 rounded-lg px-3 py-2 mt-2">
              <Coins className="w-4 h-4" />
              <span>
                You'll earn <strong>+{estimatedPoints} Coins</strong> (3% of item total) after pickup
              </span>
            </div>
          )}
        </section>

        {/* Place order */}
        <div className="fixed bottom-16 md:bottom-4 left-0 right-0 p-4 md:left-64 z-40 bg-background/80 backdrop-blur-sm">
          <Button className="w-full h-14 text-base rounded-2xl shadow-xl" onClick={handlePlaceOrder} disabled={busy || !canPlace}>
            {busy ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              `Pay ₹${grandTotal.toFixed(0)} Online`
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
