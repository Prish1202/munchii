import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SearchBar } from '@/components/customer/SearchBar';
import { RestaurantCard } from '@/components/customer/RestaurantCard';
import { RestaurantCardSkeleton } from '@/components/customer/RestaurantCardSkeleton';
import { EmptyState } from '@/components/customer/EmptyState';
import { ComingSoon } from '@/components/customer/ComingSoon';
import { useLocation } from '@/contexts/LocationContext';
import { useRestaurants } from '@/hooks/useRestaurants';
import { Store, SlidersHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = ['Relevance', 'Rating', 'Delivery Time', 'Cost: Low to High'];

export default function RestaurantList() {
  const [search, setSearch] = useState('');
  const [activeSort, setActiveSort] = useState('Relevance');
  const { city, isDetecting } = useLocation();
  const { data: restaurants, isLoading } = useRestaurants(city);

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

  if (!isLoading && (!restaurants || restaurants.length === 0) && !search) {
    return (
      <DashboardLayout>
        <ComingSoon />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-20 md:pb-0 max-w-3xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">All Restaurants</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading ? 'Loading...' : `${filteredRestaurants?.length || 0} restaurants in ${city || 'your area'}`}
          </p>
        </div>

        {/* Search */}
        <SearchBar value={search} onChange={setSearch} placeholder="Search restaurants..." />

        {/* Sort / Filter bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <Button variant="outline" size="sm" className="rounded-full shrink-0 gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filter
          </Button>
          {SORT_OPTIONS.map((opt) => (
            <Button
              key={opt}
              variant={activeSort === opt ? 'default' : 'outline'}
              size="sm"
              className={cn('rounded-full shrink-0 whitespace-nowrap')}
              onClick={() => setActiveSort(opt)}
            >
              {opt}
            </Button>
          ))}
        </div>

        {/* Restaurant Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <RestaurantCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredRestaurants?.length === 0 ? (
          <EmptyState
            icon={<Store className="w-7 h-7 text-muted-foreground" />}
            title="No restaurants found"
            description={search ? 'Try adjusting your search or filters' : 'No restaurants are available in your area yet'}
            action={
              search ? (
                <Button variant="outline" onClick={() => setSearch('')}>
                  Clear search
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredRestaurants?.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
