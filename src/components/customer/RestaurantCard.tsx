import { Link } from 'react-router-dom';
import { MapPin, Star, Clock, Coins } from 'lucide-react';
import type { Restaurant } from '@/hooks/useRestaurants';

const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
];

function getImageForRestaurant(id: string) {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
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
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const image = getImageForRestaurant(restaurant.id);
  
  return (
    <Link to={`/customer/restaurant/${restaurant.id}`} className="block group">
      <div className="bg-card rounded-3xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={image}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="gradient-primary text-primary-foreground text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-lg">
              PICKUP
            </span>
          </div>
          
          {/* Earn badge */}
          <div className="absolute bottom-3 right-3">
            <div className="flex items-center gap-1 bg-card/90 backdrop-blur-sm px-2 py-1 rounded-lg">
              <Coins className="w-3 h-3 text-coin" />
              <span className="text-[10px] font-bold text-foreground">Earn 4%</span>
            </div>
          </div>

          {/* Rating */}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm px-2 py-1 rounded-lg">
            <Star className="w-3 h-3 fill-coin text-coin" />
            <span className="text-xs font-bold text-foreground">{getRating()}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3.5">
          <h3 className="font-display font-bold text-[15px] text-foreground truncate">
            {restaurant.name}
          </h3>
          
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            {restaurant.address}
          </p>
          
          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-border">
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Clock className="w-3 h-3" />
              {getPickupTime()}
            </span>
            <span className="text-xs font-semibold text-accent">₹0 fee</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
