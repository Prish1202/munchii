import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Search, Star, Clock, ChevronRight, UtensilsCrossed } from 'lucide-react';

const FEATURED_RESTAURANTS = [
  { id: 1, name: 'Spice Garden', specialty: 'Indian Cuisine', rating: 4.8, time: '15-20 min', image: '🍛' },
  { id: 2, name: 'Burger Barn', specialty: 'Burgers & Fries', rating: 4.7, time: '20-25 min', image: '🍔' },
  { id: 3, name: 'Sushi Palace', specialty: 'Japanese', rating: 4.9, time: '18-25 min', image: '🍣' },
  { id: 4, name: 'Pizza House', specialty: 'Italian', rating: 4.6, time: '15-22 min', image: '🍕' },
];

const CATEGORIES = ['All', 'Indian', 'Chinese', 'Italian', 'Burgers', 'Pizza', 'Desserts'];

export default function CustomerDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 md:pb-0">
        {/* Welcome Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-display font-bold">Hey, {user?.name}! 🍽️</h1>
          <p className="text-muted-foreground flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            Delivering to: 123 Main Street
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search restaurants, dishes, or cuisines..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
          {CATEGORIES.map((cat, i) => (
            <Button
              key={cat}
              variant={i === 0 ? 'default' : 'outline'}
              size="sm"
              className="rounded-full whitespace-nowrap"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Featured */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold">Featured Restaurants</h2>
            <Button variant="ghost" size="sm" className="text-primary">
              View all <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURED_RESTAURANTS.map((restaurant) => (
              <Card key={restaurant.id} className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center text-3xl">
                      {restaurant.image}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{restaurant.name}</h3>
                      <p className="text-sm text-muted-foreground">{restaurant.specialty}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        <span className="flex items-center gap-1 text-accent">
                          <Star className="w-4 h-4 fill-current" />
                          {restaurant.rating}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {restaurant.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Stats */}
        <section>
          <h2 className="text-lg font-display font-semibold mb-4">Your Orders</h2>
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-4 text-center">
                <UtensilsCrossed className="w-5 h-5 mx-auto text-primary mb-1" />
                <div className="text-2xl font-display font-bold text-primary">24</div>
                <div className="text-xs text-muted-foreground">Orders Placed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-display font-bold text-primary">₹1,840</div>
                <div className="text-xs text-muted-foreground">Total Spent</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-display font-bold text-primary">3</div>
                <div className="text-xs text-muted-foreground">Favourites</div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
