import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, ROLE_LABELS, ROLE_ROUTES, SIGNUP_ROLES } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { UtensilsCrossed, ShoppingBag, Store, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  customer: <ShoppingBag className="w-5 h-5" />,
  restaurant: <Store className="w-5 h-5" />,
  admin: null,
};

const ROLE_COLORS: Record<UserRole, string> = {
  customer: 'border-customer bg-customer/10 text-customer',
  restaurant: 'border-restaurant bg-restaurant/10 text-restaurant',
  admin: 'border-admin bg-admin/10 text-admin',
};

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const { signup, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(ROLE_ROUTES[user.role], { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signup(email, password, name, selectedRole, phone);
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-20 left-10 w-8 h-8 rounded-full bg-foreground rotate-45" />
        <div className="absolute top-40 right-20 w-6 h-6 rounded-full bg-foreground rotate-12" />
        <div className="absolute bottom-32 left-1/4 w-10 h-10 rounded-full bg-foreground -rotate-30" />
      </div>

      <div className="w-full max-w-md space-y-6 animate-fade-in relative">
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <UtensilsCrossed className="w-8 h-8" />
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Join FoodyZone</h1>
            <p className="text-muted-foreground text-sm mt-1">Create your account to get started</p>
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Sign Up</CardTitle>
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
                <Input id="signup-name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-phone">Mobile Number</Label>
                <Input id="signup-phone" type="tel" placeholder="+91 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} required className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-background pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground pt-2">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">Login</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
