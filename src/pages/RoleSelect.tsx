import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Store, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LANDING } from '@/types/auth';
import { Card } from '@/components/ui/card';
import logoWordmark from '@/assets/logo-wordmark.jpg';

export default function RoleSelect() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      navigate(ROLE_LANDING[user.role], { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 bg-dot-pattern opacity-[0.03] pointer-events-none" />
      <div className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-hero-orb-1 blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-hero-orb-3 blur-3xl pointer-events-none" />

      <motion.div
        className="w-full max-w-md space-y-8 relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="text-center space-y-3 flex flex-col items-center">
          <img src={logoWordmark} alt="Munchii" className="h-14 object-contain rounded-xl" />
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Welcome to Munchii</h1>
            <p className="text-muted-foreground text-sm mt-1">Choose how you want to continue</p>
          </div>
        </div>

        <div className="space-y-4">
          <Link to="/login?from=customer" className="block">
            <Card className="p-5 rounded-2xl glass-strong border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                <UtensilsCrossed className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-semibold text-lg">Foodie</h2>
                <p className="text-sm text-muted-foreground">Order and pick up food from campus restaurants</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </Card>
          </Link>

          <Link to="/login?from=restaurant" className="block restaurant-theme">
            <Card className="p-5 rounded-2xl glass-strong border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Store className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-semibold text-lg">Merchant</h2>
                <p className="text-sm text-muted-foreground">Manage your restaurant, menu and orders</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </Card>
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Built in India 🇮🇳 •{' '}
          <Link to="/home" className="hover:underline">
            Explore Munchii
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
