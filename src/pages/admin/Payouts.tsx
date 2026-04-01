import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAdminPayouts, useAdminRestaurantPayoutSummary } from '@/hooks/useAdminData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Wallet, Store, TrendingUp, AlertCircle, ChevronLeft, CalendarDays, IndianRupee, CreditCard, Banknote } from 'lucide-react';
import { format, startOfWeek, endOfWeek, parseISO, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';

const PAYOUT_STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'outline' },
  processing: { label: 'Processing', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
};

function RestaurantPayoutDetail({ restaurantId, restaurantName, onBack }: { restaurantId: string; restaurantName: string; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [editingPayout, setEditingPayout] = useState<any>(null);
  const [newPayoutStatus, setNewPayoutStatus] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');

  // Fetch completed orders for this restaurant with date + payment method
  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['admin', 'restaurant-orders-detail', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, status, payment_method, created_at')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch payouts for this restaurant's orders
  const { data: payouts, isLoading: loadingPayouts } = useQuery({
    queryKey: ['admin', 'restaurant-payouts-detail', restaurantId],
    queryFn: async () => {
      const { data: orderIds } = await supabase
        .from('orders')
        .select('id')
        .eq('restaurant_id', restaurantId);

      if (!orderIds?.length) return [];

      const ids = orderIds.map(o => o.id);
      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .in('order_id', ids)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const platformFee = 4;
  const paidOrderIds = new Set(payouts?.map(p => p.order_id) || []);

  // Group orders by date
  const dailyBreakdown = useMemo(() => {
    if (!orders) return [];
    const byDate: Record<string, { date: string; orders: typeof orders; onlineTotal: number; codTotal: number; netEarnings: number; commission: number }> = {};
    
    orders.forEach(order => {
      const dateKey = format(parseISO(order.created_at), 'yyyy-MM-dd');
      if (!byDate[dateKey]) {
        byDate[dateKey] = { date: dateKey, orders: [], onlineTotal: 0, codTotal: 0, netEarnings: 0, commission: 0 };
      }
      const day = byDate[dateKey];
      day.orders.push(order);
      const itemTotal = Math.max(Number(order.total_amount) - platformFee, 0);
      const comm = Math.round(itemTotal * 0.10 * 100) / 100;
      const net = itemTotal - comm;
      day.netEarnings += net;
      day.commission += comm;
      if (order.payment_method === 'cod') {
        day.codTotal += Number(order.total_amount);
      } else {
        day.onlineTotal += Number(order.total_amount);
      }
    });

    return Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));
  }, [orders]);

  // Weekly summary
  const weeklySummary = useMemo(() => {
    if (!orders) return { totalNet: 0, totalCommission: 0, totalOnline: 0, totalCod: 0, pending: 0, paid: 0 };
    let totalNet = 0, totalCommission = 0, totalOnline = 0, totalCod = 0, pending = 0, paid = 0;
    orders.forEach(order => {
      const itemTotal = Math.max(Number(order.total_amount) - platformFee, 0);
      const comm = Math.round(itemTotal * 0.10 * 100) / 100;
      const net = itemTotal - comm;
      totalNet += net;
      totalCommission += comm;
      if (order.payment_method === 'cod') totalCod += Number(order.total_amount);
      else totalOnline += Number(order.total_amount);
      if (paidOrderIds.has(order.id)) paid += net;
      else pending += net;
    });
    return { totalNet, totalCommission, totalOnline, totalCod, pending, paid };
  }, [orders, paidOrderIds]);

  const handleUpdatePayoutStatus = async () => {
    if (!editingPayout || !newPayoutStatus) return;
    try {
      const updates: any = { payout_status: newPayoutStatus };
      if (payoutNotes) updates.payout_notes = payoutNotes;
      if (newPayoutStatus === 'completed') updates.processed_at = new Date().toISOString();
      const { error } = await supabase.from('payouts').update(updates).eq('id', editingPayout.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Payout status updated');
      setEditingPayout(null);
      setPayoutNotes('');
      setNewPayoutStatus('');
    } catch {
      toast.error('Failed to update payout status');
    }
  };

  // Create payouts for all unpaid completed orders
  const handleCreatePayoutsForUnpaid = async () => {
    if (!orders) return;
    const unpaidOrders = orders.filter(o => !paidOrderIds.has(o.id));
    if (unpaidOrders.length === 0) {
      toast.info('No unpaid orders to process');
      return;
    }
    try {
      const payoutRows = unpaidOrders.map(order => {
        const itemTotal = Math.max(Number(order.total_amount) - platformFee, 0);
        const comm = Math.round(itemTotal * 0.10 * 100) / 100;
        const net = itemTotal - comm;
        return {
          order_id: order.id,
          restaurant_amount: net,
          platform_fee: comm,
          payout_status: 'pending',
        };
      });
      const { error } = await supabase.from('payouts').insert(payoutRows);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success(`Created ${payoutRows.length} payout records`);
    } catch {
      toast.error('Failed to create payout records');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold">{restaurantName}</h2>
            <p className="text-sm text-muted-foreground">Detailed earnings & payout management</p>
          </div>
        </div>
        {weeklySummary.pending > 0 && (
          <Button onClick={handleCreatePayoutsForUnpaid} size="sm" className="rounded-xl">
            Create Payouts for Unpaid (₹{weeklySummary.pending.toFixed(0)})
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="rounded-2xl">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Net Earnings</span>
            </div>
            <p className="text-lg font-bold">₹{weeklySummary.totalNet.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
            <p className="text-lg font-bold">₹{weeklySummary.totalOnline.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">COD</span>
            </div>
            <p className="text-lg font-bold">₹{weeklySummary.totalCod.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
            <p className="text-lg font-bold text-destructive">₹{weeklySummary.pending.toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Daily Earnings Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingOrders ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : dailyBreakdown.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No completed orders</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Orders</TableHead>
                    <TableHead className="text-right">Online</TableHead>
                    <TableHead className="text-right">COD</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Net Earning</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyBreakdown.map(day => (
                    <TableRow key={day.date}>
                      <TableCell className="font-medium whitespace-nowrap">{format(parseISO(day.date), 'MMM d, EEE')}</TableCell>
                      <TableCell className="text-center">{day.orders.length}</TableCell>
                      <TableCell className="text-right text-primary">₹{day.onlineTotal.toFixed(0)}</TableCell>
                      <TableCell className="text-right">₹{day.codTotal.toFixed(0)}</TableCell>
                      <TableCell className="text-right text-destructive">-₹{day.commission.toFixed(0)}</TableCell>
                      <TableCell className="text-right font-semibold">₹{day.netEarnings.toFixed(0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Records */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Payout Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingPayouts ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : !payouts?.length ? (
            <div className="text-center py-8 text-muted-foreground">No payouts recorded yet</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Restaurant</TableHead>
                    <TableHead className="text-right">Platform Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map(p => {
                    const sc = PAYOUT_STATUS_CONFIG[p.payout_status] || PAYOUT_STATUS_CONFIG.pending;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="whitespace-nowrap">{format(parseISO(p.created_at), 'MMM d')}</TableCell>
                        <TableCell className="text-right font-medium">₹{Number(p.restaurant_amount).toFixed(0)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">₹{Number(p.platform_fee).toFixed(0)}</TableCell>
                        <TableCell><Badge variant={sc.variant}>{sc.label}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                            setEditingPayout(p);
                            setNewPayoutStatus(p.payout_status || 'pending');
                            setPayoutNotes(p.payout_notes || '');
                          }}>
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editingPayout} onOpenChange={() => setEditingPayout(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Payout</DialogTitle>
            <DialogDescription>
              ₹{Number(editingPayout?.restaurant_amount || 0).toFixed(0)} to restaurant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={newPayoutStatus} onValueChange={setNewPayoutStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea value={payoutNotes} onChange={e => setPayoutNotes(e.target.value)} placeholder="Transaction ID, remarks..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPayout(null)}>Cancel</Button>
            <Button onClick={handleUpdatePayoutStatus}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminPayouts() {
  const { data: payouts, isLoading } = useAdminPayouts();
  const { data: restaurantSummary, isLoading: summaryLoading } = useAdminRestaurantPayoutSummary();
  const [selectedRestaurant, setSelectedRestaurant] = useState<{ id: string; name: string } | null>(null);

  const totals = payouts?.reduce((acc, p) => ({
    restaurant: acc.restaurant + Number(p.restaurant_amount),
    platform: acc.platform + Number(p.platform_fee),
  }), { restaurant: 0, platform: 0 }) || { restaurant: 0, platform: 0 };

  const totalPending = restaurantSummary?.reduce((s, r) => s + r.pendingAmount, 0) || 0;

  if (selectedRestaurant) {
    return (
      <DashboardLayout>
        <RestaurantPayoutDetail
          restaurantId={selectedRestaurant.id}
          restaurantName={selectedRestaurant.name}
          onBack={() => setSelectedRestaurant(null)}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold">Payouts Overview</h1>
          <p className="text-sm text-muted-foreground">Track platform earnings and partner payouts</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="rounded-2xl">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Volume</span>
              </div>
              <p className="text-lg font-bold">₹{(totals.restaurant + totals.platform).toFixed(0)}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Store className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Paid Out</span>
              </div>
              <p className="text-lg font-bold">₹{totals.restaurant.toFixed(0)}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Platform</span>
              </div>
              <p className="text-lg font-bold">₹{totals.platform.toFixed(0)}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              <p className="text-lg font-bold text-destructive">₹{totalPending.toFixed(0)}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Store className="w-4 h-4" /> Restaurants</CardTitle>
            <p className="text-xs text-muted-foreground">Tap a restaurant to see daily earnings & manage payouts</p>
          </CardHeader>
          <CardContent className="p-0">
            {summaryLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : !restaurantSummary?.length ? (
              <div className="text-center py-8 text-muted-foreground">No completed orders yet</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Restaurant</TableHead>
                      <TableHead className="text-center">Orders</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {restaurantSummary.map(r => (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedRestaurant({ id: r.id, name: r.name })}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{r.name}</p>
                            <p className="text-xs text-muted-foreground">{r.city}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{r.completedOrders}</TableCell>
                        <TableCell className="text-right">₹{r.totalRevenue.toFixed(0)}</TableCell>
                        <TableCell className="text-right text-primary font-medium">₹{r.totalPaid.toFixed(0)}</TableCell>
                        <TableCell className="text-right">
                          {r.pendingAmount > 0 ? (
                            <Badge variant="destructive">₹{r.pendingAmount.toFixed(0)}</Badge>
                          ) : (
                            <Badge variant="secondary">Settled</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
