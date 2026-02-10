import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingCart, Store } from 'lucide-react';

export default function Cart() {
  const { items, restaurantId, restaurantName, updateQuantity, removeItem, clearCart, totalAmount } = useCart();

  const deliveryFee = 40;
  const platformFee = 10;
  const tax = Math.round(totalAmount * 0.05 * 100) / 100;
  const grandTotal = totalAmount + deliveryFee + platformFee + tax;

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
                <p className="text-xs text-muted-foreground">₹{item.price} each</p>
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

        {/* Bill */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-2.5 text-sm">
          <h3 className="font-display font-semibold text-base">Bill Details</h3>
          <div className="flex justify-between"><span className="text-muted-foreground">Item Total</span><span>₹{totalAmount.toFixed(0)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Delivery Fee</span><span>₹{deliveryFee}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee</span><span>₹{platformFee}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Taxes (5%)</span><span>₹{tax.toFixed(0)}</span></div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Grand Total</span>
            <span className="text-primary">₹{grandTotal.toFixed(0)}</span>
          </div>
        </div>

        {/* Checkout button */}
        <div className="fixed bottom-16 md:bottom-4 left-0 right-0 p-4 md:left-64 z-40 bg-background/80 backdrop-blur-sm">
          <Link to="/customer/checkout">
            <Button className="w-full h-14 text-base rounded-2xl shadow-xl">
              Proceed to Checkout • ₹{grandTotal.toFixed(0)}
            </Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
