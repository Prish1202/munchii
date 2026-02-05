import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_ROUTES } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Coffee, Mail, Phone, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

type AuthMethod = 'email' | 'phone';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loginMethod, setLoginMethod] = useState<AuthMethod>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { login, loginWithPhone, verifyOtp, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(ROLE_ROUTES[user.role], { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await login(email, password);
    
    if (error) {
      toast.error(error);
    }
    
    setIsLoading(false);
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!otpSent) {
      const { error } = await loginWithPhone(phone);
      if (error) {
        toast.error(error);
      } else {
        setOtpSent(true);
        toast.success('OTP sent to your phone!');
      }
    } else {
      const { error } = await verifyOtp(phone, otp);
      if (error) {
        toast.error(error);
      }
    }

    setIsLoading(false);
  };

  const resetLoginState = () => {
    setOtpSent(false);
    setOtp('');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Decorative pattern */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute top-20 left-10 w-8 h-8 rounded-full bg-foreground rotate-45" />
        <div className="absolute top-40 right-20 w-6 h-6 rounded-full bg-foreground rotate-12" />
        <div className="absolute bottom-32 left-1/4 w-10 h-10 rounded-full bg-foreground -rotate-30" />
      </div>

      <div className="w-full max-w-md space-y-6 animate-fade-in relative">
        {/* Logo */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Coffee className="w-8 h-8" />
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your BrewDrop account</p>
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Login</CardTitle>
            <CardDescription>Choose your preferred login method</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Login Method Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={loginMethod === 'phone' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => {
                  setLoginMethod('phone');
                  resetLoginState();
                }}
              >
                <Phone className="w-4 h-4 mr-2" />
                Phone
              </Button>
              <Button
                type="button"
                variant={loginMethod === 'email' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => {
                  setLoginMethod('email');
                  resetLoginState();
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            </div>

            {loginMethod === 'phone' ? (
              <form onSubmit={handlePhoneLogin} className="space-y-4">
                {!otpSent ? (
                  <div className="space-y-2">
                    <Label htmlFor="login-phone">Phone Number</Label>
                    <Input
                      id="login-phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="bg-background"
                    />
                    <p className="text-xs text-muted-foreground">
                      Include country code (e.g., +1 for US, +91 for India)
                    </p>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={resetLoginState}
                      className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Change number
                    </button>
                    <div className="space-y-2">
                      <Label htmlFor="login-otp">Enter OTP</Label>
                      <Input
                        id="login-otp"
                        type="text"
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        maxLength={6}
                        className="bg-background text-center text-lg tracking-widest"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the 6-digit code sent to {phone}
                      </p>
                    </div>
                  </>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading 
                    ? (otpSent ? 'Verifying...' : 'Sending OTP...') 
                    : (otpSent ? 'Verify OTP' : 'Send OTP')}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-background"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            )}

            <div className="text-center text-sm text-muted-foreground pt-2">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
