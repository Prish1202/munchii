import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertCircle, ChevronRight, Clock3, PackageCheck, ShoppingBag, Store } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PauseOrdersControl } from '@/components/restaurant/PickupCapacitySettings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRestaurantOrders, RestaurantOrder } from '@/hooks/useRestaurantOrders';
import { useMyRestaurant } from '@/hooks/useMenuManagement';
import { supabase } from '@/integrations/supabase/client';
import { merchantTerms } from '@/lib/merchantTerms';
import { formatPickupWindow } from '@/lib/pickupWindows';

function pickupSort(a: RestaurantOrder, b: RestaurantOrder) {
  return new Date(a.pickup_time || a.created_at).getTime() - new Date(b.pickup_time || b.created_at).getTime();
}

function QueueRow({ order, actionLabel }: { order: RestaurantOrder; actionLabel: string }) {
  const items = order.order_items?.map(item => `${item.quantity}× ${item.menu_item?.name || 'Item'}`).join(', ') || 'Order details';
  return (
    <Link to={`/restaurant/orders/${order.id}`} className="flex items-center gap-3 border-t px-4 py-3 first:border-t-0 hover:bg-muted/50">
      <div className="w-20 shrink-0">
        <p className="text-xs font-bold text-foreground">
          {order.pickup_time ? format(new Date(order.pickup_time), 'h:mm a') : 'ASAP'}
        </p>
        <p className="text-[10px] text-muted-foreground">Pickup</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">#{order.id.slice(-6).toUpperCase()}</p>
        <p className="truncate text-xs text-muted-foreground">{items}</p>
      </div>
      <Badge variant="secondary" className="shrink-0">{actionLabel}</Badge>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export default function RestaurantDashboard() {
  const queryClient = useQueryClient();
  const { data: restaurant, isLoading: loadingRestaurant } = useMyRestaurant();
  const { data: orders, isLoading: loadingOrders } = useRestaurantOrders();

  if (loadingRestaurant) {
    return <DashboardLayout><div className="mx-auto max-w-3xl space-y-4"><Skeleton className="h-28 w-full" /><Skeleton className="h-72 w-full" /></div></DashboardLayout>;
  }

  if (!restaurant) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <Store className="mb-4 h-14 w-14 text-muted-foreground" />
          <h2 className="text-2xl font-bold">Set up your business</h2>
          <p className="mb-6 mt-2 max-w-md text-muted-foreground">Complete your business profile to start receiving pickup orders.</p>
          <Button asChild><Link to="/restaurant/settings">Create business profile</Link></Button>
        </div>
      </DashboardLayout>
    );
  }

  const updateRestaurant = async (patch: Record<string, unknown>) => {
    const { error } = await supabase.from('restaurants').update(patch as any).eq('id', restaurant.id);
    if (error) { toast.error('Could not update order status'); return; }
    queryClient.invalidateQueries({ queryKey: ['my-restaurant'] });
  };
  const terms = merchantTerms((restaurant as any).merchant_type);
  const now = Date.now();
  const startsNow = (order: RestaurantOrder) => !(order as any).prep_start_at || new Date((order as any).prep_start_at).getTime() <= now;
  const newOrders = (orders?.filter(order => order.status === 'placed') || []).sort(pickupSort);
  const preparing = (orders?.filter(order => order.status === 'preparing' || (order.status === 'accepted' && startsNow(order))) || []).sort(pickupSort);
  const upcoming = (orders?.filter(order => order.status === 'accepted' && !startsNow(order)) || []).sort(pickupSort);
  const ready = (orders?.filter(order => order.status === 'ready_for_pickup') || []).sort(pickupSort);
  const todayOrders = orders?.filter(order => new Date(order.created_at).toDateString() === new Date().toDateString()) || [];
  const todaySales = todayOrders.filter(order => order.status === 'completed').reduce((sum, order) => sum + Math.max(Number(order.total_amount) - 3, 0), 0);
  const queues = [
    { title: 'New Orders', orders: newOrders, label: 'Accept', urgent: true },
    { title: 'Upcoming Pickups', orders: upcoming, label: 'View' },
    { title: terms.preparing, orders: preparing, label: 'Next action' },
    { title: 'Ready', orders: ready, label: 'Verify OTP' },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6 pb-24 md:pb-8">
        <header className="space-y-2">
          <p className="text-sm font-semibold text-primary">Today’s workspace</p>
          <h1 className="text-2xl font-bold">{restaurant.name}</h1>
          <p className="text-sm text-muted-foreground">Stay on top of every pickup.</p>
        </header>

        <PauseOrdersControl restaurant={restaurant} update={updateRestaurant} />

        <div className="flex items-center divide-x rounded-lg border bg-card py-3">
          <div className="flex-1 px-4">
            <p className="text-xs text-muted-foreground">Orders today</p>
            <p className="text-lg font-bold">{todayOrders.length}</p>
          </div>
          <div className="flex-1 px-4">
            <p className="text-xs text-muted-foreground">Sales today</p>
            <p className="text-lg font-bold">₹{todaySales.toFixed(0)}</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="mx-2"><Link to="/restaurant/orders">All orders<ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>

        {loadingOrders ? <Skeleton className="h-72 w-full" /> : (
          <div className="space-y-5">
            {queues.map(queue => (
              <section key={queue.title}>
                <div className="mb-2 flex items-center justify-between px-1">
                  <h2 className="flex items-center gap-2 text-base font-bold">
                    {queue.urgent && queue.orders.length > 0 ? <AlertCircle className="h-4 w-4 text-primary" /> : queue.title === 'Ready' ? <PackageCheck className="h-4 w-4 text-primary" /> : queue.title === 'Upcoming Pickups' ? <Clock3 className="h-4 w-4 text-primary" /> : <ShoppingBag className="h-4 w-4 text-primary" />}
                    {queue.title}
                    <span className="text-sm text-muted-foreground">{queue.orders.length}</span>
                  </h2>
                  {queue.orders.length > 2 && <Link to="/restaurant/orders" className="text-xs font-semibold text-primary">View all</Link>}
                </div>
                <div className={`overflow-hidden rounded-lg border bg-card ${queue.urgent && queue.orders.length > 0 ? 'border-primary/40' : ''}`}>
                  {queue.orders.length > 0 ? queue.orders.slice(0, 2).map(order => <QueueRow key={order.id} order={order} actionLabel={queue.label} />) : (
                    <p className="px-4 py-5 text-sm text-muted-foreground">Nothing here right now.</p>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}