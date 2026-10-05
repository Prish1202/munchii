import { outletClosedLabel } from '@/lib/outletHours';
import { useState, useMemo, useEffect } from 'react';
import { applySeo, SITE_URL } from '@/components/seo/Seo';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useRestaurant, useMenuItems, useMenuCategories } from '@/hooks/useRestaurants';
import { lineKeyOf, useCart } from '@/contexts/CartContext';
import { isGrocery, usesPrepTime } from '@/lib/merchantTerms';
import { useRestaurantRating } from '@/hooks/useReviews';
import { OutletInfoDialog } from '@/components/customer/OutletInfoDialog';
import { ArrowLeft, Info, MapPin, Plus, Minus, ShoppingCart, Star, Clock, Percent, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn, resolveStorageUrl } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop';
const HERO_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop';

type SortOption = 'default' | 'price_low' | 'price_high' | 'name_asc' | 'discount';

export default function RestaurantMenu() {
  const { id } = useParams<{ id: string }>();
  const { data: restaurant, isLoading: loadingRestaurant } = useRestaurant(id!);
  const { data: ratingData } = useRestaurantRating(id);
  const { data: menuItems, isLoading: loadingMenu } = useMenuItems(id!);
  const { data: categories } = useMenuCategories(id!);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    if (!restaurant) return;
    const path = `/customer/restaurant/${id}`;
    const items = (menuItems ?? []) as any[];
    applySeo({
      title: `${restaurant.name} — Menu & Pre-order | Munchii`,
      description: `Pre-order from ${restaurant.name}${restaurant.address ? ` in ${restaurant.address}` : ''}. Browse ${items.length || 'the'} menu items, pick a pickup window and earn 3% Coins.`.slice(0, 160),
      path,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        name: restaurant.name,
        url: `${SITE_URL}${path}`,
        ...(restaurant.address ? { address: restaurant.address } : {}),
        ...(ratingData && ratingData.reviewCount > 0
          ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: ratingData.avgRating, reviewCount: ratingData.reviewCount } }
          : {}),
        hasMenu: {
          '@type': 'Menu',
          hasMenuItem: items.slice(0, 50).map((m) => ({
            '@type': 'MenuItem',
            name: m.name,
            ...(m.description ? { description: m.description } : {}),
            offers: { '@type': 'Offer', price: m.price, priceCurrency: 'INR' },
          })),
        },
      },
    });
  }, [restaurant, menuItems, ratingData, id]);
  const { items: cartItems, addItem, updateQuantity, totalItems, totalAmount, restaurantId } = useCart();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const grocery = isGrocery((restaurant as any)?.merchant_type);

  const getCartQuantity = (menuItemId: string, optionLabel?: string | null) => {
    const item = cartItems.find(i => lineKeyOf(i) === lineKeyOf({ menuItemId, optionLabel }));
    return item?.quantity || 0;
  };

  const handleAddItem = (item: any, opt?: { label: string; price: number }) => {
    if ((restaurant as any)?.is_active === false) { toast.error('This outlet is offline right now.'); return; }
    const discount = (item as any).discount_percent || 0;
    const basePrice = opt ? Number(opt.price) : item.price;
    const effectivePrice = discount > 0 ? basePrice * (1 - discount / 100) : basePrice;

    if (restaurantId && restaurantId !== id) {
      toast.warning('Cart cleared — items were from another restaurant.');
    }
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: effectivePrice,
      restaurantId: id!,
      restaurantName: restaurant?.name || '',
      preparationTimeMinutes: usesPrepTime(item.fulfillment_type) ? (item.preparation_time_minutes || 10) : 0,
      restaurantBufferMinutes: restaurant?.preparation_buffer_minutes || 5,
      optionLabel: opt?.label ?? null,
    });
    toast.success(`Added ${item.name}${opt ? ` (${opt.label})` : ''}`);
  };

  const heroImage = useMemo(() => {
    if ((restaurant as any)?.photo_url) {
      return resolveStorageUrl((restaurant as any).photo_url) || HERO_IMAGE;
    }
    return HERO_IMAGE;
  }, [restaurant]);

  const filteredAndSortedItems = useMemo(() => {
    let items = menuItems?.filter(item =>
      (activeCategory === 'all' || (item as any).category_id === activeCategory) &&
      (!search.trim() || item.name.toLowerCase().includes(search.toLowerCase()))
    ) || [];

    switch (sortBy) {
      case 'price_low':
        items = [...items].sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        items = [...items].sort((a, b) => b.price - a.price);
        break;
      case 'name_asc':
        items = [...items].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'discount':
        items = [...items].sort((a, b) => ((b as any).discount_percent || 0) - ((a as any).discount_percent || 0));
        break;
    }
    return items;
  }, [menuItems, activeCategory, search, sortBy]);

  const groceryCategories = useMemo(() => (categories ?? []).map(category => ({
    ...category,
    products: (menuItems ?? []).filter(item => item.category_id === category.id),
  })).filter(category => category.products.length > 0), [categories, menuItems]);

  const selectedCategoryName = categories?.find(category => category.id === activeCategory)?.name;
  const showGroceryCategories = grocery && activeCategory === 'all' && !search.trim();

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

  const closedLabel = outletClosedLabel(restaurant as any);

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
        <Link to="/customer/browse" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back
        </Link>

        <OutletInfoDialog open={infoOpen} onOpenChange={setInfoOpen} restaurant={restaurant as any} />

        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-5">
          <img src={heroImage} alt={restaurant.name} className="w-full h-44 sm:h-56 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h1 className="font-display font-bold text-2xl flex items-center gap-2">
              {restaurant.name}
              <button type="button" onClick={() => setInfoOpen(true)} aria-label="Outlet info"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25 backdrop-blur hover:bg-white/40">
                <Info className="h-4 w-4" />
              </button>
            </h1>
            <p className="text-sm opacity-90 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {restaurant.address}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <Badge className="bg-secondary text-secondary-foreground gap-1">
                <Star className="w-3 h-3 fill-current" />
                {ratingData && ratingData.reviewCount > 0
                  ? `${ratingData.avgRating} (${ratingData.reviewCount})`
                  : 'New'}
              </Badge>
              <span className="text-xs opacity-80 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Pickup
              </span>
            </div>
          </div>
        </div>

        {closedLabel && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
            <p className="font-semibold text-destructive">{closedLabel}</p>
            <p className="text-muted-foreground">{closedLabel === 'Offline' ? 'This outlet is not taking orders right now.' : 'You can only pick a pickup time when the outlet is open.'}</p>
          </div>
        )}

        {/* Menu header with search + filter */}
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-display font-semibold text-lg flex-1">{grocery ? (selectedCategoryName || 'Shop by category') : 'Menu'}</h2>
          <div className="relative flex-1 max-w-[200px]">
            <input
              type="text"
              placeholder={grocery ? 'Search products...' : 'Search items...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-3 py-1.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-xl h-8 w-8">
                <ArrowUpDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Sort items</DropdownMenuLabel>
              {([
                ['default', 'Default'],
                ['price_low', 'Price: Low → High'],
                ['price_high', 'Price: High → Low'],
                ['name_asc', 'Name A-Z'],
                ['discount', 'Best Discount'],
              ] as [SortOption, string][]).map(([val, label]) => (
                <DropdownMenuCheckboxItem key={val} checked={sortBy === val} onCheckedChange={() => setSortBy(val)}>
                  {label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Category filter */}
        {!grocery && categories && categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={cn('px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors', activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground')}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn('px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors', activeCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground')}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {grocery && activeCategory !== 'all' && (
          <div className="mb-4 flex items-center justify-between gap-3">
            <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setActiveCategory('all')}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />All categories
            </Button>
            <span className="text-xs text-muted-foreground">{filteredAndSortedItems.length} products</span>
          </div>
        )}

        {showGroceryCategories && groceryCategories.length > 0 && (
          <section className="mb-6">
            <div className="grid grid-flow-col grid-rows-2 auto-cols-[calc(50%-0.375rem)] gap-3 overflow-x-auto pb-3 scrollbar-hide sm:auto-cols-[calc(33.333%-0.5rem)]">
              {groceryCategories.map(category => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className="min-h-36 overflow-hidden rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="mb-2 block truncate text-sm font-bold text-foreground">{category.name}</span>
                  <span className="grid h-20 grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-lg bg-muted">
                    {category.products.slice(0, 4).map(product => (
                      <img
                        key={product.id}
                        src={resolveStorageUrl(product.image_url) || FALLBACK_IMAGE}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ))}
                  </span>
                  <span className="mt-2 block text-[11px] font-medium text-muted-foreground">{category.products.length} products</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {loadingMenu ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : showGroceryCategories && groceryCategories.length > 0 ? null : filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <p className="text-muted-foreground">{search ? 'No items match your search.' : 'No menu items available right now.'}</p>
          </div>
        ) : (
          <div className={grocery ? 'grid grid-cols-2 gap-3 sm:grid-cols-3' : 'space-y-3'}>
            {filteredAndSortedItems.map((item: any) => {
              const quantity = getCartQuantity(item.id);
              const image = resolveStorageUrl(item.image_url) || FALLBACK_IMAGE;
              const discount = item.discount_percent || 0;
              const discountedPrice = discount > 0 ? item.price * (1 - discount / 100) : item.price;
              const options: { label: string; price: number }[] = item.quantity_type && item.quantity_type !== 'FIXED' && Array.isArray(item.quantity_options) ? item.quantity_options : [];
              const hasOptions = options.length > 0;
              return (
                <div key={item.id} className={cn('bg-card rounded-xl border border-border p-3 hover:shadow-sm transition-shadow', grocery ? 'flex min-w-0 flex-col gap-2' : 'flex gap-3')}>
                  <div className={cn('relative rounded-xl overflow-hidden shrink-0 bg-muted', grocery ? 'aspect-square w-full' : 'w-24 h-24 sm:w-28 sm:h-28')}>
                    <img src={image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                    {discount > 0 && (
                      <div className="absolute top-1 left-1 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-lg flex items-center gap-0.5">
                        <Percent className="w-2.5 h-2.5" />{discount}% OFF
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                    <div>
                      <h3 className="font-display font-semibold text-sm sm:text-base truncate">{item.name}</h3>
                      <p className={cn('text-xs text-muted-foreground mt-0.5 line-clamp-2', grocery && 'hidden')}>
                        {item.description || 'Freshly prepared with premium ingredients'}
                      </p>
                    </div>
                    <div className={cn('mt-2 flex gap-2', grocery ? 'items-end justify-between' : 'items-center justify-between')}>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="font-semibold text-primary">{hasOptions ? 'from ' : ''}₹{(hasOptions ? Math.min(...options.map(o => discount > 0 ? o.price * (1 - discount / 100) : o.price)) : discountedPrice).toFixed(0)}</span>
                        {discount > 0 && (
                          <span className="text-xs text-muted-foreground line-through">₹{item.price}</span>
                        )}
                        {usesPrepTime(item.fulfillment_type) && <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> ~{item.preparation_time_minutes || 10} min
                        </span>}
                        {grocery && hasOptions && <span className="truncate text-[11px] text-muted-foreground">{options[0]?.label}</span>}
                      </div>
                      {hasOptions ? null : quantity > 0 ? (
                        <div className="flex items-center gap-1.5 bg-primary/10 rounded-lg px-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-primary hover:bg-primary/20" onClick={() => updateQuantity(item.id, quantity - 1)}>
                            <Minus className="w-3.5 h-3.5" />
                          </Button>
                          <span className="w-5 text-center font-bold text-sm text-primary">{quantity}</span>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-primary hover:bg-primary/20" onClick={() => handleAddItem(item)}>
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="h-8 rounded-lg border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => handleAddItem(item)}>
                          ADD
                        </Button>
                      )}
                    </div>
                    {hasOptions && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {options.map(opt => {
                          const q = getCartQuantity(item.id, opt.label);
                          const p = discount > 0 ? opt.price * (1 - discount / 100) : opt.price;
                          return q > 0 ? (
                            <div key={opt.label} className="flex items-center gap-1 rounded-lg bg-primary/10 px-1 text-xs font-semibold text-primary">
                              <button type="button" aria-label={`Remove ${opt.label}`} className="p-1" onClick={() => updateQuantity(lineKeyOf({ menuItemId: item.id, optionLabel: opt.label }), q - 1)}><Minus className="w-3 h-3" /></button>
                              {opt.label} ×{q}
                              <button type="button" aria-label={`Add ${opt.label}`} className="p-1" onClick={() => handleAddItem(item, opt)}><Plus className="w-3 h-3" /></button>
                            </div>
                          ) : (
                            <button key={opt.label} type="button" onClick={() => handleAddItem(item, opt)}
                              className="rounded-lg border border-primary px-2 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground">
                              {opt.label} · ₹{p.toFixed(0)}
                            </button>
                          );
                        })}
                      </div>
                    )}
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
              <div className="gradient-primary text-primary-foreground rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-xl">
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
