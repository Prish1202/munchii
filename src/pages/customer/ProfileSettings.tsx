import { useState, useRef, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Camera, Save, Loader2, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
    if (!username || username === profile?.username) {
      setUsernameStatus('idle');
      return;
    }
    if (username.length < 3) {
      setUsernameStatus('idle');
      return;
    }
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

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      // Add cache-bust
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
    // Bio needs direct update since it's not in the Profile type yet
    supabase
      .from('profiles')
      .update({ bio: form.bio || null })
      .eq('id', user!.id)
      .then(() => {});
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto pb-28 md:pb-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/customer/profile')}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-lg">Edit Profile</h1>
        </div>

        {/* Avatar */}
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="relative group">
            <Avatar className="w-24 h-24 border-4 border-card shadow-lg">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.name} />
              ) : null}
              <AvatarFallback className="gradient-primary text-primary-foreground text-3xl font-display font-bold">
                {profile?.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <p className="text-xs text-muted-foreground">Tap camera icon to change photo</p>
        </motion.div>

        {/* Form */}
        <motion.div
          className="bg-card rounded-2xl border border-border p-5 space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</label>
            <Input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Your name"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Username</label>
            <Input
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
              placeholder="@username"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bio</label>
            <Textarea
              value={form.bio}
              onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              placeholder="Tell us about yourself..."
              className="rounded-xl resize-none"
              rows={3}
              maxLength={160}
            />
            <p className="text-[10px] text-muted-foreground text-right">{form.bio.length}/160</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Campus</label>
            <Input
              value={form.campus}
              onChange={e => setForm(p => ({ ...p, campus: e.target.value }))}
              placeholder="Your college/university"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</label>
            <Input
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="Phone number"
              className="rounded-xl"
            />
          </div>

          <Button
            onClick={handleSave}
            className="w-full gradient-primary border-0 rounded-xl"
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
