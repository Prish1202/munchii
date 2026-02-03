import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, ROLE_LABELS, ROLE_ROUTES, SIGNUP_ROLES } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Utensils, ShoppingBag, Store, Truck, Mail, Phone, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  customer: <ShoppingBag className="w-5 h-5" />,
  restaurant: <Store className="w-5 h-5" />,
  delivery: <Truck className="w-5 h-5" />,
  admin: null,
};

const ROLE_COLORS: Record<UserRole, string> = {
  customer: 'border-customer bg-customer/10 text-customer',
  restaurant: 'border-restaurant bg-restaurant/10 text-restaurant',
  delivery: 'border-delivery bg-delivery/10 text-delivery',
  admin: 'border-admin bg-admin/10 text-admin',
};

type AuthMethod = 'email' | 'phone';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [loginMethod, setLoginMethod] = useState<AuthMethod>('phone'); // Default to phone for customers
  const [signupMethod, setSignupMethod] = useState<AuthMethod>('phone'); // Default to phone for customers
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [signupOtpSent, setSignupOtpSent] = useState(false);
  const { login, loginWithPhone, signupWithPhone, verifyOtp, signup, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(ROLE_ROUTES[user.role]);
    }
  }, [isAuthenticated, user, navigate]);

  // Update default method when role changes (for signup)
  useEffect(() => {
    if (selectedRole === 'customer') {
      setSignupMethod('phone');
    } else {
      setSignupMethod('email');
    }
  }, [selectedRole]);

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

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signup(email, password, name, selectedRole);
    
    if (error) {
      if (error.includes('already registered')) {
        toast.error('This email is already registered. Please login instead.');
      } else {
        toast.error(error);
      }
    } else {
      toast.success('Account created! Please check your email to verify.');
    }
    
    setIsLoading(false);
  };

  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!signupOtpSent) {
      if (!name.trim()) {
        toast.error('Please enter your name');
        setIsLoading(false);
        return;
      }
      const { error } = await signupWithPhone(phone, name, selectedRole);
      if (error) {
        toast.error(error);
      } else {
        setSignupOtpSent(true);
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

  const resetSignupState = () => {
    setSignupOtpSent(false);
    setOtp('');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground">
            <Utensils className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold">FoodMarket</h1>
          <p className="text-muted-foreground text-sm">Your complete food delivery solution</p>
        </div>

        {/* Auth Forms */}
        <Card>
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="pb-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" onClick={resetLoginState}>Login</TabsTrigger>
                <TabsTrigger value="signup" onClick={resetSignupState}>Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4 mt-0">
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
                          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
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
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Logging in...' : 'Login'}
                    </Button>
                  </form>
                )}
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="space-y-4 mt-0">
                {/* Role Selection for Signup */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">I am a...</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {SIGNUP_ROLES.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={cn(
                          "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-xs font-medium",
                          selectedRole === role
                            ? ROLE_COLORS[role]
                            : "border-border hover:border-muted-foreground/50"
                        )}
                      >
                        {ROLE_ICONS[role]}
                        <span>{ROLE_LABELS[role]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Signup Method Toggle */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={signupMethod === 'phone' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSignupMethod('phone');
                      resetSignupState();
                    }}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Phone
                  </Button>
                  <Button
                    type="button"
                    variant={signupMethod === 'email' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSignupMethod('email');
                      resetSignupState();
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                </div>

                {signupMethod === 'phone' ? (
                  <form onSubmit={handlePhoneSignup} className="space-y-4">
                    {!signupOtpSent ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="signup-name-phone">Full Name</Label>
                          <Input
                            id="signup-name-phone"
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-phone">Phone Number</Label>
                          <Input
                            id="signup-phone"
                            type="tel"
                            placeholder="+1234567890"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            Include country code (e.g., +1 for US, +91 for India)
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={resetSignupState}
                          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
                        >
                          <ArrowLeft className="w-4 h-4 mr-1" />
                          Change details
                        </button>
                        <div className="space-y-2">
                          <Label htmlFor="signup-otp">Enter OTP</Label>
                          <Input
                            id="signup-otp"
                            type="text"
                            placeholder="123456"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                            maxLength={6}
                          />
                          <p className="text-xs text-muted-foreground">
                            Enter the 6-digit code sent to {phone}
                          </p>
                        </div>
                      </>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading 
                        ? (signupOtpSent ? 'Verifying...' : 'Sending OTP...') 
                        : (signupOtpSent ? 'Verify & Create Account' : 'Send OTP')}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleEmailSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
