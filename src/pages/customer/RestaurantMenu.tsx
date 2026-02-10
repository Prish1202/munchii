import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useRestaurant, useMenuItems } from '@/hooks/useRestaurants';
import { useCart } from '@/contexts/CartContext';
import { ArrowLeft, MapPin, Plus, Minus, ShoppingCart, Star, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&h=300&fit=crop',
];

function getImageForItem(id: string) {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return FOOD_IMAGES[hash % FOOD_IMAGES.length];
}

const HERO_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop';

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
      toast.warning('Cart cleared — items were from another restaurant.');
    }
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      restaurantId: id!,
      restaurantName: restaurant?.name || '',
    });
    toast.success(`Added ${item.name}`);
  };

  if (loadingRestaurant) {
    return (
      <DashboardLayout>
        <div className="space-y-4 max-w-3xl mx-auto">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-8 w-48" />
          <div className="space-y-4 mt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!restaurant) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="font-display font-semibold text-xl">Restaurant not found</h2>
          <Link to="/customer/browse" className="text-primary hover:underline mt-2 text-sm">
            Back to restaurants
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="pb-28 md:pb-0 max-w-3xl mx-auto">
        {/* Back */}
        <Link
          to="/customer/browse"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back
        </Link>

        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-5">
          <img src={HERO_IMAGE} alt={restaurant.name} className="w-full h-44 sm:h-56 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h1 className="font-display font-bold text-2xl">{restaurant.name}</h1>
            <p className="text-sm opacity-90 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {restaurant.address}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <Badge className="bg-green-600 text-white gap-1">
                <Star className="w-3 h-3 fill-current" /> 4.2
              </Badge>
              <span className="text-xs opacity-80 flex items-center gap-1">
                <Clock className="w-3 h-3" /> 25-35 min
              </span>
            </div>
          </div>
        </div>

        {/* Menu */}
        <h2 className="font-display font-semibold text-lg mb-4">Menu</h2>

        {loadingMenu ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : menuItems?.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <p className="text-muted-foreground">No menu items available right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {menuItems?.map((item) => {
              const quantity = getCartQuantity(item.id);
              const image = getImageForItem(item.id);
              return (
                <div
                  key={item.id}
                  className="flex gap-3 bg-card rounded-xl border border-border p-3 hover:shadow-sm transition-shadow"
                >
                  {/* Image */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0">
                    <img src={image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <h3 className="font-display font-semibold text-sm sm:text-base truncate">{item.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        Freshly prepared with premium ingredients
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-semibold text-primary">₹{item.price}</span>
                      {quantity > 0 ? (
                        <div className="flex items-center gap-1.5 bg-primary/10 rounded-lg px-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-primary hover:bg-primary/20"
                            onClick={() => updateQuantity(item.id, quantity - 1)}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </Button>
                          <span className="w-5 text-center font-bold text-sm text-primary">{quantity}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-primary hover:bg-primary/20"
                            onClick={() => handleAddItem(item)}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-lg border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                          onClick={() => handleAddItem(item)}
                        >
                          ADD
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sticky cart bar */}
        {totalItems > 0 && (
          <div className="fixed bottom-16 md:bottom-4 left-0 right-0 p-4 md:left-64 z-40">
            <Link to="/customer/cart">
              <div className="bg-primary text-primary-foreground rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="font-semibold">{totalItems} item{totalItems > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">₹{totalAmount.toFixed(0)}</span>
                  <span className="text-sm opacity-80">→</span>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
