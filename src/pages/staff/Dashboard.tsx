import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, Check, X, PackageCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type StaffOrder = {
  id: string; status: string; created_at: string; pickup_time: string | null;
  order_items: { id: string; quantity: number; option_label: string | null; menu_item: { name: string } | null }[];
};

const LIVE = ['placed', 'accepted', 'preparing'];
const LABEL: Record<string, string> = {
  placed: 'New', accepted: 'Accepted', preparing: 'Preparing', ready_for_pickup: 'Ready',
  picked_up: 'Picked up', completed: 'Completed', cancelled: 'Rejected',
};

export default function StaffDashboard() {
  const { logout } = useAuth();
  const qc = useQueryClient();

  const { data: outlet } = useQuery({
    queryKey: ['staff-outlet'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_staff_outlet' as any);
      if (error) throw error;
      return (data as any[])?.[0] as { id: string; name: string; staff_name: string } | undefined;
    },
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['staff-orders', outlet?.id],
    enabled: !!outlet?.id,
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, created_at, pickup_time, order_items(id, quantity, option_label, menu_item:menu_items(name))')
        .eq('restaurant_id', outlet!.id)
        .neq('status', 'pending_payment' as any)
        .gte('created_at', start.toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as StaffOrder[];
    },
  });

  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: ['staff-orders'] }), [qc]);
  useRealtimeSync({
    channelName: `staff-orders-${outlet?.id}`, table: 'orders', filter: `restaurant_id=eq.${outlet?.id}`,
    onInsert: refresh, onUpdate: refresh, enabled: !!outlet?.id,
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase.from('orders').update({ status: status as any }).eq('id', id).select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('You no longer have access to this order');
    },
    onSuccess: (_d, v) => { refresh(); toast.success(v.status === 'accepted' ? 'Order accepted' : v.status === 'cancelled' ? 'Order rejected' : 'Marked as ready'); },
    onError: (e: any) => toast.error('Could not update order', { description: e?.message }),
  });

  const live = useMemo(() => orders.filter(o => LIVE.includes(o.status)), [orders]);
  const history = useMemo(() => orders.filter(o => !LIVE.includes(o.status)), [orders]);

  const OrderCard = ({ o }: { o: StaffOrder }) => (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">#{o.id.slice(0, 6).toUpperCase()}</span>
          <Badge variant={o.status === 'placed' ? 'default' : 'secondary'}>{LABEL[o.status] || o.status}</Badge>
        </div>
        <ul className="text-sm space-y-0.5">
          {o.order_items.map(i => (
            <li key={i.id}>{i.quantity} × {i.menu_item?.name || 'Item'}{i.option_label ? ` (${i.option_label})` : ''}</li>
          ))}
        </ul>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> Pickup {o.pickup_time ? format(new Date(o.pickup_time), 'h:mm a') : 'ASAP'}
        </p>
        {o.status === 'placed' && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" disabled={update.isPending} onClick={() => update.mutate({ id: o.id, status: 'cancelled' })}>
              <X className="h-4 w-4 mr-1" /> Reject
            </Button>
            <Button disabled={update.isPending} onClick={() => update.mutate({ id: o.id, status: 'accepted' })}>
              <Check className="h-4 w-4 mr-1" /> Accept
            </Button>
          </div>
        )}
        {(o.status === 'accepted' || o.status === 'preparing') && (
          <Button className="w-full" disabled={update.isPending} onClick={() => update.mutate({ id: o.id, status: 'ready_for_pickup' })}>
            <PackageCheck className="h-4 w-4 mr-1" /> Mark as ready
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="restaurant-theme min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Staff · {outlet?.staff_name}</p>
          <h1 className="text-lg font-bold">{outlet?.name || 'Outlet'}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={logout}><LogOut className="h-4 w-4 mr-1" /> Logout</Button>
      </header>
      <main className="mx-auto max-w-2xl p-4 space-y-6 pb-16">
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase text-muted-foreground">Live orders ({live.length})</h2>
          {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p>
            : live.length === 0 ? <p className="text-sm text-muted-foreground">No live orders right now.</p>
            : live.map(o => <OrderCard key={o.id} o={o} />)}
        </section>
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase text-muted-foreground">Today's history ({history.length})</h2>
          {history.length === 0 ? <p className="text-sm text-muted-foreground">Nothing yet today.</p>
            : history.map(o => <OrderCard key={o.id} o={o} />)}
        </section>
      </main>
    </div>
  );
}
