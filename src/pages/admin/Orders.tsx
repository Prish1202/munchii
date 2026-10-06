import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useAdminOrders, useUpdateOrderStatus } from '@/hooks/useAdminData';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, ClipboardList, Edit, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type OrderStatus = 'pending_payment' | 'placed' | 'accepted' | 'preparing' | 'ready_for_pickup' | 'picked_up' | 'completed' | 'cancelled';

const ORDER_STATUSES: OrderStatus[] = [
  'placed', 'accepted', 'preparing', 'ready_for_pickup', 'picked_up', 'completed', 'cancelled'
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending_payment: 'bg-gray-400',
  placed: 'bg-yellow-500',
  accepted: 'bg-blue-500',
  preparing: 'bg-orange-500',
  ready_for_pickup: 'bg-purple-500',
  picked_up: 'bg-indigo-500',
  completed: 'bg-green-500',
  cancelled: 'bg-destructive',
};

export default function AdminOrders() {
  const { data: orders, isLoading } = useAdminOrders();
  const updateStatus = useUpdateOrderStatus();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingOrder, setEditingOrder] = useState<{ id: string; status: OrderStatus } | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewingOrder = orders?.find(o => o.id === viewingId);

  const { data: viewingCustomer } = useQuery({
    queryKey: ['admin', 'order-customer', viewingOrder?.customer_id],
    enabled: !!viewingOrder?.customer_id,
    queryFn: async () => {
      const { data } = await (supabase.rpc as any)('get_public_profile', { _id: viewingOrder!.customer_id });
      return (Array.isArray(data) ? data[0] : data) as { name: string; username: string | null } | null;
    },
  });

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.restaurant?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async () => {
    if (!editingOrder) return;
    try {
      await updateStatus.mutateAsync({ orderId: editingOrder.id, status: editingOrder.status });
      toast({ title: 'Status updated', description: `Order status changed to ${editingOrder.status.replace('_', ' ')}` });
      setEditingOrder(null);
    } catch {
      toast({ title: 'Error', description: 'Failed to update order status', variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">View and manage all platform orders</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2"><ClipboardList className="w-5 h-5" />All Orders</CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {ORDER_STATUSES.map(status => (
                      <SelectItem key={status} value={status}>{status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                      <TableCell>{order.restaurant?.name || '-'}</TableCell>
                      <TableCell>{order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0} items</TableCell>
                      <TableCell className="font-medium">₹{Number(order.total_amount).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={`${STATUS_COLORS[order.status as OrderStatus] || 'bg-muted'} text-white`}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(order.created_at), 'MMM d, HH:mm')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setViewingId(order.id)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingOrder({ id: order.id, status: order.status as OrderStatus })}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredOrders?.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No orders found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Order detail dialog with amount breakdown */}
        <Dialog open={!!viewingId} onOpenChange={open => !open && setViewingId(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order {viewingOrder?.id.slice(0, 8)}…</DialogTitle>
              <DialogDescription>
                {viewingOrder?.restaurant?.name || '-'} · {viewingOrder ? format(new Date(viewingOrder.created_at), 'dd MMM yyyy, HH:mm') : ''}
              </DialogDescription>
            </DialogHeader>
            {viewingOrder && (() => {
              const total = Number(viewingOrder.total_amount);
              const platformFee = 3;
              const itemTotal = Math.max(total - platformFee, 0);
              const commission = Math.round(itemTotal * 0.05 * 100) / 100;
              const restaurantShare = itemTotal - commission;
              return (
                <div className="space-y-5 pt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${STATUS_COLORS[viewingOrder.status as OrderStatus] || 'bg-muted'} text-white`}>
                      {viewingOrder.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">{viewingOrder.payment_method === 'coins' ? 'Coins' : 'Razorpay'}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Customer:</span> <span className="font-medium">{viewingCustomer?.name || viewingOrder.customer_id?.slice(0, 8) || '-'}</span></div>
                    <div><span className="text-muted-foreground">Pickup:</span> <span className="font-medium">{viewingOrder.pickup_time ? format(new Date(viewingOrder.pickup_time), 'dd MMM, HH:mm') : '-'}</span></div>
                    <div><span className="text-muted-foreground">Prep time:</span> <span className="font-medium">{viewingOrder.prep_minutes} min</span></div>
                    <div><span className="text-muted-foreground">Pickup OTP:</span> <span className="font-mono font-medium">{viewingOrder.pickup_otp || '-'}</span></div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Items</h3>
                    <div className="rounded-lg border divide-y">
                      {viewingOrder.order_items?.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                          <div>
                            <span className="font-medium">{item.menu_item?.name || 'Item'}</span>
                            {item.option_label && <span className="text-muted-foreground"> · {item.option_label}</span>}
                            <span className="text-muted-foreground"> × {item.quantity}</span>
                          </div>
                          <span className="font-medium">₹{(Number(item.price_at_time) * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Amount breakdown</h3>
                    <div className="rounded-lg border p-3 space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Item total</span><span>₹{itemTotal.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Platform fee</span><span>₹{platformFee.toFixed(2)}</span></div>
                      <div className="flex justify-between font-semibold border-t pt-1.5"><span>Customer paid</span><span>₹{total.toFixed(2)}</span></div>
                      <div className="flex justify-between text-muted-foreground border-t pt-1.5"><span>Commission (5%)</span><span>-₹{commission.toFixed(2)}</span></div>
                      <div className="flex justify-between font-semibold text-green-600"><span>Restaurant payout</span><span>₹{restaurantShare.toFixed(2)}</span></div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingOrder} onOpenChange={() => setEditingOrder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Order Status</DialogTitle>
              <DialogDescription>Change the status for order {editingOrder?.id.slice(0, 8)}...</DialogDescription>
            </DialogHeader>
            <Select value={editingOrder?.status} onValueChange={(value) => setEditingOrder(prev => prev ? { ...prev, status: value as OrderStatus } : null)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>{status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingOrder(null)}>Cancel</Button>
              <Button onClick={handleStatusUpdate} disabled={updateStatus.isPending} className="bg-admin hover:bg-admin/90">
                {updateStatus.isPending ? 'Updating...' : 'Update Status'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
