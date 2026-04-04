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
import { Wallet, Store, TrendingUp, AlertCircle, ChevronLeft, CalendarDays, IndianRupee, CreditCard, Banknote, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
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
  const platformFee = 4;

  // Fetch completed orders with order_items for detailed breakdown
  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['admin', 'restaurant-orders-detail', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, status, payment_method, created_at, order_items(quantity, price_at_time, menu_item:menu_items(name))')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch payouts
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

  const paidOrderIds = new Set(payouts?.map(p => p.order_id) || []);

  // Detailed per-order breakdown
  const orderBreakdown = useMemo(() => {
    if (!orders) return [];
    return orders.map(order => {
      const isCod = order.payment_method === 'cod';
      const itemTotal = Math.max(Number(order.total_amount) - platformFee, 0);
      const commission = Math.round(itemTotal * 0.10 * 100) / 100;
      const netEarning = itemTotal - commission;
      const deduction = isCod ? platformFee + commission : 0;
      const isPaid = paidOrderIds.has(order.id);
      const items = (order as any).order_items || [];
      return { ...order, isCod, itemTotal, commission, netEarning, deduction, isPaid, items };
    });
  }, [orders, paidOrderIds]);

  // Summary
  const summary = useMemo(() => {
    let totalNet = 0, totalCommission = 0, totalOnline = 0, totalCod = 0, pending = 0, paid = 0, codDeductions = 0;
    orderBreakdown.forEach(order => {
      totalNet += order.netEarning;
      totalCommission += order.commission;
      if (order.isCod) {
        totalCod += Number(order.total_amount);
        codDeductions += order.deduction;
      } else {
        totalOnline += Number(order.total_amount);
      }
      if (order.isPaid) {
        const payout = payouts?.find(p => p.order_id === order.id);
        paid += Number(payout?.restaurant_amount || 0);
      } else {
        pending += order.isCod ? -order.deduction : order.netEarning;
      }
    });
    return { totalNet, totalCommission, totalOnline, totalCod, pending, paid, codDeductions };
  }, [orderBreakdown, payouts]);

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

  const handleCreatePayoutsForUnpaid = async () => {
    if (!orders) return;
    const unpaidOrders = orders.filter(o => !paidOrderIds.has(o.id));
    if (unpaidOrders.length === 0) {
      toast.info('No unpaid orders to process');
      return;
    }
    try {
      const payoutRows = unpaidOrders.map(order => {
        const isCod = order.payment_method === 'cod';
        const itemTotal = Math.max(Number(order.total_amount) - platformFee, 0);
        const comm = Math.round(itemTotal * 0.10 * 100) / 100;
        const net = itemTotal - comm;
        if (isCod) {
          const deduction = platformFee + comm;
          return {
            order_id: order.id,
            restaurant_amount: -deduction,
            platform_fee: deduction,
            payout_status: 'pending',
            payout_notes: `COD — Collected ₹${Number(order.total_amount).toFixed(0)}. Deduct ₹${platformFee} fee + ₹${comm.toFixed(0)} commission = ₹${deduction.toFixed(0)}.`,
          };
        }
        return {
          order_id: order.id,
          restaurant_amount: net,
          platform_fee: comm + platformFee,
          payout_status: 'pending',
          payout_notes: `Online — Credit ₹${net.toFixed(0)} (₹${platformFee} fee + ₹${comm.toFixed(0)} comm deducted).`,
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
            <p className="text-sm text-muted-foreground">Per-order breakdown with fees & commissions</p>
          </div>
        </div>
        {summary.pending !== 0 && (
          <Button onClick={handleCreatePayoutsForUnpaid} size="sm" className="rounded-xl">
            Create Payouts for Unpaid
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
            <p className="text-lg font-bold">₹{summary.totalNet.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Online Rev.</span>
            </div>
            <p className="text-lg font-bold">₹{summary.totalOnline.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">COD Rev.</span>
            </div>
            <p className="text-lg font-bold">₹{summary.totalCod.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground">COD Deductions</span>
            </div>
            <p className="text-lg font-bold text-destructive">-₹{summary.codDeductions.toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-Order Breakdown */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Per-Order Breakdown
          </CardTitle>
          <p className="text-xs text-muted-foreground">Item price, ₹4 platform fee, 10% commission for each order</p>
        </CardHeader>
        <CardContent className="p-0">
          {loadingOrders ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : orderBreakdown.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No completed orders</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Order ₹</TableHead>
                    <TableHead className="text-right">Item Total</TableHead>
                    <TableHead className="text-right">₹4 Fee</TableHead>
                    <TableHead className="text-right">10% Comm.</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead>Paid?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderBreakdown.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="whitespace-nowrap text-xs">{format(parseISO(order.created_at), 'MMM d')}</TableCell>
                      <TableCell>
                        {order.isCod ? (
                          <Badge variant="outline" className="text-[10px] gap-1"><Banknote className="w-3 h-3" />COD</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] gap-1"><CreditCard className="w-3 h-3" />Online</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs max-w-[120px]">
                        {order.items.length > 0 ? order.items.map((item: any, i: number) => (
                          <span key={i} className="block truncate text-muted-foreground">
                            {item.quantity}x {item.menu_item?.name || 'Item'}
                          </span>
                        )) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">₹{Number(order.total_amount).toFixed(0)}</TableCell>
                      <TableCell className="text-right text-xs">₹{order.itemTotal.toFixed(0)}</TableCell>
                      <TableCell className="text-right text-xs text-destructive">-₹{platformFee}</TableCell>
                      <TableCell className="text-right text-xs text-destructive">-₹{order.commission.toFixed(0)}</TableCell>
                      <TableCell className="text-right text-xs font-semibold">
                        {order.isCod ? (
                          <span className="text-destructive flex items-center justify-end gap-0.5">
                            <ArrowDownRight className="w-3 h-3" />-₹{order.deduction.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-primary flex items-center justify-end gap-0.5">
                            <ArrowUpRight className="w-3 h-3" />+₹{order.netEarning.toFixed(0)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.isPaid ? (
                          <Badge variant="default" className="text-[10px]">Yes</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">No</Badge>
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
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Platform</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map(p => {
                    const sc = PAYOUT_STATUS_CONFIG[p.payout_status] || PAYOUT_STATUS_CONFIG.pending;
                    const isDeduction = Number(p.restaurant_amount) < 0;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="whitespace-nowrap text-xs">{format(parseISO(p.created_at), 'MMM d')}</TableCell>
                        <TableCell className={`text-right font-medium ${isDeduction ? 'text-destructive' : 'text-primary'}`}>
                          {isDeduction ? '-' : '+'}₹{Math.abs(Number(p.restaurant_amount)).toFixed(0)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">₹{Number(p.platform_fee).toFixed(0)}</TableCell>
                        <TableCell><Badge variant={sc.variant}>{sc.label}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{p.payout_notes || '—'}</TableCell>
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
              {Number(editingPayout?.restaurant_amount || 0) < 0
                ? `COD Deduction: -₹${Math.abs(Number(editingPayout?.restaurant_amount || 0)).toFixed(0)}`
                : `Credit: ₹${Number(editingPayout?.restaurant_amount || 0).toFixed(0)} to restaurant`}
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

  const totals = useMemo(() => {
    if (!payouts) return { restaurant: 0, platform: 0, codDeductions: 0 };
    let restaurant = 0, platform = 0, codDeductions = 0;
    payouts.forEach((p: any) => {
      const amt = Number(p.restaurant_amount);
      if (amt < 0) {
        codDeductions += Math.abs(amt);
      } else {
        restaurant += amt;
      }
      platform += Number(p.platform_fee);
    });
    return { restaurant, platform, codDeductions };
  }, [payouts]);

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
          <p className="text-sm text-muted-foreground">Track platform earnings, COD deductions & partner payouts</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="rounded-2xl">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Platform Revenue</span>
              </div>
              <p className="text-lg font-bold">₹{totals.platform.toFixed(0)}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Store className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Paid to Restros</span>
              </div>
              <p className="text-lg font-bold">₹{totals.restaurant.toFixed(0)}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Banknote className="w-4 h-4 text-destructive" />
                <span className="text-xs text-muted-foreground">COD Deductions</span>
              </div>
              <p className="text-lg font-bold text-destructive">₹{totals.codDeductions.toFixed(0)}</p>
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
            <p className="text-xs text-muted-foreground">Tap a restaurant to see per-order breakdown with item price, ₹4 fee, 10% commission</p>
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
                          ) : r.pendingAmount < 0 ? (
                            <Badge variant="outline" className="text-destructive">-₹{Math.abs(r.pendingAmount).toFixed(0)}</Badge>
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
