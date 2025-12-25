import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRestaurant, useMenuItems } from '@/hooks/useRestaurants';
import { useCart } from '@/contexts/CartContext';
import { ArrowLeft, MapPin, Plus, Minus, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

export default function RestaurantMenu() {
  const { id } = useParams<{ id: string }>();
  const { data: restaurant, isLoading: loadingRestaurant } = useRestaurant(id!);
  const { data: menuItems, isLoading: loadingMenu } = useMenuItems(id!);
  const { items: cartItems, addItem, updateQuantity, totalItems, totalAmount, restaurantId } = useCart();

  const getCartQuantity = (menuItemId: string) => {
    const item = cartItems.find(i => i.menuItemId === menuItemId);
    return item?.quantity || 0;
  };

  const handleAddItem = (item: { id: string; name: string; price: number }) => {
    if (restaurantId && restaurantId !== id) {
      toast.warning('Your cart contains items from another restaurant. Adding this will clear your cart.');
    }
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      restaurantId: id!,
      restaurantName: restaurant?.name || '',
    });
    toast.success(`Added ${item.name} to cart`);
  };

  if (loadingRestaurant) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!restaurant) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Restaurant not found</h2>
          <Link to="/customer/browse" className="text-primary hover:underline">
            Back to restaurants
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-24 md:pb-0">
        {/* Back Button */}
        <Link
          to="/customer/browse"
          className="inline-flex items-center text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to restaurants
        </Link>

        {/* Restaurant Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{restaurant.name}</h1>
          <p className="text-muted-foreground flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {restaurant.address}
          </p>
        </div>

        {/* Menu Items */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Menu</h2>
          
          {loadingMenu ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))
          ) : menuItems?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No menu items available</p>
              </CardContent>
            </Card>
          ) : (
            menuItems?.map((item) => {
              const quantity = getCartQuantity(item.id);
              return (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-primary font-medium">₹{item.price.toFixed(2)}</p>
                      </div>
                      
                      {quantity > 0 ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, quantity - 1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{quantity}</span>
                          <Button
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleAddItem(item)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAddItem(item)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Cart Footer */}
        {totalItems > 0 && (
          <div className="fixed bottom-16 md:bottom-4 left-0 right-0 p-4 md:left-64">
            <Link to="/customer/cart">
              <Button className="w-full h-14 text-base shadow-lg">
                <ShoppingCart className="w-5 h-5 mr-2" />
                View Cart ({totalItems} items) • ₹{totalAmount.toFixed(2)}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
