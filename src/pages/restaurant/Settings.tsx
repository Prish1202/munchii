import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useMyRestaurant, useCreateRestaurant } from '@/hooks/useMenuManagement';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Store, MapPin, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function RestaurantSettings() {
  const { data: restaurant, isLoading } = useMyRestaurant();
  const createRestaurant = useCreateRestaurant();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
  });

  const updateRestaurant = useMutation({
    mutationFn: async (data: { name?: string; address?: string; is_active?: boolean }) => {
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
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </DashboardLayout>
    );
  }

  // Show create form if no restaurant exists
  if (!restaurant) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-xl mx-auto">
          <div>
            <Link
              to="/restaurant"
              className="inline-flex items-center text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Create Your Restaurant</h1>
            <p className="text-muted-foreground">Set up your restaurant to start receiving orders</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Spice Garden"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="e.g., 123 Food Street, City"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-restaurant hover:bg-restaurant/90"
                  disabled={createRestaurant.isPending}
                >
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
      <div className="space-y-6 max-w-xl">
        {/* Header */}
        <div>
          <Link
            to="/restaurant"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Restaurant Settings</h1>
          <p className="text-muted-foreground">Manage your restaurant profile</p>
        </div>

        {/* Restaurant Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Restaurant Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Restaurant Name</Label>
              <Input
                defaultValue={restaurant.name}
                onBlur={(e) => {
                  if (e.target.value !== restaurant.name) {
                    updateRestaurant.mutate({ name: e.target.value });
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                defaultValue={restaurant.address}
                onBlur={(e) => {
                  if (e.target.value !== restaurant.address) {
                    updateRestaurant.mutate({ address: e.target.value });
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Restaurant Active</p>
                <p className="text-sm text-muted-foreground">
                  {restaurant.is_active 
                    ? 'Your restaurant is visible to customers' 
                    : 'Your restaurant is hidden from customers'}
                </p>
              </div>
              <Switch
                checked={restaurant.is_active}
                onCheckedChange={(checked) => updateRestaurant.mutate({ is_active: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
