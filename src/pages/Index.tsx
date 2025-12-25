import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_ROUTES } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Utensils, ShoppingBag, Store, Truck, ArrowRight, Star, Clock } from 'lucide-react';
import { useEffect } from 'react';

const FEATURES = [
  {
    icon: ShoppingBag,
    title: 'Easy Ordering',
    description: 'Browse menus, customize orders, and track delivery in real-time',
  },
  {
    icon: Store,
    title: 'Restaurant Partners',
    description: 'Manage your menu, orders, and analytics from one dashboard',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Optimized routes and real-time tracking for quick deliveries',
  },
];

const STATS = [
  { value: '10K+', label: 'Happy Customers' },
  { value: '500+', label: 'Restaurant Partners' },
  { value: '1000+', label: 'Delivery Partners' },
  { value: '4.8', label: 'App Rating', icon: Star },
];

export default function Index() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(ROLE_ROUTES[user.role]);
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Utensils className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">FoodMarket</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-32">
        <div className="container text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Clock className="w-4 h-4" />
            Delivering happiness in 30 minutes
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
            Food delivery made{' '}
            <span className="text-primary">simple</span> for everyone
          </h1>
          
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Whether you're hungry, running a restaurant, or looking to deliver - 
            FoodMarket connects you to what you need.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                Order Food <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="gap-2">
                Partner with us <Store className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y bg-secondary/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary flex items-center justify-center gap-1">
                  {stat.value}
                  {stat.icon && <Star className="w-6 h-6 fill-primary" />}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">One platform, endless possibilities</h2>
            <p className="text-muted-foreground mt-2">Everything you need to connect food with people</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div 
                key={feature.title} 
                className="p-6 rounded-2xl border bg-card hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground mt-2">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to get started?</h2>
          <p className="mt-4 text-primary-foreground/80 max-w-lg mx-auto">
            Join thousands of customers, restaurants, and delivery partners already using FoodMarket.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="mt-8 gap-2">
              Create your account <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Utensils className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">FoodMarket</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 FoodMarket. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
