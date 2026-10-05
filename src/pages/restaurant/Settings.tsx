import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { Bell, Camera, ChevronRight, CircleHelp, CreditCard, Loader2, LogOut, Moon, Store, Sun, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PickupCapacitySettings } from '@/components/restaurant/PickupCapacitySettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useB2Upload } from '@/hooks/useB2Upload';
import { useMyRestaurant, useCreateRestaurant } from '@/hooks/useMenuManagement';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { merchantTerms } from '@/lib/merchantTerms';

export default function RestaurantSettings() {
  const { data: restaurant, isLoading } = useMyRestaurant();
  const createRestaurant = useCreateRestaurant();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '' });

  const updateRestaurant = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      if (!restaurant?.id) throw new Error('Business not found');
      const { error } = await supabase.from('restaurants').update(data).eq('id', restaurant.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-restaurant'] });
      toast.success('Settings updated');
    },
    onError: () => toast.error('Failed to update settings'),
  });
  const { upload: b2Upload } = useB2Upload();

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !restaurant) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setUploading(true);
    try {
      const result = await b2Upload(file, `restaurant-photos/${restaurant.id}`);
      if (!result) throw new Error('Upload failed');
      await updateRestaurant.mutateAsync({ photo_url: result.publicUrl });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) { toast.error('Please fill all fields'); return; }
    await createRestaurant.mutateAsync({ name: formData.name.trim(), address: formData.address.trim() });
  };

  if (isLoading) return <DashboardLayout><div className="mx-auto max-w-2xl space-y-4"><div className="h-24 animate-pulse rounded-lg bg-muted" /><div className="h-80 animate-pulse rounded-lg bg-muted" /></div></DashboardLayout>;

  if (!restaurant) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-lg space-y-5">
          <h1 className="text-2xl font-bold">Create your business</h1>
          <Card className="rounded-lg"><CardContent className="p-5">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="name">Business name</Label><Input id="name" value={formData.name} onChange={event => setFormData(previous => ({ ...previous, name: event.target.value }))} required /></div>
              <div className="space-y-2"><Label htmlFor="address">Address</Label><Input id="address" value={formData.address} onChange={event => setFormData(previous => ({ ...previous, address: event.target.value }))} required /></div>
              <Button type="submit" className="w-full" disabled={createRestaurant.isPending}>{createRestaurant.isPending ? 'Creating…' : 'Create business'}</Button>
            </form>
          </CardContent></Card>
        </div>
      </DashboardLayout>
    );
  }

  const terms = merchantTerms((restaurant as any).merchant_type);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6 pb-24 md:pb-8">
        <header>
          <p className="text-sm font-semibold text-primary">Manage</p>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Update your {terms.business.toLowerCase()}, pickup and account preferences.</p>
        </header>

        <section id="business" className="scroll-mt-24 space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold"><Store className="h-4 w-4 text-primary" />Business</h2>
          <Card className="rounded-lg"><CardContent className="space-y-5 p-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted">
                {restaurant.photo_url ? <img src={restaurant.photo_url} alt={restaurant.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Camera className="h-6 w-6 text-muted-foreground" /></div>}
              </div>
              <div><Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>{uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}Change photo</Button><input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} /></div>
            </div>
            <div className="space-y-2"><Label>{terms.business} name</Label><Input defaultValue={restaurant.name} onBlur={event => event.target.value !== restaurant.name && updateRestaurant.mutate({ name: event.target.value })} /></div>
            <div className="space-y-2"><Label>Address</Label><Input defaultValue={restaurant.address} onBlur={event => event.target.value !== restaurant.address && updateRestaurant.mutate({ address: event.target.value })} /></div>
            <div className="flex items-center justify-between border-t pt-4"><div><p className="text-sm font-semibold">Business active</p><p className="text-xs text-muted-foreground">{restaurant.is_active ? 'Visible to customers' : 'Hidden from customers'}</p></div><Switch checked={restaurant.is_active} onCheckedChange={checked => updateRestaurant.mutate({ is_active: checked })} /></div>
          </CardContent></Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold">Ordering & Pickup</h2>
          <Card className="rounded-lg"><CardContent className="p-4"><div className="space-y-2"><Label>Preparation buffer (minutes)</Label><Input type="number" min={0} max={60} defaultValue={(restaurant as any).preparation_buffer_minutes ?? 5} onBlur={event => { const next = Math.min(60, Math.max(0, parseInt(event.target.value) || 0)); if (next !== ((restaurant as any).preparation_buffer_minutes ?? 5)) updateRestaurant.mutate({ preparation_buffer_minutes: next }); }} /><p className="text-xs text-muted-foreground">Extra time added when calculating pickup windows.</p></div></CardContent></Card>
          <PickupCapacitySettings restaurant={restaurant} update={patch => updateRestaurant.mutate(patch as any)} />
        </section>

        <section id="payments" className="scroll-mt-24 space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold"><CreditCard className="h-4 w-4 text-primary" />Payments & Payouts</h2>
          <div className="overflow-hidden rounded-lg border bg-card">
            <Link to="/restaurant/payouts" className="flex items-center gap-3 px-4 py-4 hover:bg-muted/50"><CreditCard className="h-5 w-5 text-primary" /><div className="flex-1"><p className="text-sm font-semibold">Earnings & payout history</p><p className="text-xs text-muted-foreground">View completed orders and settlements</p></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>
            <div className="flex items-center justify-between border-t px-4 py-4"><div><p className="text-sm font-semibold">Online payments</p><p className="text-xs text-muted-foreground">UPI and cards are managed by Munchii</p></div><Switch checked disabled /></div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold"><Bell className="h-4 w-4 text-primary" />Notifications</h2>
          <div className="overflow-hidden rounded-lg border bg-card"><Link to="/restaurant/notification-settings" className="flex items-center gap-3 px-4 py-4 hover:bg-muted/50"><Bell className="h-5 w-5 text-primary" /><div className="flex-1"><p className="text-sm font-semibold">Notification preferences</p><p className="text-xs text-muted-foreground">Order alerts, sound and vibration</p></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link></div>
        </section>

        <section id="account" className="scroll-mt-24 space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold"><UserRound className="h-4 w-4 text-primary" />Account</h2>
          <div className="overflow-hidden rounded-lg border bg-card">
            <div className="flex items-center justify-between px-4 py-4"><div className="flex items-center gap-3">{theme === 'dark' ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}<span className="text-sm font-semibold">Dark mode</span></div><Switch checked={theme === 'dark'} onCheckedChange={checked => setTheme(checked ? 'dark' : 'light')} /></div>
            <Button variant="ghost" className="h-14 w-full justify-start rounded-none border-t px-4 text-destructive hover:text-destructive" onClick={logout}><LogOut className="mr-3 h-5 w-5" />Log out</Button>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold"><CircleHelp className="h-4 w-4 text-primary" />Help</h2>
          <div className="overflow-hidden rounded-lg border bg-card"><Link to="/contact" className="flex items-center gap-3 px-4 py-4 hover:bg-muted/50"><CircleHelp className="h-5 w-5 text-primary" /><div className="flex-1"><p className="text-sm font-semibold">Contact support</p><p className="text-xs text-muted-foreground">Get help with orders, payments or your account</p></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link></div>
        </section>
      </div>
    </DashboardLayout>
  );
}