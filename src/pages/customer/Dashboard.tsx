import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Crosshair, Loader2, MapPin, Plus, Search, Store, Home as HomeIcon, Briefcase, Trash2 } from 'lucide-react';
import { AddAddressDialog } from '@/components/customer/AddAddressDialog';
import { AreaComingSoon } from '@/components/customer/AreaComingSoon';
import { useSavedAddresses, useDeleteAddress } from '@/hooks/useSavedAddresses';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLocation } from '@/contexts/LocationContext';
import { distanceKm } from '@/lib/geo';
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
const NEARBY_KM = 15;

const SEARCH_PLACEHOLDERS: Record<MerchantType, string> = {
  restaurant: 'Search restaurants or dishes',
  canteen: 'Search campus canteens or meals',
  grocery: 'Search grocery stores or essentials',
};

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
  const { data: restaurants, isLoading } = useRestaurants(null, category);
  const { data: wallet } = useWallet();
  const { coords, addressLabel, city: liveCity, isDetecting, error: locError, requestLiveLocation, setManualLocation } = useLocation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const { data: savedAddresses = [] } = useSavedAddresses();
  const deleteAddress = useDeleteAddress();
  const useLive = !!coords && !selectedCity;

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
    let list = restaurants || [];
    if (selectedCity) list = list.filter(r => (r.city || '').toLowerCase() === selectedCity.toLowerCase());
    if (term) list = list.filter(restaurant =>
      restaurant.name.toLowerCase().includes(term) ||
      restaurant.address.toLowerCase().includes(term) ||
      matchingRestaurantIds.includes(restaurant.id)
    );
    const withDist = list.map(r => ({
      r,
      d: coords && r.latitude != null && r.longitude != null ? distanceKm(coords, { lat: Number(r.latitude), lng: Number(r.longitude) }) : null,
    }));
    // Only nearby outlets (within 15 km) when we know where the user is; un-pinned outlets stay if in the same city.
    const nearby = coords && !selectedCity
      ? withDist.filter(x => x.d != null ? x.d <= NEARBY_KM : (!!liveCity && (x.r.city || '').toLowerCase() === liveCity.toLowerCase()))
      : withDist;
    // Nearest first; outlets without a map pin go last.
    nearby.sort((x, y) => (x.d ?? Infinity) - (y.d ?? Infinity));
    return nearby;
  }, [matchingRestaurantIds, restaurants, search, selectedCity, coords, liveCity]);

  const selectCity = (city: string) => {
    setSelectedCity(city);
    setCityInput(city);
    setShowSuggestions(false);
    setPickerOpen(false);
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
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button type="button" className="flex max-w-full items-start gap-2 text-left" aria-label="Change location">
              <MapPin className="mt-0.5 h-6 w-6 shrink-0 fill-primary/15 text-primary" />
              <span className="min-w-0">
                <span className="flex items-center gap-1 font-display text-lg font-extrabold leading-tight">
                  {useLive ? (savedAddresses.find(a => addressLabel === [a.house, a.area].filter(Boolean).join(', '))?.label || 'Current location') : selectedCity || 'Set location'}
                  <ChevronDown className="h-5 w-5" />
                </span>
                <span className="block max-w-[70vw] truncate text-xs text-muted-foreground">
                  {isDetecting ? 'Detecting your location…' : useLive ? (addressLabel || 'Near you') : selectedCity ? 'Showing outlets in this city' : 'Allow location to see nearest outlets'}
                </span>
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 rounded-2xl p-3">
            <button type="button" onClick={() => { clearCity(); requestLiveLocation(); setPickerOpen(false); }}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-muted">
              {isDetecting ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Crosshair className="h-5 w-5 text-primary" />}
              <span>
                <span className="block text-sm font-bold text-primary">Use current location</span>
                <span className="block text-xs text-muted-foreground">{locError || addressLabel || 'Using GPS'}</span>
              </span>
            </button>
            <button type="button" onClick={() => { setPickerOpen(false); setAddOpen(true); }}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-muted">
              <Plus className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold text-primary">Add address</span>
            </button>
            {savedAddresses.length > 0 && (
              <div className="mt-1 border-t border-border pt-2">
                <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Saved addresses</p>
                <div className="max-h-48 overflow-auto">
                  {savedAddresses.map(a => {
                    const Icon = a.label === 'Home' ? HomeIcon : a.label === 'Work' ? Briefcase : MapPin;
                    return (
                      <div key={a.id} className="flex items-start gap-2 rounded-lg px-3 py-2 hover:bg-muted">
                        <button type="button" className="flex min-w-0 flex-1 items-start gap-3 text-left" onClick={() => {
                          clearCity();
                          setManualLocation({ lat: a.latitude, lng: a.longitude }, [a.house, a.area].filter(Boolean).join(', '), a.city);
                          setPickerOpen(false);
                        }}>
                          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">{a.label}</span>
                            <span className="block truncate text-xs text-muted-foreground">{[a.house, a.area, a.landmark].filter(Boolean).join(', ')}</span>
                          </span>
                        </button>
                        <button type="button" aria-label="Delete address" onClick={() => deleteAddress.mutate(a.id)} className="p-1 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={cityInput} onChange={e => { setCityInput(e.target.value); setShowSuggestions(true); }}
                placeholder="Search city" className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" />
            </div>
            <div className="mt-2 max-h-56 overflow-auto">
              {(cityInput.trim() ? filteredCities : registeredCities || []).map(city => (
                <button key={city} type="button" onClick={() => selectCity(city)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-muted">
                  <MapPin className="h-4 w-4 text-primary" /> {city}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <AddAddressDialog open={addOpen} onOpenChange={setAddOpen} onSaved={a => {
          clearCity();
          setManualLocation({ lat: a.latitude, lng: a.longitude }, [a.house, a.area].filter(Boolean).join(', '), a.city);
        }} />

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

        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={SEARCH_PLACEHOLDERS[category]}
            aria-label={SEARCH_PLACEHOLDERS[category]}
            className="h-13 w-full rounded-xl border border-border bg-background pl-12 pr-4 text-sm font-medium outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold">{search ? 'Search results' : `${activeCategory.tagline} nearby`}</h2>
              <p className="text-sm text-muted-foreground">Pre-order, pick up, and earn Coins on every order.</p>
            </div>
            <Link to="/customer/browse" className="shrink-0 text-sm font-semibold text-primary hover:underline">See all</Link>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <RestaurantCardSkeleton key={index} />)}</div>
          ) : filteredRestaurants.length === 0 && !search.trim() ? (
            <AreaComingSoon category={category} city={selectedCity || liveCity} areaLabel={useLive ? addressLabel : selectedCity} coords={useLive ? coords : null} />
          ) : filteredRestaurants.length === 0 ? (
            <EmptyState icon={<Store className="h-7 w-7 text-muted-foreground" />} title={`No ${activeCategory.tagline.toLowerCase()} found`} description={search ? "Try another name." : "Nothing in this category in your city yet."} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredRestaurants.map(({ r, d }) => <RestaurantCard key={r.id} restaurant={r} distanceKm={d} />)}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}