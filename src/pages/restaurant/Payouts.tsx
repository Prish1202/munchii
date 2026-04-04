import { useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useMyPayoutSummary, useMyPayouts } from '@/hooks/useMenuManagement';
import { Wallet, CalendarClock, IndianRupee, TrendingUp, CreditCard, Banknote, ArrowDownRight, ArrowUpRight, BarChart3 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const PAYOUT_STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'outline' },
  processing: { label: 'Processing', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
};

export default function RestaurantPayouts() {
  const { data: payoutSummary, isLoading: summaryLoading } = useMyPayoutSummary();
  const { data: payouts, isLoading: payoutsLoading } = useMyPayouts();

  // Separate online credits vs COD deductions
  const { onlinePayouts, codDeductions } = useMemo(() => {
    if (!payouts) return { onlinePayouts: [], codDeductions: [] };
    return {
      onlinePayouts: payouts.filter((p: any) => Number(p.restaurant_amount) >= 0),
      codDeductions: payouts.filter((p: any) => Number(p.restaurant_amount) < 0),
    };
  }, [payouts]);

  // Order details from summary
  const orderBreakdown = useMemo(() => {
    if (!payoutSummary?.completedOrders) return [];
    const platformFee = 4;
    return payoutSummary.completedOrders.map((order: any) => {
      const isCod = order.payment_method === 'cod';
      const itemTotal = Math.max(Number(order.total_amount) - platformFee, 0);
      const commission = Math.round(itemTotal * 0.10 * 100) / 100;
      const netEarning = itemTotal - commission;
      return {
        ...order,
        isCod,
        itemTotal,
        platformFee,
        commission,
        netEarning,
        deduction: isCod ? platformFee + commission : 0,
      };
    });
  }, [payoutSummary]);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto pb-24 md:pb-6 space-y-4">
        <div>
          <h1 className="text-xl font-display font-bold">Payouts & Earnings</h1>
          <p className="text-sm text-muted-foreground">Track your earnings, deductions and payment history</p>
        </div>

        {/* Summary Cards */}
        {summaryLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card className="rounded-2xl">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-[11px] text-muted-foreground">Total Earned</span>
                  </div>
                  <p className="text-lg font-bold">₹{(payoutSummary?.totalEarned || 0).toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">{(payoutSummary?.onlineOrders || 0) + (payoutSummary?.codOrders || 0)} orders</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <IndianRupee className="w-4 h-4 text-primary" />
                    <span className="text-[11px] text-muted-foreground">Net Payable</span>
                  </div>
                  <p className={`text-lg font-bold ${(payoutSummary?.pendingAmount || 0) < 0 ? 'text-destructive' : 'text-primary'}`}>
                    ₹{(payoutSummary?.pendingAmount || 0).toFixed(0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">After deductions</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span className="text-[11px] text-muted-foreground">Online Orders</span>
                  </div>
                  <p className="text-lg font-bold text-primary">₹{(payoutSummary?.onlineCredits || 0).toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">{payoutSummary?.onlineOrders || 0} orders</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Banknote className="w-4 h-4 text-destructive" />
                    <span className="text-[11px] text-muted-foreground">COD Deductions</span>
                  </div>
                  <p className="text-lg font-bold text-destructive">-₹{(payoutSummary?.codDeductions || 0).toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">{payoutSummary?.codOrders || 0} cash orders</p>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Growth */}
            {payoutSummary?.weeklyGrowth && payoutSummary.weeklyGrowth.length > 1 && (
              <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Weekly Growth
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="flex items-end gap-1 h-20">
                    {payoutSummary.weeklyGrowth.map((week: any, i: number) => {
                      const maxEarned = Math.max(...payoutSummary.weeklyGrowth.map((w: any) => w.earned));
                      const height = maxEarned > 0 ? (week.earned / maxEarned) * 100 : 0;
                      return (
                        <div key={week.week} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full rounded-t-md bg-primary/80 transition-all min-h-[4px]"
                            style={{ height: `${Math.max(height, 5)}%` }}
                            title={`₹${week.earned.toFixed(0)} (${week.orders} orders)`}
                          />
                          <span className="text-[9px] text-muted-foreground">{format(parseISO(week.week), 'dd/MM')}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Info */}
        <div className="p-3 rounded-xl bg-muted/50 border border-border">
          <div className="flex items-start gap-2">
            <CalendarClock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">How Payouts Work</p>
              <p className="text-xs text-muted-foreground">
                <strong>Online orders:</strong> 90% of item price (after ₹4 platform fee) is credited to your payout.
                <br />
                <strong>Cash orders (COD):</strong> You collect the full amount from the customer. The ₹4 platform fee + 10% commission is deducted from your next payout settlement.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="all-orders" className="w-full">
          <TabsList className="w-full grid grid-cols-3 rounded-xl">
            <TabsTrigger value="all-orders" className="rounded-lg text-xs">All Orders</TabsTrigger>
            <TabsTrigger value="payouts" className="rounded-lg text-xs">Payouts</TabsTrigger>
            <TabsTrigger value="deductions" className="rounded-lg text-xs">COD Deductions</TabsTrigger>
          </TabsList>

          {/* All Orders Breakdown */}
          <TabsContent value="all-orders">
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> Order-wise Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {summaryLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : orderBreakdown.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No completed orders yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Order ₹</TableHead>
                          <TableHead className="text-right">Fee</TableHead>
                          <TableHead className="text-right">Comm.</TableHead>
                          <TableHead className="text-right">Net</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderBreakdown.map((order: any) => (
                          <TableRow key={order.id}>
                            <TableCell className="whitespace-nowrap text-xs">{format(parseISO(order.created_at), 'MMM d')}</TableCell>
                            <TableCell>
                              {order.isCod ? (
                                <Badge variant="outline" className="text-[10px] gap-1">
                                  <Banknote className="w-3 h-3" /> COD
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] gap-1">
                                  <CreditCard className="w-3 h-3" /> Online
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-xs">₹{Number(order.total_amount).toFixed(0)}</TableCell>
                            <TableCell className="text-right text-xs text-destructive">-₹{order.platformFee}</TableCell>
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payout History */}
          <TabsContent value="payouts">
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-primary" /> Payout Credits
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {payoutsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : onlinePayouts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No payout records yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {onlinePayouts.map((p: any) => {
                          const sc = PAYOUT_STATUS_CONFIG[p.payout_status] || PAYOUT_STATUS_CONFIG.pending;
                          return (
                            <TableRow key={p.id}>
                              <TableCell className="whitespace-nowrap text-sm">{format(parseISO(p.created_at), 'MMM d, yyyy')}</TableCell>
                              <TableCell className="text-right font-semibold text-primary">+₹{Number(p.restaurant_amount).toFixed(0)}</TableCell>
                              <TableCell><Badge variant={sc.variant}>{sc.label}</Badge></TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{p.payout_notes || '—'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* COD Deductions */}
          <TabsContent value="deductions">
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-destructive" /> COD Deductions
                </CardTitle>
                <p className="text-xs text-muted-foreground">These amounts will be deducted from your next online payout settlement</p>
              </CardHeader>
              <CardContent className="p-0">
                {payoutsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : codDeductions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No COD deductions. Cash orders will show here.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Deduction</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {codDeductions.map((p: any) => {
                          const sc = PAYOUT_STATUS_CONFIG[p.payout_status] || PAYOUT_STATUS_CONFIG.pending;
                          return (
                            <TableRow key={p.id}>
                              <TableCell className="whitespace-nowrap text-sm">{format(parseISO(p.created_at), 'MMM d, yyyy')}</TableCell>
                              <TableCell className="text-right font-semibold text-destructive">-₹{Math.abs(Number(p.restaurant_amount)).toFixed(0)}</TableCell>
                              <TableCell><Badge variant={sc.variant}>{sc.label}</Badge></TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[200px]">{p.payout_notes || '—'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
