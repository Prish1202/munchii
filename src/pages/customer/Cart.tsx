import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useCreateOrder } from '@/hooks/useOrders';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingCart, Store } from 'lucide-react';

export default function Cart() {
  const navigate = useNavigate();
  const { items, restaurantId, restaurantName, updateQuantity, removeItem, clearCart, totalAmount } = useCart();
  const createOrder = useCreateOrder();
  const [isPlacing, setIsPlacing] = useState(false);

  const deliveryFee = 40;
  const tax = totalAmount * 0.05;
  const grandTotal = totalAmount + deliveryFee + tax;

  const handlePlaceOrder = async () => {
    if (!restaurantId || items.length === 0) return;

    setIsPlacing(true);
    try {
      await createOrder.mutateAsync({
        restaurantId,
        items: items.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: grandTotal,
      });
      clearCart();
      navigate('/customer/orders');
    } catch (error) {
      console.error('Failed to place order:', error);
    } finally {
      setIsPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6 pb-20 md:pb-0">
          <Link
            to="/customer/browse"
            className="inline-flex items-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Browse restaurants
          </Link>

          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add items from a restaurant to get started</p>
            <Link to="/customer/browse">
              <Button>Browse Restaurants</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-24 md:pb-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              to={`/customer/restaurant/${restaurantId}`}
              className="inline-flex items-center text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to menu
            </Link>
            <h1 className="text-2xl font-bold">Your Cart</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>

        {/* Restaurant Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{restaurantName}</h3>
                <p className="text-sm text-muted-foreground">{items.length} item(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cart Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">₹{item.price.toFixed(2)} each</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <Button
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="w-20 text-right font-medium">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Bill Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bill Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Item Total</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span>₹{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxes (5%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Grand Total</span>
              <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Place Order Button */}
        <div className="fixed bottom-16 md:bottom-4 left-0 right-0 p-4 md:left-64 bg-background/80 backdrop-blur-sm">
          <Button 
            className="w-full h-14 text-base shadow-lg"
            onClick={handlePlaceOrder}
            disabled={isPlacing}
          >
            {isPlacing ? 'Placing Order...' : `Place Order • ₹${grandTotal.toFixed(2)}`}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
