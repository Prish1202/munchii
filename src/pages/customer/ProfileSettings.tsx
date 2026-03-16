import { useState, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Camera, Save, Loader2, Check, X, Shield, FileText, Users, Mail, MessageSquare, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ProfileSettings() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();
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

  // Init form when profile loads
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

  const LEGAL_LINKS = [
    { icon: FileText, label: 'Terms of Service', href: '/terms' },
    { icon: Users, label: 'Community Guidelines', href: '/community-guidelines' },
    { icon: Shield, label: 'Privacy Policy', href: '/privacy' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto pb-28 md:pb-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/customer/profile')} className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-lg">Edit Profile</h1>
        </div>

        {/* Avatar */}
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
          <p className="text-xs text-muted-foreground">Tap camera icon to change photo</p>
        </motion.div>

        {/* Form */}
        <motion.div className="bg-card rounded-2xl border border-border p-5 space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name" className="rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Username</label>
            <div className="relative">
              <Input
                value={form.username}
                onChange={e => handleUsernameChange(e.target.value)}
                placeholder="@username"
                className={`rounded-xl pr-9 ${usernameStatus === 'taken' ? 'border-destructive focus-visible:ring-destructive' : usernameStatus === 'available' ? 'border-green-500 focus-visible:ring-green-500' : ''}`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                {usernameStatus === 'available' && <Check className="w-4 h-4 text-green-500" />}
                {usernameStatus === 'taken' && <X className="w-4 h-4 text-destructive" />}
              </div>
            </div>
            {usernameStatus === 'taken' && <p className="text-[11px] text-destructive">Username not available</p>}
            {usernameStatus === 'available' && <p className="text-[11px] text-green-500">Username available!</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bio</label>
            <Textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell us about yourself..." className="rounded-xl resize-none" rows={3} maxLength={160} />
            <p className="text-[10px] text-muted-foreground text-right">{form.bio.length}/160</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Campus</label>
            <Input value={form.campus} onChange={e => setForm(p => ({ ...p, campus: e.target.value }))} placeholder="Your college/university" className="rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</label>
            <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" className="rounded-xl" />
          </div>

          <Button onClick={handleSave} className="w-full gradient-primary border-0 rounded-xl" disabled={updateProfile.isPending || usernameStatus === 'taken'}>
            {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </motion.div>

        {/* Chat & Notification Settings */}
        <motion.div className="bg-card rounded-2xl border border-border overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="px-5 pt-4 pb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preferences</h3>
          </div>
          <Link to="/customer/notification-settings" className="flex items-center justify-between px-5 py-3 hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Notification & Chat Settings</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </motion.div>

        {/* Legal & Safety */}
        <motion.div className="bg-card rounded-2xl border border-border overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="px-5 pt-4 pb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Legal & Safety</h3>
          </div>
          {LEGAL_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center justify-between px-5 py-3 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            );
          })}
        </motion.div>

        {/* Grievance Officer */}
        <motion.div className="bg-card rounded-2xl border border-border p-5 space-y-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
      </div>
    </DashboardLayout>
  );
}
