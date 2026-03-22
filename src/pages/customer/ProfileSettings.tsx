import { useState, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft, Camera, Save, Loader2, Check, X,
  Shield, FileText, Users, Mail, MessageSquare, ChevronRight,
  Bell, Moon, Sun, LogOut, HelpCircle, Lock, Globe, Eye
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

export default function ProfileSettings() {
  const { user, logout } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    username: '',
    bio: '',
    campus: '',
    phone: '',
  });
  const [initialized, setInitialized] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const usernameTimerRef = useRef<ReturnType<typeof setTimeout>>();

  if (profile && !initialized) {
    setForm({
      name: profile.name || '',
      username: profile.username || '',
      bio: (profile as any).bio || '',
      campus: profile.campus || '',
      phone: profile.phone || '',
    });
    setInitialized(true);
  }

  const checkUsername = useCallback(async (username: string) => {
    if (!username || username === profile?.username) { setUsernameStatus('idle'); return; }
    if (username.length < 3) { setUsernameStatus('idle'); return; }
    setUsernameStatus('checking');
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', user?.id || '')
      .maybeSingle();
    setUsernameStatus(data ? 'taken' : 'available');
  }, [profile?.username, user?.id]);

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setForm(p => ({ ...p, username: cleaned }));
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
    usernameTimerRef.current = setTimeout(() => checkUsername(cleaned), 400);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;
      await updateProfile.mutateAsync({ avatar_url: avatarUrl });
      toast.success('Profile picture updated!');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    updateProfile.mutate({
      name: form.name || undefined,
      username: form.username || undefined,
      campus: form.campus || null,
      phone: form.phone || null,
    } as any);
    supabase.from('profiles').update({ bio: form.bio || null }).eq('id', user!.id).then(() => {});
  };

  const SettingsSection = ({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) => (
    <motion.div
      className="bg-card rounded-2xl border border-border overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className="px-5 pt-4 pb-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </motion.div>
  );

  const SettingsLink = ({ icon: Icon, label, href, destructive }: { icon: any; label: string; href?: string; destructive?: boolean }) => {
    const content = (
      <div className={`flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer ${destructive ? 'text-destructive' : ''}`}>
        <div className="flex items-center gap-3">
          <Icon className="w-4.5 h-4.5" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        {!destructive && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </div>
    );
    if (href) return <Link to={href}>{content}</Link>;
    return content;
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto pb-28 md:pb-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/customer/profile')} className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-lg">Settings</h1>
        </div>

        {/* Avatar + Name */}
        <motion.div className="flex flex-col items-center gap-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative group">
            <Avatar className="w-24 h-24 border-4 border-card shadow-lg">
              {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={profile.name} /> : null}
              <AvatarFallback className="gradient-primary text-primary-foreground text-3xl font-display font-bold">
                {profile?.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div className="text-center">
            <p className="font-display font-bold">{profile?.name}</p>
            {profile?.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
          </div>
        </motion.div>

        {/* Edit Profile */}
        <SettingsSection title="Edit Profile" delay={0.05}>
          <div className="px-5 pb-5 space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Username</label>
              <div className="relative">
                <Input
                  value={form.username}
                  onChange={e => handleUsernameChange(e.target.value)}
                  placeholder="@username"
                  className={`rounded-xl pr-9 ${usernameStatus === 'taken' ? 'border-destructive focus-visible:ring-destructive' : usernameStatus === 'available' ? 'border-primary focus-visible:ring-primary' : ''}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  {usernameStatus === 'available' && <Check className="w-4 h-4 text-primary" />}
                  {usernameStatus === 'taken' && <X className="w-4 h-4 text-destructive" />}
                </div>
              </div>
              {usernameStatus === 'taken' && <p className="text-[11px] text-destructive">Username not available</p>}
              {usernameStatus === 'available' && <p className="text-[11px] text-primary">Username available!</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Bio</label>
              <Textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell us about yourself..." className="rounded-xl resize-none" rows={3} maxLength={160} />
              <p className="text-[10px] text-muted-foreground text-right">{form.bio.length}/160</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Campus</label>
              <Input value={form.campus} onChange={e => setForm(p => ({ ...p, campus: e.target.value }))} placeholder="Your college/university" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Phone</label>
              <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" className="rounded-xl" />
            </div>
            <Button onClick={handleSave} className="w-full gradient-primary border-0 rounded-xl" disabled={updateProfile.isPending || usernameStatus === 'taken'}>
              {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </SettingsSection>

        {/* Preferences */}
        <SettingsSection title="Preferences" delay={0.1}>
          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
              <span className="text-sm font-medium">Dark Mode</span>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
          <SettingsLink icon={Bell} label="Notifications" href="/customer/notification-settings" />
          <SettingsLink icon={MessageSquare} label="Chat Settings" href="/customer/chat-settings" />
        </SettingsSection>

        {/* Privacy & Security */}
        <SettingsSection title="Privacy & Security" delay={0.15}>
          <SettingsLink icon={Lock} label="Change Password" href="/forgot-password" />
          <SettingsLink icon={Eye} label="Account Privacy" href="/customer/account-privacy" />
        </SettingsSection>

        {/* Legal & Support */}
        <SettingsSection title="Legal & Support" delay={0.2}>
          <SettingsLink icon={FileText} label="Terms of Service" href="/terms" />
          <SettingsLink icon={Users} label="Community Guidelines" href="/community-guidelines" />
          <SettingsLink icon={Shield} label="Privacy Policy" href="/privacy" />
          <SettingsLink icon={FileText} label="Cancellation & Refund Policy" href="/cancellation-refund" />
          <SettingsLink icon={HelpCircle} label="Help & Support" href="mailto:munchii.in.prm@gmail.com" />
        </SettingsSection>

        {/* Grievance Officer */}
        <motion.div className="bg-card rounded-2xl border border-border p-5 space-y-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Grievance Officer</h3>
          </div>
          <p className="text-sm text-foreground">
            For any grievances or concerns, contact our Grievance Officer:
          </p>
          <a href="mailto:munchii.in.prm@gmail.com" className="text-sm text-primary font-medium hover:underline">
            munchii.in.prm@gmail.com
          </a>
          <p className="text-[11px] text-muted-foreground">
            We aim to acknowledge grievances within 24 hours and resolve within 15 business days.
          </p>
        </motion.div>

        {/* Log Out */}
        <motion.div
          className="bg-card rounded-2xl border border-border overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button onClick={logout} className="flex items-center gap-3 px-5 py-3.5 w-full text-destructive hover:bg-destructive/5 transition-colors">
            <LogOut className="w-4.5 h-4.5" />
            <span className="text-sm font-semibold">Log Out</span>
          </button>
        </motion.div>

        <p className="text-center text-[11px] text-muted-foreground pb-4">Munchii v1.0</p>
      </div>
    </DashboardLayout>
  );
}
