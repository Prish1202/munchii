import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAdminUsers, useAdminUserDetail } from '@/hooks/useAdminData';
import { useState } from 'react';
import { Search, Users, Coffee, Shield, Eye, Heart, ShoppingBag, Coins, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';

const ROLE_CONFIG = {
  customer: { label: 'Customer', icon: Coffee, color: 'bg-customer text-white' },
  restaurant: { label: 'Restaurant Partner', icon: Coffee, color: 'bg-cafe text-white' },
  admin: { label: 'Admin', icon: Shield, color: 'bg-admin text-white' },
};

export default function AdminUsers() {
  const { data: users, isLoading } = useAdminUsers();
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { data: userDetail, isLoading: detailLoading } = useAdminUserDetail(selectedUserId);

  const filteredUsers = users?.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.phone?.includes(search) ||
    user.username?.toLowerCase().includes(search.toLowerCase()) ||
    user.city?.toLowerCase().includes(search.toLowerCase())
  );

  const usersByRole = users?.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">View and manage all platform users</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {Object.entries(ROLE_CONFIG).map(([role, config]) => (
            <Card key={role}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`}>
                    <config.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{usersByRole[role] || 0}</div>
                    <div className="text-xs text-muted-foreground">{config.label}s</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />All Users</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading users...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => {
                    const roleConfig = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG];
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">@{user.username || '-'}</TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{[user.city, user.state].filter(Boolean).join(', ') || '-'}</TableCell>
                        <TableCell><Badge className={roleConfig?.color}>{roleConfig?.label || user.role}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{format(new Date(user.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => setSelectedUserId(user.id)}>
                            <Eye className="w-3.5 h-3.5 mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredUsers?.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUserId} onOpenChange={open => !open && setSelectedUserId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" /> {userDetail?.profile?.name || 'User Details'}
            </DialogTitle>
            <DialogDescription>Complete user information and activity</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : userDetail ? (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <Heart className="w-4 h-4 mx-auto text-primary mb-1" />
                  <div className="text-lg font-bold">{userDetail.followersCount}</div>
                  <div className="text-[10px] text-muted-foreground">Followers</div>
                </div>
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <Users className="w-4 h-4 mx-auto text-primary mb-1" />
                  <div className="text-lg font-bold">{userDetail.followingCount}</div>
                  <div className="text-[10px] text-muted-foreground">Following</div>
                </div>
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <ShoppingBag className="w-4 h-4 mx-auto text-primary mb-1" />
                  <div className="text-lg font-bold">{userDetail.completedOrders}/{userDetail.totalOrders}</div>
                  <div className="text-[10px] text-muted-foreground">Orders (Done/Total)</div>
                </div>
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <Coins className="w-4 h-4 mx-auto text-primary mb-1" />
                  <div className="text-lg font-bold">{userDetail.wallet?.total_coins || 0}</div>
                  <div className="text-[10px] text-muted-foreground">Coins</div>
                </div>
              </div>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="info" className="flex-1">Profile</TabsTrigger>
                  <TabsTrigger value="orders" className="flex-1">Orders</TabsTrigger>
                  <TabsTrigger value="coins" className="flex-1">Coins</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="mt-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{userDetail.profile?.name}</span></div>
                    <div><span className="text-muted-foreground">Username:</span> <span className="font-medium">@{userDetail.profile?.username || '-'}</span></div>
                    <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{userDetail.profile?.phone || '-'}</span></div>
                    <div><span className="text-muted-foreground">Role:</span> <Badge className={ROLE_CONFIG[userDetail.role as keyof typeof ROLE_CONFIG]?.color || 'bg-muted'}>{userDetail.role}</Badge></div>
                    <div><span className="text-muted-foreground">Area:</span> <span className="font-medium">{userDetail.profile?.campus || '-'}</span></div>
                    <div><span className="text-muted-foreground">City:</span> <span className="font-medium">{userDetail.profile?.city || '-'}</span></div>
                    <div><span className="text-muted-foreground">State:</span> <span className="font-medium">{userDetail.profile?.state || '-'}</span></div>
                    <div><span className="text-muted-foreground">Bio:</span> <span className="font-medium">{userDetail.profile?.bio || '-'}</span></div>
                    <div><span className="text-muted-foreground">Total Spent:</span> <span className="font-medium">₹{userDetail.totalSpent.toFixed(0)}</span></div>
                    <div><span className="text-muted-foreground">Joined:</span> <span className="font-medium">{userDetail.profile?.created_at ? format(new Date(userDetail.profile.created_at), 'MMM d, yyyy') : '-'}</span></div>
                  </div>
                </TabsContent>

                <TabsContent value="orders" className="mt-4">
                  {userDetail.orders.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No orders yet</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {userDetail.orders.map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 text-sm">
                          <div>
                            <p className="font-medium">{order.restaurant?.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), 'MMM d, yyyy HH:mm')}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">₹{Number(order.total_amount).toFixed(0)}</span>
                            <Badge variant={order.status === 'completed' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'} className="text-[10px]">
                              {order.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="coins" className="mt-4">
                  {userDetail.coinTransactions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No coin activity</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {userDetail.coinTransactions.map((tx: any) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 text-sm">
                          <div className="flex items-center gap-2">
                            {tx.type === 'earn' ? <ArrowDownLeft className="w-4 h-4 text-green-500" /> : <ArrowUpRight className="w-4 h-4 text-orange-500" />}
                            <div>
                              <p className="font-medium capitalize">{tx.type}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(tx.created_at), 'MMM d, yyyy')}</p>
                            </div>
                          </div>
                          <span className={`font-bold ${tx.type === 'earn' ? 'text-green-600' : 'text-orange-600'}`}>
                            {tx.type === 'earn' ? '+' : '-'}{Number(tx.coins)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
