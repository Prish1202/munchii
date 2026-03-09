import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateOrder } from '@/hooks/useOrders';
import { ArrowLeft, Phone, CreditCard, Banknote, Wallet, Loader2, Coins, Clock3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWallet, useRedeemCoins } from '@/hooks/useWallet';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { parseDateTimeLocalValue, toDateTimeLocalValue } from '@/lib/datetimeLocal';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Pay at Pickup', icon: Banknote },
  { id: 'upi', label: 'UPI', icon: Wallet },
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
];

const MIN_PICKUP_LEAD_MINUTES = 5;

function getMinPickupDate(now = new Date()) {
  // Enforce: selected pickup time must be >= (now + lead time), rounded UP to the next full minute.
  const minMs = now.getTime() + MIN_PICKUP_LEAD_MINUTES * 60_000;
  const d = new Date(minMs);
  const needsRoundUp = d.getSeconds() !== 0 || d.getMilliseconds() !== 0;
  d.setSeconds(0, 0);
  if (needsRoundUp) d.setMinutes(d.getMinutes() + 1);
  return d;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, restaurantId, restaurantName, totalAmount, clearCart } = useCart();
  const createOrder = useCreateOrder();

  const { data: wallet } = useWallet();
  const redeemCoins = useRedeemCoins();

  const [phone, setPhone] = useState(user?.phone || '');
  const [payment, setPayment] = useState('cod');
  const [pickupTime, setPickupTime] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [useCoins, setUseCoins] = useState(false);

  // Keep the min value "live" so the user cannot pick a time that becomes invalid while the page is open.
  const [minPickupValue, setMinPickupValue] = useState(() => toDateTimeLocalValue(getMinPickupDate()));
  useEffect(() => {
    const tick = () => setMinPickupValue(toDateTimeLocalValue(getMinPickupDate()));
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, []);

  const minPickupDate = useMemo(() => parseDateTimeLocalValue(minPickupValue) ?? getMinPickupDate(), [minPickupValue]);
  const selectedPickupDate = useMemo(() => (pickupTime ? parseDateTimeLocalValue(pickupTime) : null), [pickupTime]);
  const isPickupTimeValid = useMemo(() => {
    if (!pickupTime) return true;
    if (!selectedPickupDate) return false;
    return selectedPickupDate.getTime() >= minPickupDate.getTime();
  }, [minPickupDate, pickupTime, selectedPickupDate]);

  const platformFee = 5;
  const subtotalWithFees = totalAmount + platformFee;
  const availableCoins = wallet?.total_coins || 0;
  const maxCoinDiscount = Math.min(availableCoins, Math.floor(subtotalWithFees * 0.5)); // max 50% discount
  const coinDiscount = useCoins ? maxCoinDiscount : 0;
  const grandTotal = subtotalWithFees - coinDiscount;
  const estimatedPoints = Math.round(totalAmount * 0.03);

  const canPlace = phone.trim().length >= 10 && items.length > 0 && isPickupTimeValid;

  const handlePickupTimeChange = (nextValue: string) => {
    if (!nextValue) {
      setPickupTime('');
      return;
    }

    const nextDate = parseDateTimeLocalValue(nextValue);
    const freshMin = getMinPickupDate();

    if (!nextDate || nextDate.getTime() < freshMin.getTime()) {
      const clamped = toDateTimeLocalValue(freshMin);
      setPickupTime(clamped);
      toast.error(`Pickup time must be at least ${MIN_PICKUP_LEAD_MINUTES} minutes from now.`);
      return;
    }

    setPickupTime(nextValue);
  };

  const handlePlaceOrder = async () => {
    if (!restaurantId || !canPlace) {
      if (!isPickupTimeValid) toast.error(`Pickup time must be at least ${MIN_PICKUP_LEAD_MINUTES} minutes from now.`);
      return;
    }

    // Re-check right before submit (covers the case where the user waits and the chosen time becomes "past").
    if (pickupTime) {
      const pickup = parseDateTimeLocalValue(pickupTime);
      const freshMin = getMinPickupDate();
      if (!pickup || pickup.getTime() < freshMin.getTime()) {
        const clamped = toDateTimeLocalValue(freshMin);
        setPickupTime(clamped);
        toast.error(`Pickup time must be after ${format(freshMin, 'PPp')}.`);
        return;
      }
    }

    setIsPlacing(true);
    try {
      const order = await createOrder.mutateAsync({
        restaurantId,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: grandTotal,
        paymentMethod: payment,
        pickupTime: pickupTime ? new Date(pickupTime).toISOString() : undefined,
      });
      if (coinDiscount > 0) {
        await redeemCoins.mutateAsync({ coins: coinDiscount, orderId: order.id });
      }
      clearCart();
      navigate(`/customer/order-success/${order.id}`);
    } catch {
      // error handled by hook
    } finally {
      setIsPlacing(false);
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

        {/* Pickup time */}
        <section className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Clock3 className="w-4 h-4 text-primary" />
            Pickup Time (Optional)
          </div>
          <div className="flex gap-2 flex-wrap">
            {[15, 30, 45, 60].map((mins) => {
              const target = new Date(Date.now() + mins * 60_000);
              const value = toDateTimeLocalValue(target);
              const isSelected = pickupTime === value;
              return (
                <button
                  key={mins}
                  onClick={() => handlePickupTimeChange(isSelected ? '' : value)}
                  className={cn(
                    'px-3 py-2 rounded-xl border text-sm font-medium transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-muted-foreground/30 text-muted-foreground'
                  )}
                >
                  +{mins} min
                </button>
              );
            })}
          </div>
          <Input
            type="datetime-local"
            value={pickupTime}
            onChange={(e) => handlePickupTimeChange(e.target.value)}
            min={minPickupValue}
            className="mt-1"
          />
          {!isPickupTimeValid && (
            <p className="text-xs text-destructive">
              Pickup time must be at least {MIN_PICKUP_LEAD_MINUTES} minutes from now.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Pick a quick option or set a custom time (minimum {MIN_PICKUP_LEAD_MINUTES} minutes from now).
          </p>
        </section>

        {/* Coins Discount */}
        {availableCoins > 0 && (
          <section className="bg-card rounded-2xl border border-border p-4">
            <button
              onClick={() => setUseCoins(!useCoins)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors',
                useCoins ? 'border-primary bg-primary/5' : 'border-border'
              )}
            >
              <div className="flex items-center gap-3">
                <Coins className={cn('w-5 h-5', useCoins ? 'text-primary' : 'text-muted-foreground')} />
                <div className="text-left">
                  <span className="text-sm font-medium">Use {maxCoinDiscount} coins</span>
                  <p className="text-xs text-muted-foreground">
                    Save ₹{maxCoinDiscount} · Balance: {availableCoins} coins
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
              <span>₹{platformFee}</span>
            </div>
            {pickupTime && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pickup Time</span>
                <span>{format(new Date(pickupTime), 'PPp')}</span>
              </div>
            )}
          </div>
          {coinDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="text-muted-foreground">Coin Discount</span>
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
                You'll earn <strong>{estimatedPoints} points</strong> (3% of item price) on completion
              </span>
            </div>
          )}
        </section>

        {/* Place order */}
        <div className="fixed bottom-16 md:bottom-4 left-0 right-0 p-4 md:left-64 z-40 bg-background/80 backdrop-blur-sm">
          <Button className="w-full h-14 text-base rounded-2xl shadow-xl" onClick={handlePlaceOrder} disabled={isPlacing || !canPlace}>
            {isPlacing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Placing Order...
              </>
            ) : (
              `Place Pickup Order • ₹${grandTotal.toFixed(0)}`
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
