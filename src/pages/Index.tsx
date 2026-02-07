import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_ROUTES } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, ShoppingBag, Store, Truck, ArrowRight, Star, Clock } from 'lucide-react';
import { useEffect } from 'react';

const FEATURES = [
  {
    icon: ShoppingBag,
    title: 'Wide Selection',
    description: 'Browse menus from top restaurants near you — from comfort food to gourmet cuisine',
  },
  {
    icon: Store,
    title: 'Restaurant Partners',
    description: 'Manage your menu, orders, and analytics from one powerful dashboard',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Hot meals at your door in minutes with real-time order tracking',
  },
];

const STATS = [
  { value: '10K+', label: 'Happy Customers' },
  { value: '200+', label: 'Restaurant Partners' },
  { value: '500+', label: 'Delivery Partners' },
  { value: '4.9', label: 'App Rating', icon: Star },
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
              <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">FoodyZone</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute top-20 right-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="container text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
            <Clock className="w-4 h-4" />
            Hot meals delivered in under 30 minutes
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight max-w-3xl mx-auto">
            Delicious food,{' '}
            <span className="text-primary">delivered</span> to your door
          </h1>
          
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            From local restaurants to your table. Fresh meals, snacks, and everything 
            your hungry heart desires.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="gap-2 text-base">
                Order Food <UtensilsCrossed className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="lg" variant="outline" className="gap-2 text-base">
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
                <div className="text-3xl md:text-4xl font-display font-bold text-primary flex items-center justify-center gap-1">
                  {stat.value}
                  {stat.icon && <Star className="w-6 h-6 fill-accent text-accent" />}
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
            <h2 className="text-3xl font-display font-bold">The complete food delivery experience</h2>
            <p className="text-muted-foreground mt-2">From kitchen to table, we've got every step covered</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div 
                key={feature.title} 
                className="p-6 rounded-2xl border bg-card hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-display font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground mt-2">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold">Ready to order?</h2>
          <p className="mt-4 text-primary-foreground/80 max-w-lg mx-auto">
            Join thousands of foodies and restaurant partners already using FoodyZone.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary" className="mt-8 gap-2 text-base">
              Start ordering now <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold">FoodyZone</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 FoodyZone. Made with 🍕 for food lovers.
          </p>
        </div>
      </footer>
    </div>
  );
}
