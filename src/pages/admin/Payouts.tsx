import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAdminPayouts, useAdminRestaurantPayoutSummary } from '@/hooks/useAdminData';
import { Wallet, Store, TrendingUp, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPayouts() {
  const { data: payouts, isLoading } = useAdminPayouts();
  const { data: restaurantSummary, isLoading: summaryLoading } = useAdminRestaurantPayoutSummary();

  const totals = payouts?.reduce((acc, p) => ({
    restaurant: acc.restaurant + Number(p.restaurant_amount),
    platform: acc.platform + Number(p.platform_fee),
  }), { restaurant: 0, platform: 0 }) || { restaurant: 0, platform: 0 };

  const totalPending = restaurantSummary?.reduce((s, r) => s + r.pendingAmount, 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Payouts Overview</h1>
          <p className="text-muted-foreground">Track platform earnings and partner payouts</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-admin/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-admin" />
                </div>
                <div>
                  <div className="text-2xl font-bold">₹{(totals.restaurant + totals.platform).toFixed(0)}</div>
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
                  <div className="text-xs text-muted-foreground">Restaurant Payouts</div>
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
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <div className="text-2xl font-bold">₹{totalPending.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">Pending Payouts</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="restaurant-summary">
          <TabsList>
            <TabsTrigger value="restaurant-summary">Per-Restaurant Summary</TabsTrigger>
            <TabsTrigger value="history">Payout History</TabsTrigger>
          </TabsList>

          <TabsContent value="restaurant-summary" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Store className="w-5 h-5" /> Restaurant Payout Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : restaurantSummary?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No completed orders yet</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Restaurant</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Completed Orders</TableHead>
                        <TableHead>Total Revenue</TableHead>
                        <TableHead>Paid Out</TableHead>
                        <TableHead>Platform Fee</TableHead>
                        <TableHead>Pending</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {restaurantSummary?.map(r => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell className="text-muted-foreground">{r.city}</TableCell>
                          <TableCell>{r.completedOrders}</TableCell>
                          <TableCell>₹{r.totalRevenue.toFixed(0)}</TableCell>
                          <TableCell className="text-green-600 font-medium">₹{r.totalPaid.toFixed(0)}</TableCell>
                          <TableCell className="text-primary font-medium">₹{r.totalPlatformFee.toFixed(0)}</TableCell>
                          <TableCell>
                            {r.pendingAmount > 0 ? (
                              <Badge variant="destructive" className="font-medium">₹{r.pendingAmount.toFixed(0)}</Badge>
                            ) : (
                              <Badge variant="secondary">Settled</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wallet className="w-5 h-5" /> Payout History</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading payouts...</div>
                ) : payouts?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No payouts recorded yet</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Restaurant</TableHead>
                        <TableHead>Order Total</TableHead>
                        <TableHead>Restaurant Payout</TableHead>
                        <TableHead>Platform Fee</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts?.map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell className="font-mono text-xs">{payout.order_id.slice(0, 8)}...</TableCell>
                          <TableCell>{payout.order?.restaurant?.name || '-'}</TableCell>
                          <TableCell>₹{Number(payout.order?.total_amount || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-cafe font-medium">₹{Number(payout.restaurant_amount).toFixed(2)}</TableCell>
                          <TableCell className="text-primary font-medium">₹{Number(payout.platform_fee).toFixed(2)}</TableCell>
                          <TableCell className="text-muted-foreground">{format(new Date(payout.created_at), 'MMM d, yyyy')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
