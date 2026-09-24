import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingCart, Store, Coins, Clock3 } from 'lucide-react';
import { useAvailablePickupWindows } from '@/hooks/useAvailablePickupWindows';
import { cn } from '@/lib/utils';

export default function Cart() {
  const {
    items,
    restaurantId,
    restaurantName,
    updateQuantity,
    removeItem,
    clearCart,
    totalAmount,
    longestPreparationMinutes,
    restaurantBufferMinutes,
    selectedPickupTime,
    setSelectedPickupTime,
  } = useCart();

  const platformFee = 4;
  const grandTotal = totalAmount + platformFee;
  const estimatedPoints = Math.round(totalAmount * 0.03);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const { windows, paused: ordersPaused } = useAvailablePickupWindows({
    restaurantId,
    preparationMinutes: longestPreparationMinutes,
    bufferMinutes: restaurantBufferMinutes,
    now,
  });

  // Keep a valid future window selected at all times
  useEffect(() => {
    if (windows.length === 0) return;
    const isStillAvailable = selectedPickupTime && windows.some((w) => w.value === selectedPickupTime);
    if (!isStillAvailable) setSelectedPickupTime(windows[0].value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windows, selectedPickupTime]);

  if (items.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <ShoppingCart className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="font-display font-semibold text-xl">Your cart is empty</h2>
          <p className="text-sm text-muted-foreground mt-1">Add items from a restaurant to get started</p>
          <Link to="/customer/browse" className="mt-5">
            <Button>Browse Restaurants</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const earliest = windows[0];

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto pb-28 md:pb-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              to={`/customer/restaurant/${restaurantId}`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-1"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to menu
            </Link>
            <h1 className="font-display font-bold text-2xl">Your Cart</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4 mr-1.5" />
            Clear
          </Button>
        </div>

        {/* Restaurant */}
        <div className="flex items-center gap-3 bg-card rounded-xl border border-border p-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Store className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm">{restaurantName}</h3>
            <p className="text-xs text-muted-foreground">{items.length} item{items.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Items */}
        <div className="bg-card rounded-2xl border border-border divide-y divide-border">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 p-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                <p className="text-xs text-muted-foreground">
                  ₹{item.price} each · ~{item.preparationTimeMinutes || 10} min
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-primary/10 rounded-lg px-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-primary hover:bg-primary/20"
                  onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <span className="w-5 text-center font-bold text-sm text-primary">{item.quantity}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-primary hover:bg-primary/20"
                  onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              <span className="w-16 text-right font-semibold text-sm">₹{(item.price * item.quantity).toFixed(0)}</span>
            </div>
          ))}
        </div>

        {/* Pickup windows */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock3 className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold text-base">Pickup Window</h3>
          </div>
          {earliest && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">Earliest available</p>
              <p className="text-sm font-semibold text-primary">{earliest.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Based on {longestPreparationMinutes} min prep + {restaurantBufferMinutes} min kitchen buffer
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {windows.map((w) => (
              <button
                key={w.value}
                onClick={() => setSelectedPickupTime(w.value)}
                className={cn(
                  'px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors text-center',
                  selectedPickupTime === w.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-muted-foreground/30 text-muted-foreground',
                )}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bill */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-2.5 text-sm">
          <h3 className="font-display font-semibold text-base">Bill Details</h3>
          <div className="flex justify-between"><span className="text-muted-foreground">Item Total</span><span>₹{totalAmount.toFixed(0)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee</span><span>₹{platformFee}</span></div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Grand Total</span>
            <span className="text-primary">₹{grandTotal.toFixed(0)}</span>
          </div>
        </div>

        {/* Points preview */}
        {estimatedPoints > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">+{estimatedPoints} Coins on this order</p>
              <p className="text-xs text-muted-foreground">3% of item total, credited after successful pickup</p>
            </div>
          </div>
        )}

        {/* Checkout button */}
        <div className="fixed bottom-16 md:bottom-4 left-0 right-0 p-4 md:left-64 z-40 bg-background/80 backdrop-blur-sm">
          <Link to="/customer/checkout">
            <Button className="w-full h-14 text-base rounded-2xl shadow-xl" disabled={!selectedPickupTime}>
              Proceed to Checkout • ₹{grandTotal.toFixed(0)}
            </Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
