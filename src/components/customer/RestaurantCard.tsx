import { Link } from 'react-router-dom';
import { MapPin, Star, Clock, Coins } from 'lucide-react';
import type { Restaurant } from '@/hooks/useRestaurants';
import { resolveStorageUrl } from '@/lib/utils';

const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
];

function getImageForRestaurant(restaurant: Restaurant & { photo_url?: string | null }) {
  if (restaurant.photo_url) {
    return resolveStorageUrl(restaurant.photo_url) || restaurant.photo_url;
  }
  const hash = restaurant.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return FOOD_IMAGES[hash % FOOD_IMAGES.length];
}

function getRating() {
  return (3.8 + Math.random() * 1.1).toFixed(1);
}

function getPickupTime() {
  const min = 10 + Math.floor(Math.random() * 10);
  return `${min}-${min + 5} min`;
}

interface RestaurantCardProps {
  restaurant: Restaurant & { photo_url?: string | null };
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const image = getImageForRestaurant(restaurant);

  return (
    <Link to={`/customer/restaurant/${restaurant.id}`} className="block group">
      <div className="gradient-surface rounded-[1.75rem] border border-border/80 overflow-hidden shadow-soft transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-xl">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={image}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background/35 to-transparent" />

          <div className="absolute top-3 left-3 flex gap-2">
            <span className="gradient-primary text-primary-foreground text-[11px] font-bold px-3 py-1.5 rounded-full shadow-soft">
              PICKUP ONLY
            </span>
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-1.5 glass px-2.5 py-1.5 rounded-full shadow-soft">
            <Star className="w-3 h-3 fill-coin text-coin" />
            <span className="text-xs font-bold text-foreground">{getRating()}</span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
            <div>
              <h3 className="font-display font-bold text-lg text-primary-foreground truncate drop-shadow-sm">
                {restaurant.name}
              </h3>
              <p className="text-xs text-primary-foreground/80 mt-1 flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                {restaurant.address}
              </p>
            </div>
            <div className="glass px-2.5 py-1.5 rounded-2xl shrink-0 shadow-soft">
              <div className="flex items-center gap-1 text-[10px] font-bold text-foreground">
                <Coins className="w-3 h-3 text-coin" />
                Earn 3%
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-secondary/65 px-3 py-2.5 border border-border/60">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Clock className="w-3 h-3" /> Ready in
              </span>
              <p className="text-sm font-display font-bold mt-1">{getPickupTime()}</p>
            </div>
            <div className="rounded-2xl bg-card px-3 py-2.5 border border-border/60 text-right">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Fees</span>
              <p className="text-sm font-display font-bold mt-1 text-primary">₹0 pickup fee</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
