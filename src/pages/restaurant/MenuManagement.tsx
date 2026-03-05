import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  useMyRestaurant, 
  useMyMenuItems, 
  useCreateMenuItem, 
  useUpdateMenuItem,
  useDeleteMenuItem 
} from '@/hooks/useMenuManagement';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  Plus, 
  Pencil, 
  Trash2,
  UtensilsCrossed,
  ImagePlus,
  Percent
} from 'lucide-react';
import { toast } from 'sonner';

export default function MenuManagement() {
  const { user } = useAuth();
  const { data: restaurant } = useMyRestaurant();
  const { data: menuItems, isLoading } = useMyMenuItems();
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; name: string; price: number; description?: string; discount_percent?: number; image_url?: string } | null>(null);
  const [newItem, setNewItem] = useState({ name: '', price: '', description: '', discount_percent: '', image_url: '' });
  const [uploading, setUploading] = useState(false);
  const [editUploading, setEditUploading] = useState(false);
  const addFileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${user!.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('menu-images').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('menu-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleImageUpload = async (file: File, target: 'add' | 'edit') => {
    const setter = target === 'add' ? setUploading : setEditUploading;
    setter(true);
    try {
      const url = await uploadImage(file);
      if (target === 'add') {
        setNewItem(prev => ({ ...prev, image_url: url }));
      } else if (editingItem) {
        setEditingItem(prev => prev ? { ...prev, image_url: url } : null);
      }
    } catch {
      toast.error('Failed to upload image');
    }
    setter(false);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim() || !newItem.price) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!newItem.image_url) {
      toast.error('Please upload a food image');
      return;
    }
    
    await createItem.mutateAsync({
      name: newItem.name.trim(),
      price: parseFloat(newItem.price),
      image_url: newItem.image_url,
      description: newItem.description.trim() || undefined,
      discount_percent: newItem.discount_percent ? parseFloat(newItem.discount_percent) : undefined,
    });
    
    setNewItem({ name: '', price: '', description: '', discount_percent: '', image_url: '' });
    setIsAddOpen(false);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    
    await updateItem.mutateAsync({
      id: editingItem.id,
      name: editingItem.name.trim(),
      price: editingItem.price,
      image_url: editingItem.image_url,
      description: editingItem.description,
      discount_percent: editingItem.discount_percent,
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
            <Link to="/restaurant" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-display font-bold">Menu Management</h1>
            <p className="text-muted-foreground">Add, edit, or disable menu items</p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Add Menu Item</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddItem} className="space-y-4">
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Food Image <span className="text-destructive">*</span></Label>
                  <input ref={addFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'add')} />
                  {newItem.image_url ? (
                    <div className="relative rounded-xl overflow-hidden">
                      <img src={newItem.image_url} alt="Preview" className="w-full h-40 object-cover" />
                      <button type="button" onClick={() => addFileRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm font-medium opacity-0 hover:opacity-100 transition-opacity">
                        Change Image
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => addFileRef.current?.click()} disabled={uploading} className="w-full h-40 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                      <ImagePlus className="w-8 h-8" />
                      <span className="text-sm">{uploading ? 'Uploading...' : 'Upload Food Image'}</span>
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name <span className="text-destructive">*</span></Label>
                  <Input id="name" placeholder="e.g., Butter Chicken" value={newItem.name} onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))} required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) <span className="text-destructive">*</span></Label>
                  <Input id="price" type="number" placeholder="e.g., 350" min="0" step="0.01" value={newItem.price} onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))} required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Textarea id="description" placeholder="Describe the dish..." value={newItem.description} onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))} className="rounded-xl resize-none" rows={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount % <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input id="discount" type="number" placeholder="e.g., 10" min="0" max="100" value={newItem.discount_percent} onChange={(e) => setNewItem(prev => ({ ...prev, discount_percent: e.target.value }))} className="rounded-xl" />
                </div>
                <Button type="submit" className="w-full rounded-xl gradient-primary text-primary-foreground" disabled={createItem.isPending || uploading}>
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
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : menuItems?.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-8 text-center">
              <UtensilsCrossed className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No menu items yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Add your first menu item to start receiving orders</p>
              <Button onClick={() => setIsAddOpen(true)} className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {menuItems?.map((item) => (
              <Card key={item.id} className={`rounded-2xl ${!item.available ? 'opacity-60' : ''}`}>
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    {/* Image */}
                    {(item as any).image_url && (
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                        <img src={(item as any).image_url} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{item.name}</h3>
                          {!item.available && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-lg">Disabled</span>
                          )}
                          {(item as any).discount_percent > 0 && (
                            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-lg font-medium flex items-center gap-0.5">
                              <Percent className="w-3 h-3" />{(item as any).discount_percent}% off
                            </span>
                          )}
                        </div>
                        {(item as any).description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{(item as any).description}</p>
                        )}
                        <p className="text-primary font-medium mt-0.5">₹{Number(item.price).toFixed(2)}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground hidden sm:inline">Available</span>
                          <Switch checked={item.available} onCheckedChange={() => handleToggleAvailable(item.id, item.available)} />
                        </div>

                        <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => !open && setEditingItem(null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setEditingItem({ id: item.id, name: item.name, price: Number(item.price), description: (item as any).description || '', discount_percent: (item as any).discount_percent || 0, image_url: (item as any).image_url || '' })}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle className="font-display">Edit Menu Item</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleUpdateItem} className="space-y-4">
                              {/* Image */}
                              <div className="space-y-2">
                                <Label>Food Image</Label>
                                <input ref={editFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'edit')} />
                                {editingItem?.image_url ? (
                                  <div className="relative rounded-xl overflow-hidden">
                                    <img src={editingItem.image_url} alt="Preview" className="w-full h-40 object-cover" />
                                    <button type="button" onClick={() => editFileRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm font-medium opacity-0 hover:opacity-100 transition-opacity">
                                      {editUploading ? 'Uploading...' : 'Change Image'}
                                    </button>
                                  </div>
                                ) : (
                                  <button type="button" onClick={() => editFileRef.current?.click()} disabled={editUploading} className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary transition-colors">
                                    <ImagePlus className="w-6 h-6" />
                                    <span className="text-sm">{editUploading ? 'Uploading...' : 'Upload Image'}</span>
                                  </button>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-name">Item Name</Label>
                                <Input id="edit-name" value={editingItem?.name || ''} onChange={(e) => setEditingItem(prev => prev ? { ...prev, name: e.target.value } : null)} required className="rounded-xl" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-price">Price (₹)</Label>
                                <Input id="edit-price" type="number" min="0" step="0.01" value={editingItem?.price || ''} onChange={(e) => setEditingItem(prev => prev ? { ...prev, price: parseFloat(e.target.value) } : null)} required className="rounded-xl" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-desc">Description</Label>
                                <Textarea id="edit-desc" value={editingItem?.description || ''} onChange={(e) => setEditingItem(prev => prev ? { ...prev, description: e.target.value } : null)} className="rounded-xl resize-none" rows={2} />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-discount">Discount %</Label>
                                <Input id="edit-discount" type="number" min="0" max="100" value={editingItem?.discount_percent || ''} onChange={(e) => setEditingItem(prev => prev ? { ...prev, discount_percent: parseFloat(e.target.value) || 0 } : null)} className="rounded-xl" />
                              </div>
                              <Button type="submit" className="w-full rounded-xl gradient-primary text-primary-foreground" disabled={updateItem.isPending || editUploading}>
                                {updateItem.isPending ? 'Saving...' : 'Save Changes'}
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>

                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive rounded-xl" onClick={() => handleDelete(item.id)} disabled={deleteItem.isPending}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
