import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Search, Star, Clock, ChevronRight } from 'lucide-react';

const FEATURED_RESTAURANTS = [
  { id: 1, name: 'Spice Garden', cuisine: 'Indian', rating: 4.5, time: '25-35 min', image: '🍛' },
  { id: 2, name: 'Pizza Paradise', cuisine: 'Italian', rating: 4.7, time: '20-30 min', image: '🍕' },
  { id: 3, name: 'Sushi Master', cuisine: 'Japanese', rating: 4.8, time: '30-40 min', image: '🍣' },
  { id: 4, name: 'Burger Barn', cuisine: 'American', rating: 4.3, time: '15-25 min', image: '🍔' },
];

const CATEGORIES = ['All', 'Indian', 'Italian', 'Chinese', 'Japanese', 'Mexican', 'Thai'];

export default function CustomerDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 md:pb-0">
        {/* Welcome Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Hello, {user?.name}! 👋</h1>
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
            placeholder="Search restaurants, cuisines, or dishes..."
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
            <h2 className="text-lg font-semibold">Featured Restaurants</h2>
            <Button variant="ghost" size="sm" className="text-primary">
              View all <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURED_RESTAURANTS.map((restaurant) => (
              <Card key={restaurant.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center text-3xl">
                      {restaurant.image}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{restaurant.name}</h3>
                      <p className="text-sm text-muted-foreground">{restaurant.cuisine}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        <span className="flex items-center gap-1 text-amber-500">
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
          <h2 className="text-lg font-semibold mb-4">Your Stats</h2>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">12</div>
                <div className="text-xs text-muted-foreground">Orders</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">₹2,450</div>
                <div className="text-xs text-muted-foreground">Spent</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">5</div>
                <div className="text-xs text-muted-foreground">Favorites</div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
