import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LANDING } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import logoWordmark from '@/assets/logo-wordmark.jpg';
import restroLogo from '@/assets/munchii-restaurant-logo.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from');

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(ROLE_LANDING[user.role], { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await login(email, password);
    if (error) toast.error(error);
    setIsLoading(false);
  };

  return (
    <div className={`min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden ${from === 'restaurant' ? 'restaurant-theme' : ''}`}>
      {/* Background pattern */}
      <div className="fixed inset-0 bg-dot-pattern opacity-[0.03] pointer-events-none" />
      
      {/* Gradient orbs */}
      <div className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-hero-orb-1 blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-hero-orb-3 blur-3xl pointer-events-none" />

      {/* Floating food emojis */}
      <motion.div
        className="absolute top-16 left-[15%] text-3xl pointer-events-none"
        animate={{ y: [0, -15, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >🍕</motion.div>
      <motion.div
        className="absolute bottom-24 right-[12%] text-2xl pointer-events-none"
        animate={{ y: [0, -12, 0], rotate: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >☕</motion.div>
      <motion.div
        className="absolute top-[30%] right-[8%] text-2xl pointer-events-none"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >🍜</motion.div>

      <motion.div
        className="w-full max-w-md space-y-6 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Link
          to="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to role selection
        </Link>


        <div className="text-center space-y-3">
          <Link to="/">
            <img src={from === 'restaurant' ? restroLogo : logoWordmark} alt="Munchii" className="h-14 object-contain rounded-xl" />
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your Munchii account</p>
          </div>
        </div>

        <Card className="shadow-xl border-0 glass-strong rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-display">Login</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">{from === 'restaurant' ? 'Email' : 'Email or username'}</Label>
                <Input
                  id="login-email"
                  type={from === 'restaurant' ? 'email' : 'text'}
                  autoCapitalize="none"
                  autoCorrect="off"
                  placeholder={from === 'restaurant' ? 'you@example.com' : 'you@example.com or @username'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-background pr-10 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full rounded-xl gradient-primary text-primary-foreground hover:opacity-90 transition-opacity" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground pt-2 space-y-1">
              <p>Don't have an account?</p>
              {from === 'restaurant' ? (
                <Link to="/signup/restaurant" className="text-primary hover:underline font-medium">
                  Register as Restaurant
                </Link>
              ) : from === 'customer' ? (
                <Link to="/signup/customer" className="text-primary hover:underline font-medium">
                  Sign up as Customer
                </Link>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <Link to="/signup/customer" className="text-primary hover:underline font-medium">
                    Sign up as Customer
                  </Link>
                  <span className="text-muted-foreground">•</span>
                  <Link to="/signup/restaurant" className="text-primary hover:underline font-medium">
                    Register Restaurant
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">Built in India 🇮🇳 • Your data stays private</p>
      </motion.div>
    </div>
  );
}
