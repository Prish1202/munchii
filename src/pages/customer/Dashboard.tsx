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
import { MapPin, ChevronRight, Store, ChevronDown, Loader2 } from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { city, isDetecting } = useLocation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [cityOpen, setCityOpen] = useState(false);
  const { data: restaurants, isLoading } = useRestaurants(city);

  const filteredRestaurants = restaurants?.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.address.toLowerCase().includes(search.toLowerCase())
  );

  // Show detecting state
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

  // No city selected yet — prompt
  if (!city) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-md mx-auto gap-4">
          <MapPin className="w-10 h-10 text-primary" />
          <h2 className="font-display font-bold text-xl">Select your city</h2>
          <p className="text-sm text-muted-foreground">We need your location to show nearby restaurants.</p>
          <button
            onClick={() => setCityOpen(true)}
            className="text-primary font-medium text-sm underline"
          >
            Choose city manually
          </button>
        </div>
        <CitySelector open={cityOpen} onOpenChange={setCityOpen} />
      </DashboardLayout>
    );
  }

  // No restaurants in this city
  if (!isLoading && (!restaurants || restaurants.length === 0) && !search) {
    return (
      <DashboardLayout>
        <ComingSoon />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 md:pb-0 max-w-3xl mx-auto">
        {/* Location header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Delivering to</p>
            <button
              className="flex items-center gap-1 mt-0.5 group"
              onClick={() => setCityOpen(true)}
            >
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-display font-semibold text-foreground">{city}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Hey,</p>
            <p className="font-display font-semibold text-sm text-foreground">{user?.name} 👋</p>
          </div>
        </div>

        {/* Search */}
        <SearchBar value={search} onChange={setSearch} />

        {/* Categories */}
        <section>
          <h2 className="font-display font-semibold text-base text-foreground mb-3">What's on your mind?</h2>
          <CategoryFilter selected={category} onSelect={setCategory} />
        </section>

        {/* Promo Banner */}
        <PromoBanner />

        {/* Restaurants */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg text-foreground">
              Restaurants near you
            </h2>
            <Link
              to="/customer/browse"
              className="text-sm text-primary font-medium flex items-center gap-0.5 hover:underline"
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
              {filteredRestaurants?.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          )}
        </section>
      </div>

      <CitySelector open={cityOpen} onOpenChange={setCityOpen} />
    </DashboardLayout>
  );
}
