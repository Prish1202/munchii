import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerOrders, OrderStatus, useOrderItems } from '@/hooks/useOrders';
import { useCart } from '@/contexts/CartContext';
import { EmptyState } from '@/components/customer/EmptyState';
import { Package, Clock, Store, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  pending_payment: { label: 'Awaiting Payment', className: 'bg-secondary text-secondary-foreground' },
  placed: { label: 'Placed', className: 'bg-secondary text-secondary-foreground' },
  accepted: { label: 'Accepted', className: 'bg-accent text-accent-foreground' },
  preparing: { label: 'Preparing', className: 'bg-primary text-primary-foreground' },
  ready_for_pickup: { label: 'Ready for Pickup', className: 'bg-primary text-primary-foreground' },
  picked_up: { label: 'Picked Up', className: 'bg-secondary text-secondary-foreground' },
  completed: { label: 'Completed', className: 'bg-secondary text-secondary-foreground' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive text-destructive-foreground' },
};

export default function Orders() {
  const { data: orders, isLoading } = useCustomerOrders();

  const activeOrders = orders?.filter(o => !['completed', 'cancelled'].includes(o.status)) || [];
  const pastOrders = orders?.filter(o => ['completed', 'cancelled'].includes(o.status)) || [];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto pb-20 md:pb-0 space-y-6">
        <div>
          <h1 className="font-display font-bold text-2xl">Your Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track and view your order history</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : orders?.length === 0 ? (
          <EmptyState
            icon={<Package className="w-7 h-7 text-muted-foreground" />}
            title="No orders yet"
            description="Start ordering from your favorite restaurants"
            action={<Link to="/customer/browse"><Button>Browse Restaurants</Button></Link>}
          />
        ) : (
          <>
            {activeOrders.length > 0 && (
              <section>
                <h2 className="font-display font-semibold text-base mb-3 flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                  </span>
                  Active Orders
                </h2>
                <div className="space-y-3">
                  {activeOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </section>
            )}

            {pastOrders.length > 0 && (
              <section>
                <h2 className="font-display font-semibold text-base mb-3">Past Orders</h2>
                <div className="space-y-3">
                  {pastOrders.map((order) => (
                    <OrderCard key={order.id} order={order} showReorder />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function OrderCard({ order, showReorder }: { order: any; showReorder?: boolean }) {
  const navigate = useNavigate();
  const { addItem, clearCart } = useCart();
  const statusConfig = STATUS_CONFIG[order.status as OrderStatus];
  const { data: orderItems } = useOrderItems(order.id);

  const handleReorder = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!orderItems || orderItems.length === 0) {
      toast.error('Could not load items for reorder');
      return;
    }
    clearCart();
    orderItems.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        addItem({
          menuItemId: item.menu_item_id,
          name: item.menu_item?.name || 'Item',
          price: Number(item.price_at_time),
          restaurantId: order.restaurant_id,
          restaurantName: order.restaurant?.name || 'Restaurant',
        });
      }
    });
    toast.success('Items added to cart!');
    navigate('/customer/cart');
  };

  return (
    <Link to={`/customer/orders/${order.id}`}>
      <div className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-sm truncate">
                {order.restaurant?.name || 'Restaurant'}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
              </p>
              <p className="text-sm font-semibold text-primary mt-1">₹{Number(order.total_amount).toFixed(0)}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
            {showReorder && order.status === 'completed' && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleReorder}>
                <RotateCcw className="w-3 h-3" /> Reorder
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
