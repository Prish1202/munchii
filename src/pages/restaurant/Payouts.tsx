import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useMyPayoutSummary, useMyPayouts } from '@/hooks/useMenuManagement';
import { Wallet, CalendarClock, IndianRupee, TrendingUp } from 'lucide-react';
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

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto pb-24 md:pb-6 space-y-4">
        <div>
          <h1 className="text-xl font-display font-bold">Payouts</h1>
          <p className="text-sm text-muted-foreground">Track your earnings and payment history</p>
        </div>

        {/* Summary Cards */}
        {summaryLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <Card className="rounded-2xl">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-[11px] text-muted-foreground">Total Earned</span>
                </div>
                <p className="text-lg font-bold">₹{(payoutSummary?.totalEarned || 0).toFixed(0)}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <IndianRupee className="w-4 h-4 text-primary" />
                  <span className="text-[11px] text-muted-foreground">Paid Out</span>
                </div>
                <p className="text-lg font-bold text-primary">₹{(payoutSummary?.totalPaid || 0).toFixed(0)}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarClock className="w-4 h-4 text-accent" />
                  <span className="text-[11px] text-muted-foreground">Pending</span>
                </div>
                <p className="text-lg font-bold text-accent">₹{(payoutSummary?.pendingAmount || 0).toFixed(0)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Info */}
        <div className="p-3 rounded-xl bg-muted/50 border border-border">
          <div className="flex items-start gap-2">
            <CalendarClock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Weekly Payouts</p>
              <p className="text-xs text-muted-foreground">All earnings are processed and transferred to your bank account every week. Ensure your bank details are up-to-date in Settings.</p>
            </div>
          </div>
        </div>

        {/* Payout Records */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Payout History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {payoutsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : !payouts?.length ? (
              <div className="text-center py-8 text-muted-foreground">No payouts recorded yet. Your first payout will appear here once processed.</div>
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
                    {payouts.map((p: any) => {
                      const sc = PAYOUT_STATUS_CONFIG[p.payout_status] || PAYOUT_STATUS_CONFIG.pending;
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="whitespace-nowrap text-sm">{format(parseISO(p.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="text-right font-semibold">₹{Number(p.restaurant_amount).toFixed(0)}</TableCell>
                          <TableCell><Badge variant={sc.variant}>{sc.label}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{p.payout_notes || '—'}</TableCell>
                        </TableRow>
                      );
                    })}
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
