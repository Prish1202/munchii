import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerOrders, OrderStatus } from '@/hooks/useOrders';
import { Package, ChevronRight, Clock, Store } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  placed: { label: 'Placed', color: 'bg-blue-500' },
  accepted: { label: 'Accepted', color: 'bg-indigo-500' },
  preparing: { label: 'Preparing', color: 'bg-yellow-500' },
  ready: { label: 'Ready', color: 'bg-orange-500' },
  picked_up: { label: 'On the way', color: 'bg-purple-500' },
  delivered: { label: 'Delivered', color: 'bg-green-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500' },
};

export default function Orders() {
  const { data: orders, isLoading } = useCustomerOrders();

  const activeOrders = orders?.filter(o => 
    !['delivered', 'cancelled'].includes(o.status)
  ) || [];
  
  const pastOrders = orders?.filter(o => 
    ['delivered', 'cancelled'].includes(o.status)
  ) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 md:pb-0">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Your Orders</h1>
          <p className="text-muted-foreground">Track and view your order history</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : orders?.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No orders yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start ordering from your favorite restaurants
              </p>
              <Link to="/customer/browse" className="text-primary hover:underline">
                Browse Restaurants
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                  Active Orders
                </h2>
                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </section>
            )}

            {/* Past Orders */}
            {pastOrders.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4">Past Orders</h2>
                <div className="space-y-4">
                  {pastOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
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

function OrderCard({ order }: { order: any }) {
  const statusConfig = STATUS_CONFIG[order.status as OrderStatus];

  return (
    <Link to={`/customer/orders/${order.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Store className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold truncate">
                  {order.restaurant?.name || 'Restaurant'}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                </p>
                <p className="text-primary font-medium mt-1">
                  ₹{Number(order.total_amount).toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={`${statusConfig.color} text-white`}>
                {statusConfig.label}
              </Badge>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
