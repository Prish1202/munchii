import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateOrder } from '@/hooks/useOrders';
import { ArrowLeft, MapPin, Phone, CreditCard, Banknote, Wallet, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on Delivery', icon: Banknote },
  { id: 'upi', label: 'UPI', icon: Wallet },
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, restaurantId, restaurantName, totalAmount, clearCart } = useCart();
  const createOrder = useCreateOrder();

  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [payment, setPayment] = useState('cod');
  const [isPlacing, setIsPlacing] = useState(false);

  const deliveryFee = 40;
  const platformFee = 10;
  const tax = Math.round(totalAmount * 0.05 * 100) / 100;
  const grandTotal = totalAmount + deliveryFee + platformFee + tax;

  const canPlace = address.trim().length > 5 && phone.trim().length >= 10 && items.length > 0;

  const handlePlaceOrder = async () => {
    if (!restaurantId || !canPlace) return;
    setIsPlacing(true);
    try {
      const order = await createOrder.mutateAsync({
        restaurantId,
        items: items.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: grandTotal,
      });
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
        <Link
          to="/customer/cart"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to cart
        </Link>

        <h1 className="font-display font-bold text-2xl">Checkout</h1>

        {/* Delivery Address */}
        <section className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="w-4 h-4 text-primary" />
            Delivery Address
          </div>
          <Input
            placeholder="Enter your full delivery address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </section>

        {/* Phone */}
        <section className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Phone className="w-4 h-4 text-primary" />
            Contact Number
          </div>
          <Input
            placeholder="Your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
          />
        </section>

        {/* Payment */}
        <section className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <Label className="text-sm font-semibold">Payment Method</Label>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setPayment(m.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left',
                    payment === m.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  <Icon className={cn('w-5 h-5', payment === m.id ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="text-sm font-medium">{m.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Order summary */}
        <section className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <h3 className="text-sm font-semibold">Order Summary — {restaurantName}</h3>
          <div className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-muted-foreground">{item.quantity}× {item.name}</span>
                <span>₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{totalAmount.toFixed(0)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery Fee</span><span>₹{deliveryFee}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee</span><span>₹{platformFee}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Taxes (5%)</span><span>₹{tax.toFixed(0)}</span></div>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-primary">₹{grandTotal.toFixed(0)}</span>
          </div>
        </section>

        {/* Place order */}
        <div className="fixed bottom-16 md:bottom-4 left-0 right-0 p-4 md:left-64 z-40 bg-background/80 backdrop-blur-sm">
          <Button
            className="w-full h-14 text-base rounded-2xl shadow-xl"
            onClick={handlePlaceOrder}
            disabled={isPlacing || !canPlace}
          >
            {isPlacing ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Placing Order...</>
            ) : (
              `Place Order • ₹${grandTotal.toFixed(0)}`
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
