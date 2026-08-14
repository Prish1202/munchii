import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, ROLE_LABELS, ROLE_LANDING, SIGNUP_ROLES } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { UtensilsCrossed, ShoppingBag, Store, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  customer: <ShoppingBag className="w-5 h-5" />,
  restaurant: <Store className="w-5 h-5" />,
  admin: null,
};

const ROLE_COLORS: Record<UserRole, string> = {
  customer: 'border-primary bg-primary/10 text-primary',
  restaurant: 'border-accent bg-accent/10 text-accent',
  admin: 'border-muted bg-muted/10 text-muted-foreground',
};

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const { signup, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(ROLE_LANDING[user.role], { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signup(email, password, name, selectedRole, phone, city, state, area);
    if (error) {
      if (error.includes('already registered')) {
        toast.error('This email is already registered. Please login instead.');
      } else {
        toast.error(error);
      }
    } else {
      navigate('/confirm-email');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background pattern */}
      <div className="fixed inset-0 bg-dot-pattern opacity-[0.03] pointer-events-none" />
      
      {/* Gradient orbs */}
      <div className="fixed top-[-15%] left-[-10%] w-[450px] h-[450px] rounded-full bg-hero-orb-1 blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full bg-hero-orb-2 blur-3xl pointer-events-none" />

      {/* Floating food emojis */}
      <motion.div
        className="absolute top-20 right-[15%] text-3xl pointer-events-none"
        animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >🍔</motion.div>
      <motion.div
        className="absolute bottom-32 left-[10%] text-2xl pointer-events-none"
        animate={{ y: [0, -12, 0], rotate: [0, -8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
      >🥗</motion.div>

      <motion.div
        className="w-full max-w-md space-y-6 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary text-primary-foreground shadow-lg glow-primary">
            <UtensilsCrossed className="w-8 h-8" />
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Join Munchii</h1>
            <p className="text-muted-foreground text-sm mt-1">Create your account to get started</p>
          </div>
        </div>

        <Card className="shadow-xl border-0 glass-strong rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-display">Sign Up</CardTitle>
            <CardDescription>Choose your role and create an account</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">I am a...</Label>
              <div className="grid grid-cols-2 gap-2">
                {SIGNUP_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-medium",
                      selectedRole === role
                        ? ROLE_COLORS[role]
                        : "border-border hover:border-muted-foreground/50 bg-background"
                    )}
                  >
                    {ROLE_ICONS[role]}
                    <span>{ROLE_LABELS[role]}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input id="signup-name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required className="bg-background rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-phone">Mobile Number</Label>
                <Input id="signup-phone" type="tel" placeholder="+91 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} required className="bg-background rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-area">Area / Locality <span className="text-destructive">*</span></Label>
                <Input id="signup-area" type="text" placeholder="e.g. Andheri West" value={area} onChange={(e) => setArea(e.target.value)} required className="bg-background rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="signup-city">City <span className="text-destructive">*</span></Label>
                  <Input id="signup-city" type="text" placeholder="e.g. Mumbai" value={city} onChange={(e) => setCity(e.target.value)} required className="bg-background rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-state">State <span className="text-destructive">*</span></Label>
                  <Input id="signup-state" type="text" placeholder="e.g. Maharashtra" value={state} onChange={(e) => setState(e.target.value)} required className="bg-background rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-background pr-10 rounded-xl" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
              </div>
              <Button type="submit" className="w-full rounded-xl gradient-primary text-primary-foreground hover:opacity-90 transition-opacity" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground pt-2">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">Login</Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">Built in India 🇮🇳 • Your data stays private</p>
      </motion.div>
    </div>
  );
}
