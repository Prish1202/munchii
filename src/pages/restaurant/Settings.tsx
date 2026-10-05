import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { ArrowLeft, Camera, Clock, CreditCard, Loader2, LogOut, Moon, SlidersHorizontal, Store, Sun, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PickupCapacitySettings } from '@/components/restaurant/PickupCapacitySettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useB2Upload } from '@/hooks/useB2Upload';
import { useMyRestaurant, useCreateRestaurant } from '@/hooks/useMenuManagement';
import { useBankDetails, useOwnerDetails, useSaveBankDetails } from '@/hooks/useRestaurantOnboarding';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { merchantTerms } from '@/lib/merchantTerms';

type Section = 'business' | 'ordering' | 'payments' | 'account';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
type DayHours = { open: boolean; from: string; to: string };
type WeeklyHours = Record<string, DayHours>;

const mask = (v?: string | null) => (v ? `•••• ${v.slice(-4)}` : '—');

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t px-4 py-3 first:border-t-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="truncate text-right text-sm font-semibold">{value || '—'}</span>
    </div>
  );
}

function OperatingHours({ restaurant, save }: { restaurant: any; save: (patch: Record<string, any>) => void }) {
  const initial: WeeklyHours = DAYS.reduce((acc, d) => {
    acc[d] = restaurant.weekly_hours?.[d] ?? { open: true, from: restaurant.opening_hours || '09:00', to: restaurant.closing_hours || '22:00' };
    return acc;
  }, {} as WeeklyHours);
  const [hours, setHours] = useState<WeeklyHours>(initial);
  const set = (day: string, patch: Partial<DayHours>) => setHours(prev => ({ ...prev, [day]: { ...prev[day], ...patch } }));

  return (
    <Card className="rounded-lg"><CardContent className="space-y-1 p-4">
      {DAYS.map(day => (
        <div key={day} className="flex flex-wrap items-center gap-3 border-t py-2.5 first:border-t-0">
          <div className="flex w-32 items-center gap-2">
            <Switch checked={hours[day].open} onCheckedChange={open => set(day, { open })} aria-label={`${day} open`} />
            <span className="text-sm font-semibold">{day.slice(0, 3)}</span>
          </div>
          {hours[day].open ? (
            <div className="flex flex-1 items-center gap-2">
              <Input type="time" className="h-9" value={hours[day].from} onChange={e => set(day, { from: e.target.value })} />
              <span className="text-xs text-muted-foreground">to</span>
              <Input type="time" className="h-9" value={hours[day].to} onChange={e => set(day, { to: e.target.value })} />
            </div>
          ) : <span className="text-sm text-muted-foreground">Closed</span>}
        </div>
      ))}
      <Button className="mt-3 w-full" onClick={() => save({ weekly_hours: hours })}>Save hours</Button>
    </CardContent></Card>
  );
}

function PaymentMethod({ restaurantId }: { restaurantId: string }) {
  const { data: bank, isLoading } = useBankDetails(restaurantId);
  const saveBank = useSaveBankDetails();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ account_holder_name: '', account_number: '', ifsc_code: '', bank_name: '', upi_id: '' });

  useEffect(() => {
    if (bank) setForm({
      account_holder_name: bank.account_holder_name || '', account_number: bank.account_number || '',
      ifsc_code: bank.ifsc_code || '', bank_name: bank.bank_name || '', upi_id: bank.upi_id || '',
    });
  }, [bank]);

  if (isLoading) return <div className="h-40 animate-pulse rounded-lg bg-muted" />;
  const hasAny = !!(bank?.account_number || bank?.upi_id);

  if (!editing) {
    return (
      <div className="space-y-3">
        <div className="overflow-hidden rounded-lg border bg-card">
          {hasAny ? (
            <>
              <InfoRow label="Account holder" value={bank?.account_holder_name} />
              <InfoRow label="Bank" value={bank?.bank_name} />
              <InfoRow label="Account number" value={mask(bank?.account_number)} />
              <InfoRow label="IFSC" value={bank?.ifsc_code} />
              <InfoRow label="UPI ID" value={bank?.upi_id} />
            </>
          ) : <p className="px-4 py-5 text-sm text-muted-foreground">No payout method added yet.</p>}
        </div>
        <Button className="w-full" onClick={() => setEditing(true)}>{hasAny ? 'Update payout method' : 'Add payout method'}</Button>
      </div>
    );
  }

  const field = (key: keyof typeof form, label: string, extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="space-y-1.5"><Label htmlFor={key}>{label}</Label><Input id={key} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} {...extra} /></div>
  );

  return (
    <Card className="rounded-lg"><CardContent className="space-y-3 p-4">
      {field('account_holder_name', 'Account holder name')}
      {field('bank_name', 'Bank name')}
      {field('account_number', 'Account number', { inputMode: 'numeric' })}
      {field('ifsc_code', 'IFSC code')}
      {field('upi_id', 'UPI ID (optional)')}
      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>Cancel</Button>
        <Button className="flex-1" disabled={saveBank.isPending} onClick={async () => {
          if (!form.upi_id.trim() && (!form.account_number.trim() || !form.ifsc_code.trim())) { toast.error('Add bank account + IFSC, or a UPI ID'); return; }
          await saveBank.mutateAsync({ restaurantId, details: { ...form, ifsc_code: form.ifsc_code.toUpperCase().trim() } });
          setEditing(false);
        }}>{saveBank.isPending ? 'Saving…' : 'Save'}</Button>
      </div>
    </CardContent></Card>
  );
}

