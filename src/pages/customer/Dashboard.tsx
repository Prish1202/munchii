import { useState } from 'react';
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
import { MapPin, ChevronRight, Store } from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const { data: restaurants, isLoading } = useRestaurants();

  const filteredRestaurants = restaurants?.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 md:pb-0 max-w-3xl mx-auto">
        {/* Location header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Delivering to</p>
            <button className="flex items-center gap-1 mt-0.5 group">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-display font-semibold text-foreground">Current Location</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
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
    </DashboardLayout>
  );
}
