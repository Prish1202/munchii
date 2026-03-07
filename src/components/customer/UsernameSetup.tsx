import { useState } from 'react';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AtSign, Check, X, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface UsernameSetupProps {
  children: React.ReactNode;
}

export function UsernameSetup({ children }: UsernameSetupProps) {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [username, setUsername] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  // If profile has username already, render children
  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (profile?.username) {
    return <>{children}</>;
  }

  const sanitized = username.toLowerCase().replace(/[^a-z0-9_]/g, '');

  const checkAvailability = async (value: string) => {
    if (value.length < 3) {
      setAvailable(null);
      return;
    }
    setChecking(true);
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', value)
      .maybeSingle();
    setAvailable(!data);
    setChecking(false);
  };

  const handleChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(clean);
    setAvailable(null);
    if (clean.length >= 3) {
      // Debounce-like: check after setting
      setTimeout(() => checkAvailability(clean), 300);
    }
  };

  const handleSubmit = async () => {
    if (!available || sanitized.length < 3) return;
    setSaving(true);
    try {
      await updateProfile.mutateAsync({ username: sanitized });
    } catch (err: any) {
      if (err.message?.includes('duplicate') || err.message?.includes('unique')) {
        toast.error('Username already taken, try another');
        setAvailable(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 bg-dot-pattern opacity-[0.03] pointer-events-none" />
      <div className="fixed top-[-15%] left-[-10%] w-[450px] h-[450px] rounded-full bg-hero-orb-1 blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full bg-hero-orb-2 blur-3xl pointer-events-none" />

      <motion.div
        className="w-full max-w-sm space-y-6 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary text-primary-foreground shadow-lg">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-display font-bold">Choose your username</h1>
          <p className="text-sm text-muted-foreground">
            Your unique identity on FoodyZone. Friends will use this to find you, send points, and chat!
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-xl">
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="username"
              value={username}
              onChange={(e) => handleChange(e.target.value)}
              maxLength={20}
              className="pl-9 pr-10 rounded-xl text-base"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {checking && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              {!checking && available === true && <Check className="w-4 h-4 text-accent" />}
              {!checking && available === false && <X className="w-4 h-4 text-destructive" />}
            </div>
          </div>

          {username.length > 0 && username.length < 3 && (
            <p className="text-xs text-muted-foreground">Minimum 3 characters</p>
          )}
          {available === false && (
            <p className="text-xs text-destructive">Username already taken</p>
          )}
          {available === true && (
            <p className="text-xs text-accent">@{sanitized} is available! 🎉</p>
          )}

          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Only lowercase letters, numbers, and underscores</li>
            <li>• 3–20 characters</li>
            <li>• Cannot be changed frequently</li>
          </ul>

          <Button
            onClick={handleSubmit}
            disabled={!available || saving || sanitized.length < 3}
            className="w-full rounded-xl gradient-primary border-0"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Set Username
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
