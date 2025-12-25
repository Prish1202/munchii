import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  useMyRestaurant, 
  useMyMenuItems, 
  useCreateMenuItem, 
  useUpdateMenuItem,
  useDeleteMenuItem 
} from '@/hooks/useMenuManagement';
import { 
  ArrowLeft, 
  Plus, 
  Pencil, 
  Trash2,
  UtensilsCrossed
} from 'lucide-react';
import { toast } from 'sonner';

export default function MenuManagement() {
  const { data: restaurant } = useMyRestaurant();
  const { data: menuItems, isLoading } = useMyMenuItems();
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; name: string; price: number } | null>(null);
  const [newItem, setNewItem] = useState({ name: '', price: '' });

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim() || !newItem.price) {
      toast.error('Please fill all fields');
      return;
    }
    
    await createItem.mutateAsync({
      name: newItem.name.trim(),
      price: parseFloat(newItem.price),
    });
    
    setNewItem({ name: '', price: '' });
    setIsAddOpen(false);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    
    await updateItem.mutateAsync({
      id: editingItem.id,
      name: editingItem.name.trim(),
      price: editingItem.price,
    });
    
    setEditingItem(null);
  };

  const handleToggleAvailable = async (id: string, available: boolean) => {
    await updateItem.mutateAsync({ id, available: !available });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteItem.mutateAsync(id);
    }
  };

  if (!restaurant) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please set up your restaurant first.</p>
          <Link to="/restaurant/settings" className="text-primary hover:underline">
            Go to Settings
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 md:pb-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              to="/restaurant"
              className="inline-flex items-center text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Menu Management</h1>
            <p className="text-muted-foreground">Add, edit, or disable menu items</p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-restaurant hover:bg-restaurant/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Menu Item</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Butter Chicken"
                    value={newItem.name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="e.g., 350"
                    min="0"
                    step="0.01"
                    value={newItem.price}
                    onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createItem.isPending}>
                  {createItem.isPending ? 'Adding...' : 'Add Item'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Menu Items */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : menuItems?.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <UtensilsCrossed className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No menu items yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first menu item to start receiving orders
              </p>
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {menuItems?.map((item) => (
              <Card key={item.id} className={!item.available ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{item.name}</h3>
                        {!item.available && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">Disabled</span>
                        )}
                      </div>
                      <p className="text-primary font-medium">₹{Number(item.price).toFixed(2)}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Availability Toggle */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Available</span>
                        <Switch
                          checked={item.available}
                          onCheckedChange={() => handleToggleAvailable(item.id, item.available)}
                        />
                      </div>

                      {/* Edit Button */}
                      <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => !open && setEditingItem(null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setEditingItem({ id: item.id, name: item.name, price: Number(item.price) })}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Menu Item</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleUpdateItem} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Item Name</Label>
                              <Input
                                id="edit-name"
                                value={editingItem?.name || ''}
                                onChange={(e) => setEditingItem(prev => prev ? { ...prev, name: e.target.value } : null)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-price">Price (₹)</Label>
                              <Input
                                id="edit-price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={editingItem?.price || ''}
                                onChange={(e) => setEditingItem(prev => prev ? { ...prev, price: parseFloat(e.target.value) } : null)}
                                required
                              />
                            </div>
                            <Button type="submit" className="w-full" disabled={updateItem.isPending}>
                              {updateItem.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>

                      {/* Delete Button */}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteItem.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
