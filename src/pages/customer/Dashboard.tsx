import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SearchBar } from '@/components/customer/SearchBar';
import { CategoryFilter } from '@/components/customer/CategoryFilter';
import { PromoBanner } from '@/components/customer/PromoBanner';
import { RestaurantCard } from '@/components/customer/RestaurantCard';
import { RestaurantCardSkeleton } from '@/components/customer/RestaurantCardSkeleton';
import { EmptyState } from '@/components/customer/EmptyState';
import { ComingSoon } from '@/components/customer/ComingSoon';
import { CitySelector } from '@/components/customer/CitySelector';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useWallet } from '@/hooks/useWallet';
import { MapPin, ChevronRight, Store, ChevronDown, Loader2, Sparkles, Coins } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { city, isDetecting } = useLocation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [cityOpen, setCityOpen] = useState(false);
  const { data: restaurants, isLoading } = useRestaurants(city);
  const { data: wallet } = useWallet();

  const filteredRestaurants = restaurants?.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.address.toLowerCase().includes(search.toLowerCase())
  );

  if (isDetecting) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Detecting your location...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!city) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-md mx-auto gap-4">
          <div className="w-16 h-16 rounded-3xl gradient-primary flex items-center justify-center shadow-lg glow-primary">
            <MapPin className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="font-display font-bold text-xl">Select your city</h2>
          <p className="text-sm text-muted-foreground">We need your location to show nearby restaurants.</p>
          <button
            onClick={() => setCityOpen(true)}
            className="text-primary font-semibold text-sm underline underline-offset-4"
          >
            Choose city manually
          </button>
        </div>
        <CitySelector open={cityOpen} onOpenChange={setCityOpen} />
      </DashboardLayout>
    );
  }

  if (!isLoading && (!restaurants || restaurants.length === 0) && !search) {
    return (
      <DashboardLayout>
        <ComingSoon />
      </DashboardLayout>
    );
  }

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
            <button
              className="flex items-center gap-1.5 mt-0.5 group"
              onClick={() => setCityOpen(true)}
            >
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span className="font-display font-bold text-foreground text-lg">{city}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </div>
          {/* Coin balance card */}
          <Link to="/customer/profile" className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-coin/10 border border-coin/20 hover:bg-coin/15 transition-colors">
            <div className="w-7 h-7 rounded-xl gradient-coin flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground leading-none">My Coins</p>
              <p className="font-display font-bold text-sm text-coin-foreground">{wallet?.total_coins || 0}</p>
            </div>
          </Link>
        </motion.div>

        {/* Search */}
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
            <p className="font-display font-bold text-primary">{wallet?.total_coins || 0} 🪙</p>
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
              Near you
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
      </div>

      <CitySelector open={cityOpen} onOpenChange={setCityOpen} />
    </DashboardLayout>
  );
}
