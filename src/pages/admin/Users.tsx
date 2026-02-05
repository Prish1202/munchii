import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminUsers } from '@/hooks/useAdminData';
import { useState } from 'react';
import { Search, Users, Coffee, Truck, Shield } from 'lucide-react';
import { format } from 'date-fns';

const ROLE_CONFIG = {
  customer: { label: 'Coffee Lover', icon: Coffee, color: 'bg-customer text-white' },
  restaurant: { label: 'Café Partner', icon: Coffee, color: 'bg-cafe text-white' },
  delivery: { label: 'Delivery Partner', icon: Truck, color: 'bg-delivery text-white' },
  admin: { label: 'Admin', icon: Shield, color: 'bg-admin text-white' },
};

export default function AdminUsers() {
  const { data: users, isLoading } = useAdminUsers();
  const [search, setSearch] = useState('');

  const filteredUsers = users?.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.phone?.includes(search)
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

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                All Users
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
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
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => {
                    const roleConfig = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG];
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge className={roleConfig?.color}>
                            {roleConfig?.label || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredUsers?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