export default function RestaurantSettings() {
  const [params] = useSearchParams();
  const section = (params.get('section') as Section) || 'business';
  const { data: restaurant, isLoading } = useMyRestaurant();
  const createRestaurant = useCreateRestaurant();
  const { user, logout } = useAuth();
  const { data: owner } = useOwnerDetails();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '' });

  const updateRestaurant = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      if (!restaurant?.id) throw new Error('Business not found');
      const { error } = await supabase.from('restaurants').update(data as any).eq('id', restaurant.id);
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
  const meta: Record<Section, { title: string; desc: string; icon: typeof Store }> = {
    business: { title: 'Business', desc: 'Outlet details, photo, visibility and operating hours', icon: Store },
    ordering: { title: 'Ordering & Pickup', desc: 'Pickup slots, capacity and order controls', icon: SlidersHorizontal },
    payments: { title: 'Payments & Payouts', desc: 'Where Munchii sends your earnings', icon: CreditCard },
    account: { title: 'Account', desc: 'Owner details and sign out', icon: UserRound },
  };
  const m = meta[section] ?? meta.business;
  const Icon = m.icon;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-5 pb-24 md:pb-8">
        <Link to="/restaurant/more" className="inline-flex items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" />More</Link>
        <header>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Icon className="h-5 w-5 text-primary" />{m.title}</h1>
          <p className="text-sm text-muted-foreground">{m.desc}</p>
        </header>

        {section === 'business' && (
          <>
            <Card className="rounded-lg"><CardContent className="space-y-5 p-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted">
                  {restaurant.photo_url ? <img src={restaurant.photo_url} alt={restaurant.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Camera className="h-6 w-6 text-muted-foreground" /></div>}
                </div>
                <div><Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>{uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}Change photo</Button><input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} /></div>
              </div>
              <div className="space-y-2"><Label>{terms.business} name</Label><Input defaultValue={restaurant.name} onBlur={event => event.target.value !== restaurant.name && updateRestaurant.mutate({ name: event.target.value })} /></div>
              <div className="space-y-2"><Label>Address</Label><Input defaultValue={restaurant.address} onBlur={event => event.target.value !== restaurant.address && updateRestaurant.mutate({ address: event.target.value })} /></div>
              <div className="flex items-center justify-between border-t pt-4"><div><p className="text-sm font-semibold">Outlet visible</p><p className="text-xs text-muted-foreground">{restaurant.is_active ? 'Customers can see and order' : 'Hidden from customers'}</p></div><Switch checked={restaurant.is_active} onCheckedChange={checked => updateRestaurant.mutate({ is_active: checked })} /></div>
            </CardContent></Card>
            <h2 className="flex items-center gap-2 pt-1 text-base font-bold"><Clock className="h-4 w-4 text-primary" />Operating hours</h2>
            <OperatingHours restaurant={restaurant} save={patch => updateRestaurant.mutate(patch)} />
          </>
        )}

        {section === 'ordering' && (
          <>
            <Card className="rounded-lg"><CardContent className="p-4"><div className="space-y-2"><Label>Preparation buffer (minutes)</Label><Input type="number" min={0} max={60} defaultValue={(restaurant as any).preparation_buffer_minutes ?? 5} onBlur={event => { const next = Math.min(60, Math.max(0, parseInt(event.target.value) || 0)); if (next !== ((restaurant as any).preparation_buffer_minutes ?? 5)) updateRestaurant.mutate({ preparation_buffer_minutes: next }); }} /><p className="text-xs text-muted-foreground">Extra time added when calculating pickup windows.</p></div></CardContent></Card>
            <PickupCapacitySettings restaurant={restaurant} update={patch => updateRestaurant.mutate(patch as any)} />
          </>
        )}

        {section === 'payments' && <PaymentMethod restaurantId={restaurant.id} />}

        {section === 'account' && (
          <>
            <div className="overflow-hidden rounded-lg border bg-card">
              <InfoRow label="Owner name" value={user?.name} />
              <InfoRow label={`${terms.business} name`} value={restaurant.name} />
              <InfoRow label="Email" value={owner?.contact_email || user?.email} />
              <InfoRow label="Phone" value={owner?.contact_phone || (restaurant as any).contact_phone || user?.phone} />
            </div>
            <div className="overflow-hidden rounded-lg border bg-card">
              <div className="flex items-center justify-between px-4 py-4"><div className="flex items-center gap-3">{theme === 'dark' ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}<span className="text-sm font-semibold">Dark mode</span></div><Switch checked={theme === 'dark'} onCheckedChange={checked => setTheme(checked ? 'dark' : 'light')} /></div>
              <Button variant="ghost" className="h-14 w-full justify-start rounded-none border-t px-4 text-destructive hover:text-destructive" onClick={logout}><LogOut className="mr-3 h-5 w-5" />Log out</Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
