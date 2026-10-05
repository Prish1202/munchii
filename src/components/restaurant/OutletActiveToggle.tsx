import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { useMyRestaurant } from '@/hooks/useMenuManagement';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export function OutletActiveToggle({ className }: { className?: string }) {
  const { data: restaurant } = useMyRestaurant();
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async (checked: boolean) => {
      if (!restaurant) throw new Error('Outlet not found');
      const { error } = await supabase.from('restaurants').update({ is_active: checked }).eq('id', restaurant.id);
      if (error) throw error;
      return checked;
    },
    onSuccess: async checked => {
      await queryClient.invalidateQueries({ queryKey: ['my-restaurant'] });
      toast.success(checked ? 'Outlet is now online' : 'Outlet is now offline');
    },
    onError: () => toast.error('Could not update outlet status'),
  });

  if (!restaurant) return null;
  const active = !!restaurant.is_active;
  const displayedActive = updateStatus.isPending && typeof updateStatus.variables === 'boolean'
    ? updateStatus.variables
    : active;

  return (
    <label className={cn('flex items-center gap-2 rounded-full border bg-card px-3 py-1.5', className)}>
      <span className={cn('h-2 w-2 rounded-full', displayedActive ? 'bg-primary' : 'bg-muted-foreground')} />
      <span className="text-xs font-semibold">{displayedActive ? 'Outlet online' : 'Outlet offline'}</span>
      <Switch
        checked={displayedActive}
        disabled={updateStatus.isPending}
        onCheckedChange={checked => updateStatus.mutate(checked)}
        aria-label="Outlet active"
      />
    </label>
  );
}
