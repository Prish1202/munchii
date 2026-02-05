import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminPayouts } from '@/hooks/useAdminData';
import { Wallet, Store, Truck, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPayouts() {
  const { data: payouts, isLoading } = useAdminPayouts();

  const totals = payouts?.reduce((acc, p) => ({
    restaurant: acc.restaurant + Number(p.restaurant_amount),
    delivery: acc.delivery + Number(p.delivery_amount),
    platform: acc.platform + Number(p.platform_fee),
  }), { restaurant: 0, delivery: 0, platform: 0 }) || { restaurant: 0, delivery: 0, platform: 0 };

  const totalPayouts = totals.restaurant + totals.delivery + totals.platform;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Payouts Overview</h1>
          <p className="text-muted-foreground">Track platform earnings and partner payouts</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-admin/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-admin" />
                </div>
                <div>
                  <div className="text-2xl font-bold">₹{totalPayouts.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">Total Volume</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cafe/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-cafe" />
                </div>
                <div>
                  <div className="text-2xl font-bold">₹{totals.restaurant.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">Café Payouts</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-delivery/10 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-delivery" />
                </div>
                <div>
                  <div className="text-2xl font-bold">₹{totals.delivery.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">Delivery Payouts</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">₹{totals.platform.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">Platform Fees</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payouts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Payout History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading payouts...</div>
            ) : payouts?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payouts recorded yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Café</TableHead>
                    <TableHead>Order Total</TableHead>
                    <TableHead>Café Payout</TableHead>
                    <TableHead>Delivery Payout</TableHead>
                    <TableHead>Platform Fee</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts?.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-mono text-xs">
                        {payout.order_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>{payout.order?.restaurant?.name || '-'}</TableCell>
                      <TableCell>
                        ₹{Number(payout.order?.total_amount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-cafe font-medium">
                        ₹{Number(payout.restaurant_amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-delivery font-medium">
                        ₹{Number(payout.delivery_amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-primary font-medium">
                        ₹{Number(payout.platform_fee).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(payout.created_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
