import { useState, useRef } from 'react';
import { useB2Upload } from '@/hooks/useB2Upload';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMyRestaurant, useCreateRestaurant } from '@/hooks/useMenuManagement';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Store, Bell, LogOut, Moon, Sun, Camera, Loader2, CreditCard, Image } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from 'next-themes';

export default function RestaurantSettings() {
  const { data: restaurant, isLoading } = useMyRestaurant();
  const createRestaurant = useCreateRestaurant();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
  });

  const updateRestaurant = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const { error } = await supabase
        .from('restaurants')
        .update(data)
        .eq('id', restaurant!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-restaurant'] });
      toast.success('Settings updated');
    },
    onError: () => {
      toast.error('Failed to update settings');
    },
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurant) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${restaurant.id}/thumbnail.${ext}`;
      const { error: uploadError } = await supabase.storage.from('menu-images').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('menu-images').getPublicUrl(path);
      const photoUrl = `${publicUrl}?t=${Date.now()}`;
      await updateRestaurant.mutateAsync({ photo_url: photoUrl });
      toast.success('Photo updated!');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    await createRestaurant.mutateAsync({
      name: formData.name.trim(),
      address: formData.address.trim(),
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6 max-w-lg mx-auto">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </DashboardLayout>
    );
  }

  if (!restaurant) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-lg mx-auto px-1">
          <div>
            <Link to="/restaurant" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
            <h1 className="text-xl font-bold">Create Your Restaurant</h1>
            <p className="text-sm text-muted-foreground">Set up your restaurant to start receiving orders</p>
          </div>
          <Card className="rounded-2xl">
            <CardContent className="p-5">
              <form onSubmit={handleCreate} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name</Label>
                  <Input id="name" placeholder="e.g., Spice Garden" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="e.g., 123 Food Street" value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} required className="rounded-xl" />
                </div>
                <Button type="submit" className="w-full rounded-xl" disabled={createRestaurant.isPending}>
                  {createRestaurant.isPending ? 'Creating...' : 'Create Restaurant'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-lg mx-auto px-1 pb-24 md:pb-6">
        <div>
          <Link to="/restaurant" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
          <h1 className="text-xl font-bold">Restaurant Settings</h1>
        </div>

        {/* Thumbnail */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Image className="w-4 h-4" /> Outlet Thumbnail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted border border-border">
              {restaurant.photo_url ? (
                <img src={restaurant.photo_url} alt={restaurant.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <Camera className="w-8 h-8 mb-2" />
                  <p className="text-sm">No photo yet</p>
                </div>
              )}
            </div>
            <Button variant="outline" className="w-full rounded-xl" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : <><Camera className="w-4 h-4 mr-2" /> {restaurant.photo_url ? 'Change Photo' : 'Upload Photo'}</>}
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </CardContent>
        </Card>

        {/* Restaurant Info */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Store className="w-4 h-4" /> Restaurant Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Restaurant Name</Label>
              <Input defaultValue={restaurant.name} className="rounded-xl" onBlur={(e) => {
                if (e.target.value !== restaurant.name) updateRestaurant.mutate({ name: e.target.value });
              }} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input defaultValue={restaurant.address} className="rounded-xl" onBlur={(e) => {
                if (e.target.value !== restaurant.address) updateRestaurant.mutate({ address: e.target.value });
              }} />
            </div>
          </CardContent>
        </Card>

        {/* Payment Preferences */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><CreditCard className="w-4 h-4" /> Accepted Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">Configure which payment methods your restaurant accepts. All methods are enabled by default.</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Cash on Pickup</p>
                  <p className="text-xs text-muted-foreground">Accept cash payments</p>
                </div>
                <Switch defaultChecked disabled />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">UPI</p>
                  <p className="text-xs text-muted-foreground">Accept UPI payments</p>
                </div>
                <Switch defaultChecked disabled />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Card</p>
                  <p className="text-xs text-muted-foreground">Accept card payments</p>
                </div>
                <Switch defaultChecked disabled />
              </div>
              <p className="text-[11px] text-muted-foreground">Payment method configuration is managed by the platform. Contact support for changes.</p>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Restaurant Active</p>
                <p className="text-xs text-muted-foreground">
                  {restaurant.is_active ? 'Visible to customers' : 'Hidden from customers'}
                </p>
              </div>
              <Switch checked={restaurant.is_active} onCheckedChange={(checked) => updateRestaurant.mutate({ is_active: checked })} />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <Link to="/restaurant/notifications">
              <Button variant="outline" className="w-full justify-between rounded-xl">
                <span className="flex items-center gap-2"><Bell className="w-4 h-4" /> Notifications</span>
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <span className="text-sm font-medium">Dark Mode</span>
              </div>
              <Switch checked={theme === 'dark'} onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} />
            </div>
          </CardContent>
        </Card>

        {/* Log Out */}
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/5 rounded-xl" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
