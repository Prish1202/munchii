import { useState, useMemo } from 'react';
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
import { MapPin, ChevronRight, Store, Loader2, Sparkles, Rocket, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [cityInput, setCityInput] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const { data: registeredCities, isLoading: loadingCities } = useRegisteredCities();
  const { data: restaurants, isLoading } = useRestaurants(selectedCity);
  const { data: wallet } = useWallet();

  const filteredCities = useMemo(() => {
    if (!registeredCities || !cityInput.trim()) return [];
    return registeredCities.filter(c =>
      c.toLowerCase().includes(cityInput.toLowerCase())
    );
  }, [registeredCities, cityInput]);

  const filteredRestaurants = restaurants?.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setCityInput(city);
    setShowSuggestions(false);
  };

  const handleCityInputChange = (value: string) => {
    setCityInput(value);
    setShowSuggestions(true);
    if (!value.trim()) {
      setSelectedCity(null);
    }
  };

  const clearCity = () => {
    setCityInput('');
    setSelectedCity(null);
    setShowSuggestions(false);
  };

  // Check if user typed a city that has no match in registered cities
  const isUnregisteredCity = cityInput.trim().length >= 2 && filteredCities.length === 0 && !selectedCity;

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-24 md:pb-0 max-w-3xl mx-auto">
        {/* Greeting */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <p className="text-sm text-muted-foreground font-medium">Hey, {user?.name?.split(' ')[0]} 👋</p>
            <p className="font-display font-bold text-lg text-foreground">What would you like to eat?</p>
          </div>
          {/* Coin balance card */}
          <Link to="/customer/coins" className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-coin/10 border border-coin/20 hover:bg-coin/15 transition-colors">
            <div className="w-7 h-7 rounded-xl gradient-coin flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground leading-none">My Coins</p>
              <p className="font-display font-bold text-sm text-coin-foreground">{wallet?.total_coins || 0}</p>
            </div>
          </Link>
        </motion.div>

        {/* City Search */}
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
          <input
            type="text"
            placeholder="Enter your city..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm font-medium placeholder:text-muted-foreground/60"
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

          {/* Autocomplete dropdown */}
          {showSuggestions && filteredCities.length > 0 && (
            <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden">
              {filteredCities.map((city) => (
                <button
                  key={city}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-accent/50 transition-colors flex items-center gap-2"
                  onMouseDown={() => handleCitySelect(city)}
                >
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Coming Soon for unregistered city */}
        {isUnregisteredCity && (
          <motion.div
            className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 rounded-3xl gradient-social flex items-center justify-center mb-6 shadow-lg animate-float">
              <Rocket className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="font-display font-bold text-2xl text-foreground">Coming Soon!</h2>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              Thank you for your patience. We are working hard to expand our services to your city. ❤️
            </p>
          </motion.div>
        )}

        {/* Show restaurants when city is selected */}
        {selectedCity && (
          <>
            {/* Restaurant Search */}
            <SearchBar value={search} onChange={setSearch} />

            {/* Categories */}
            <section>
              <h2 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">What's on your mind?</h2>
              <CategoryFilter selected={category} onSelect={setCategory} />
            </section>

            {/* Promo Banner */}
            <PromoBanner />

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card rounded-2xl border border-border p-3 text-center">
                <p className="text-xs text-muted-foreground">Earned</p>
                <p className="font-display font-bold text-primary">{wallet?.total_coins || 0} pts</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-3 text-center">
                <p className="text-xs text-muted-foreground">Saved</p>
                <p className="font-display font-bold text-accent">₹{Math.round((wallet?.total_coins || 0) / 10)}</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-3 text-center">
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="font-display font-bold text-foreground">₹0 fee</p>
              </div>
            </div>

            {/* Restaurants */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-lg text-foreground">
                  Restaurants in {selectedCity}
                </h2>
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

        {/* No city selected yet prompt */}
        {!selectedCity && !isUnregisteredCity && !cityInput.trim() && (
          <div className="text-center py-16">
            <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-display font-semibold">Enter your city above</p>
            <p className="text-sm text-muted-foreground mt-1">to discover restaurants near you</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
