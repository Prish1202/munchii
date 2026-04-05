import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SearchBar } from '@/components/customer/SearchBar';
import { CategoryFilter } from '@/components/customer/CategoryFilter';
import { PromoBanner } from '@/components/customer/PromoBanner';
import { RestaurantCard } from '@/components/customer/RestaurantCard';
import { RestaurantCardSkeleton } from '@/components/customer/RestaurantCardSkeleton';
import { EmptyState } from '@/components/customer/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useRegisteredCities } from '@/hooks/useRegisteredCities';
import { useWallet } from '@/hooks/useWallet';
import { MapPin, ChevronRight, Store, Loader2, Sparkles, Rocket, Search, X, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

const CITY_PERSIST_KEY = 'foodyzone_dashboard_city';

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'name_asc', label: 'Name A-Z' },
  { id: 'name_desc', label: 'Name Z-A' },
  { id: 'newest', label: 'Newest' },
] as const;

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [cityInput, setCityInput] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [showPickupOnly, setShowPickupOnly] = useState(false);

  const { data: registeredCities, isLoading: loadingCities } = useRegisteredCities();
  const { data: restaurants, isLoading } = useRestaurants(selectedCity);
  const { data: wallet } = useWallet();

  // Restore persisted city on mount
  useEffect(() => {
    const saved = localStorage.getItem(CITY_PERSIST_KEY);
    if (saved) {
      setSelectedCity(saved);
      setCityInput(saved);
    }
  }, []);

  const filteredCities = useMemo(() => {
    if (!registeredCities || !cityInput.trim()) return [];
    return registeredCities.filter(c =>
      c.toLowerCase().includes(cityInput.toLowerCase())
    );
  }, [registeredCities, cityInput]);

  const filteredRestaurants = useMemo(() => {
    let list = restaurants?.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.address.toLowerCase().includes(search.toLowerCase())
    ) || [];

    // Sort
    if (sortBy === 'name_asc') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'name_desc') list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    else if (sortBy === 'newest') list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return list;
  }, [restaurants, search, sortBy]);

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setCityInput(city);
    setShowSuggestions(false);
    localStorage.setItem(CITY_PERSIST_KEY, city);
  };

  const handleCityInputChange = (value: string) => {
    setCityInput(value);
    setShowSuggestions(true);
    if (!value.trim()) {
      setSelectedCity(null);
      localStorage.removeItem(CITY_PERSIST_KEY);
    }
  };

  const clearCity = () => {
    setCityInput('');
    setSelectedCity(null);
    setShowSuggestions(false);
    localStorage.removeItem(CITY_PERSIST_KEY);
  };

  const isUnregisteredCity = cityInput.trim().length >= 2 && filteredCities.length === 0 && !selectedCity;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-24 md:pb-0 max-w-4xl mx-auto">
        <motion.div
          className="gradient-surface rounded-[2rem] border border-border/80 p-5 md:p-6 shadow-soft overflow-hidden relative"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute inset-y-0 right-0 w-40 bg-hero-orb-3 blur-3xl opacity-80 pointer-events-none" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Hey, {user?.name?.split(' ')[0]} 👋</p>
              <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mt-1">Craving something worth sharing?</h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-xl">Pickup-first food, smooth rewards, and a social vibe made for campus life.</p>
            </div>
            <Link to="/customer/coins" className="flex items-center gap-2 px-4 py-3 rounded-[1.25rem] bg-card border border-border shadow-soft hover:-translate-y-0.5 transition-all">
              <div className="w-9 h-9 rounded-2xl gradient-coin flex items-center justify-center glow-coin">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground leading-none">My Coins</p>
                <p className="font-display font-bold text-base text-foreground mt-1">{wallet?.total_coins || 0}</p>
              </div>
            </Link>
          </div>
        </motion.div>

        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
          <input
            type="text"
            placeholder="Enter your city..."
            className="w-full pl-11 pr-10 py-3.5 rounded-[1.4rem] border border-border bg-card text-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm font-medium placeholder:text-muted-foreground/60"
            value={cityInput}
            onChange={(e) => handleCityInputChange(e.target.value)}
            onFocus={() => cityInput.trim() && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {cityInput && (
            <button onClick={clearCity} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}

          {showSuggestions && filteredCities.length > 0 && (
            <div className="absolute z-50 top-full mt-2 w-full bg-card border border-border rounded-[1.25rem] shadow-soft overflow-hidden">
              {filteredCities.map((city) => (
                <button
                  key={city}
                  className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-secondary transition-colors flex items-center gap-2"
                  onMouseDown={() => handleCitySelect(city)}
                >
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        {isUnregisteredCity && (
          <motion.div
            className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto gradient-surface rounded-[2rem] border border-border/80 shadow-soft"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 rounded-[1.75rem] gradient-social flex items-center justify-center mb-6 shadow-soft animate-float">
              <Rocket className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="font-display font-bold text-2xl text-foreground">Coming Soon!</h2>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              We're lining up the best pickup spots for your city right now.
            </p>
          </motion.div>
        )}

        {selectedCity && (
          <>
            <SearchBar value={search} onChange={setSearch} />

            <div className="flex items-center gap-2">
              <section className="flex-1 space-y-3">
                <h2 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-[0.2em]">What's on your mind?</h2>
                <CategoryFilter selected={category} onSelect={setCategory} />
              </section>

              {/* Filter dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full shrink-0 h-10 w-10 border-border">
                    <SlidersHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  {SORT_OPTIONS.map(opt => (
                    <DropdownMenuCheckboxItem
                      key={opt.id}
                      checked={sortBy === opt.id}
                      onCheckedChange={() => setSortBy(opt.id)}
                    >
                      {opt.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <PromoBanner />

            <div className="grid grid-cols-3 gap-3">
              <div className="gradient-surface rounded-[1.4rem] border border-border/70 p-4 text-center shadow-soft">
                <p className="text-xs text-muted-foreground">Earned</p>
                <p className="font-display font-bold text-primary text-lg mt-1">{wallet?.total_coins || 0} pts</p>
              </div>
              <div className="gradient-surface rounded-[1.4rem] border border-border/70 p-4 text-center shadow-soft">
                <p className="text-xs text-muted-foreground">Saved</p>
                <p className="font-display font-bold text-accent text-lg mt-1">₹{Math.round((wallet?.total_coins || 0) / 10)}</p>
              </div>
              <div className="gradient-surface rounded-[1.4rem] border border-border/70 p-4 text-center shadow-soft">
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="font-display font-bold text-foreground text-lg mt-1">₹0 fee</p>
              </div>
            </div>

            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-bold text-xl text-foreground">Restaurants in {selectedCity}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Fresh picks with rewards built in.</p>
                </div>
                <Link
                  to="/customer/browse"
                  className="text-sm text-primary font-semibold flex items-center gap-0.5 hover:underline underline-offset-4"
                >
                  See all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <RestaurantCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredRestaurants?.length === 0 ? (
                <EmptyState
                  icon={<Store className="w-7 h-7 text-muted-foreground" />}
                  title="No restaurants found"
                  description={search ? 'Try a different search term' : 'No restaurants are available in your area yet'}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredRestaurants?.map((restaurant, i) => (
                    <motion.div
                      key={restaurant.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                    >
                      <RestaurantCard restaurant={restaurant} />
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {!selectedCity && !isUnregisteredCity && !cityInput.trim() && (
          <div className="text-center py-16 gradient-surface rounded-[2rem] border border-border/80 shadow-soft">
            <MapPin className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="font-display font-semibold text-lg">Enter your city above</p>
            <p className="text-sm text-muted-foreground mt-1">to unlock pickup spots, rewards, and campus food drops</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
