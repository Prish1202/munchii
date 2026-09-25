import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Coins, MapPin, Search, Store, Timer, X } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RestaurantCard } from '@/components/customer/RestaurantCard';
import { RestaurantCardSkeleton } from '@/components/customer/RestaurantCardSkeleton';
import { EmptyState } from '@/components/customer/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useRegisteredCities } from '@/hooks/useRegisteredCities';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { MERCHANT_TYPES, MerchantType } from '@/lib/merchantTerms';

const CITY_PERSIST_KEY = 'foodyzone_dashboard_city';
const CATEGORY_KEY = 'munchii_home_category';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [cityInput, setCityInput] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [search, setSearch] = useState('');
  const { data: registeredCities } = useRegisteredCities();
  const [category, setCategory] = useState<MerchantType>(() => (localStorage.getItem(CATEGORY_KEY) as MerchantType) || 'restaurant');
  const pickCategory = (c: MerchantType) => { setCategory(c); localStorage.setItem(CATEGORY_KEY, c); };
  const activeCategory = MERCHANT_TYPES.find(t => t.value === category)!;
  const { data: restaurants, isLoading } = useRestaurants(selectedCity, category);
  const { data: wallet } = useWallet();

  useEffect(() => {
    const saved = localStorage.getItem(CITY_PERSIST_KEY);
    if (saved) {
      setSelectedCity(saved);
      setCityInput(saved);
    }
  }, []);

  const { data: matchingRestaurantIds = [] } = useQuery({
    queryKey: ['restaurant-food-search', search],
    enabled: search.trim().length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('restaurant_id')
        .eq('available', true)
        .ilike('name', `%${search.trim()}%`)
        .limit(100);
      if (error) throw error;
      return [...new Set((data || []).map(item => item.restaurant_id))];
    },
  });

  const filteredCities = useMemo(() => {
    if (!registeredCities || !cityInput.trim()) return [];
    return registeredCities.filter(city => city.toLowerCase().includes(cityInput.toLowerCase()));
  }, [registeredCities, cityInput]);

  const filteredRestaurants = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return restaurants || [];
    return (restaurants || []).filter(restaurant =>
      restaurant.name.toLowerCase().includes(term) ||
      restaurant.address.toLowerCase().includes(term) ||
      matchingRestaurantIds.includes(restaurant.id)
    );
  }, [matchingRestaurantIds, restaurants, search]);

  const selectCity = (city: string) => {
    setSelectedCity(city);
    setCityInput(city);
    setShowSuggestions(false);
    localStorage.setItem(CITY_PERSIST_KEY, city);
  };

  const clearCity = () => {
    setCityInput('');
    setSelectedCity(null);
    setShowSuggestions(false);
    localStorage.removeItem(CITY_PERSIST_KEY);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-5 pb-24 md:pb-4">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Hey, {user?.name?.split(' ')[0] || 'Foodie'}!</p>
              <h1 className="mt-1 max-w-xl font-display text-2xl font-bold text-foreground md:text-3xl">
                Pre-order. Skip the wait. Earn 3% Coins.
              </h1>
            </div>
            <Link to="/customer/coins" className="shrink-0 rounded-xl bg-coin/15 px-3 py-2 text-right ring-1 ring-coin/30">
              <p className="text-[11px] font-semibold text-muted-foreground">Your Coins</p>
              <p className="font-display text-lg font-bold text-foreground">{wallet?.total_coins || 0}</p>
            </Link>
          </div>

          <div className="mt-5 relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder={category === 'grocery' ? 'Search stores or products' : 'Search restaurants or food'}
              className="h-13 w-full rounded-xl border border-border bg-background pl-12 pr-4 text-sm font-medium outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </section>

        <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Category">
          {MERCHANT_TYPES.map(t => (
            <button key={t.value} type="button" role="tab" aria-selected={category === t.value} onClick={() => pickCategory(t.value)}
              className={`rounded-2xl border p-3 text-left transition-colors ${category === t.value ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-border bg-card hover:border-primary/40'}`}>
              <span className="text-2xl" aria-hidden>{t.emoji}</span>
              <p className="mt-1 font-display text-sm font-bold">{t.short}</p>
              <p className="text-[11px] leading-tight text-muted-foreground">{t.tagline}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <Timer className="h-5 w-5 text-primary" />
            <p className="mt-2 font-display text-sm font-bold">Pre-order & Pickup</p>
            <p className="mt-1 text-xs text-muted-foreground">Choose a ready-time window and skip the queue.</p>
          </div>
          <div className="rounded-xl border border-coin/30 bg-coin/10 p-4">
            <Coins className="h-5 w-5 text-coin-foreground" />
            <p className="mt-2 font-display text-sm font-bold">Earn 3% Coins</p>
            <p className="mt-1 text-xs text-muted-foreground">On every completed order.</p>
          </div>
        </div>

        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <input
            value={cityInput}
            onChange={event => {
              setCityInput(event.target.value);
              setShowSuggestions(true);
              if (!event.target.value.trim()) {
                setSelectedCity(null);
                localStorage.removeItem(CITY_PERSIST_KEY);
              }
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => window.setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Choose your city"
            className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-10 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          {cityInput && (
            <button type="button" aria-label="Clear city" onClick={clearCity} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
          {showSuggestions && filteredCities.length > 0 && (
            <div className="absolute top-full z-40 mt-2 w-full overflow-hidden rounded-xl border border-border bg-card shadow-soft">
              {filteredCities.map(city => (
                <button key={city} type="button" onMouseDown={() => selectCity(city)} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium hover:bg-muted">
                  <MapPin className="h-4 w-4 text-primary" /> {city}
                </button>
              ))}
            </div>
          )}
        </div>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold">{search ? 'Search results' : `${activeCategory.tagline} nearby`}</h2>
              <p className="text-sm text-muted-foreground">Pre-order, pick up, and earn Coins on every order.</p>
            </div>
            <Link to="/customer/browse" className="shrink-0 text-sm font-semibold text-primary hover:underline">See all</Link>
          </div>

          {!selectedCity ? (
            <div className="rounded-xl border border-border bg-card py-12 text-center">
              <MapPin className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 font-semibold">Choose your city to see nearby places</p>
            </div>
          ) : isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <RestaurantCardSkeleton key={index} />)}</div>
          ) : filteredRestaurants.length === 0 ? (
            <EmptyState icon={<Store className="h-7 w-7 text-muted-foreground" />} title={`No ${activeCategory.tagline.toLowerCase()} found`} description={search ? "Try another name." : "Nothing in this category in your city yet."} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredRestaurants.map(restaurant => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}