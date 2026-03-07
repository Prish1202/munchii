import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RestaurantCard } from '@/components/customer/RestaurantCard';
import { RestaurantCardSkeleton } from '@/components/customer/RestaurantCardSkeleton';
import { ComingSoon } from '@/components/customer/ComingSoon';
import { useLocation } from '@/contexts/LocationContext';
import { useRestaurants } from '@/hooks/useRestaurants';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Store, Users, MapPin, Loader2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Tab = 'restaurants' | 'people';

function useSearchProfiles(query: string) {
  return useQuery({
    queryKey: ['search-profiles', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url, campus')
        .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: query.length >= 2,
  });
}

export default function Explore() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('restaurants');
  const { city, isDetecting } = useLocation();
  const { data: restaurants, isLoading: loadingRestaurants } = useRestaurants(city);
  const { data: profiles, isLoading: loadingProfiles } = useSearchProfiles(
    tab === 'people' ? search : ''
  );

  const filteredRestaurants = restaurants?.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-24 md:pb-6 max-w-3xl mx-auto">
        <div>
          <h1 className="font-display font-bold text-2xl">Explore</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Find restaurants & people on FoodyZone
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
          <input
            type="text"
            placeholder={tab === 'people' ? 'Search by @username or name...' : 'Search restaurants...'}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm font-medium placeholder:text-muted-foreground/60"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={tab === 'restaurants' ? 'default' : 'outline'}
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => { setTab('restaurants'); setSearch(''); }}
          >
            <Store className="w-3.5 h-3.5" /> Restaurants
          </Button>
          <Button
            variant={tab === 'people' ? 'default' : 'outline'}
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => { setTab('people'); setSearch(''); }}
          >
            <Users className="w-3.5 h-3.5" /> People
          </Button>
        </div>

        {/* Content */}
        {tab === 'restaurants' ? (
          <>
            {isDetecting ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Detecting your location...</p>
              </div>
            ) : !loadingRestaurants && (!restaurants || restaurants.length === 0) && !search ? (
              <ComingSoon />
            ) : loadingRestaurants ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <RestaurantCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredRestaurants?.length === 0 ? (
              <div className="text-center py-16">
                <Store className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-display font-semibold">No restaurants found</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredRestaurants?.map((restaurant, i) => (
                  <motion.div
                    key={restaurant.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                  >
                    <RestaurantCard restaurant={restaurant} />
                  </motion.div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* People tab */
          <div className="space-y-2">
            {search.length < 2 ? (
              <div className="text-center py-16">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-display font-semibold">Search for people</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Type a @username or name to find friends
                </p>
              </div>
            ) : loadingProfiles ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !profiles || profiles.length === 0 ? (
              <div className="text-center py-16">
                <User className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-display font-semibold">No users found</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different username or name</p>
              </div>
            ) : (
              profiles.map((profile, i) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={`/customer/user/${profile.id}`}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:shadow-md transition-all"
                  >
                    <Avatar className="w-12 h-12 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-display font-bold">
                        {profile.name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-sm truncate">{profile.name}</p>
                      {profile.username && (
                        <p className="text-xs text-muted-foreground">@{profile.username}</p>
                      )}
                    </div>
                    {profile.campus && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        🎓 {profile.campus}
                      </Badge>
                    )}
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
