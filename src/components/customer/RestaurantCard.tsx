import { Link } from 'react-router-dom';
import { MapPin, Star, Clock } from 'lucide-react';
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

function getDeliveryTime() {
  const min = 15 + Math.floor(Math.random() * 15);
  return `${min}-${min + 10} min`;
}

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const image = getImageForRestaurant(restaurant.id);
  
  return (
    <Link to={`/customer/restaurant/${restaurant.id}`} className="block group">
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-0.5">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={image}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {/* Offer badge */}
          <div className="absolute top-3 left-3">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-lg shadow-md">
              20% OFF
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-semibold text-base text-foreground truncate">
              {restaurant.name}
            </h3>
            <div className="flex items-center gap-1 bg-green-600 text-primary-foreground px-1.5 py-0.5 rounded-md shrink-0">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-xs font-bold">{getRating()}</span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            {restaurant.address}
          </p>
          
          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-border">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {getDeliveryTime()}
            </span>
            <span className="text-xs text-muted-foreground">₹150 for two</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
