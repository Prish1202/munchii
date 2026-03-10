import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminRestaurants, useVerifyRestaurant } from '@/hooks/useAdminData';
import { Search, Store, Clock, CheckCircle, XCircle, ShieldCheck, Eye, Building, User, Landmark } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground', icon: Clock },
  pending: { label: 'Pending', color: 'bg-accent text-accent-foreground', icon: Clock },
  verified: { label: 'Verified', color: 'bg-primary text-primary-foreground', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-destructive text-destructive-foreground', icon: XCircle },
};

export default function AdminRestaurants() {
  const { data: restaurants, isLoading } = useAdminRestaurants();
  const verifyRestaurant = useVerifyRestaurant();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = restaurants?.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.city?.toLowerCase().includes(search.toLowerCase()) || '';
    const matchesStatus = statusFilter === 'all' || r.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selected = restaurants?.find(r => r.id === selectedId);

  const statusCounts = restaurants?.reduce((acc, r) => {
    acc[r.verification_status] = (acc[r.verification_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const handleVerify = async (id: string, status: 'verified' | 'rejected') => {
    await verifyRestaurant.mutateAsync({ restaurantId: id, status });
    toast.success(status === 'verified' ? 'Restaurant verified!' : 'Restaurant rejected');
    setSelectedId(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Restaurant Management</h1>
          <p className="text-muted-foreground">Verify and manage restaurant partners</p>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <Card key={status} className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setStatusFilter(status === statusFilter ? 'all' : status)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`}>
                    <config.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{statusCounts[status] || 0}</div>
                    <div className="text-xs text-muted-foreground">{config.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" /> All Restaurants
              </CardTitle>
              <div className="flex gap-3 w-full sm:w-auto">
                <Tabs value={statusFilter} onValueChange={setStatusFilter} className="hidden sm:block">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="verified">Verified</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search restaurants..." value={search}
                    onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading restaurants...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Restaurant</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered?.map(r => {
                      const sc = STATUS_CONFIG[r.verification_status] || STATUS_CONFIG.draft;
                      return (
                        <TableRow key={r.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{r.name}</div>
                              <div className="text-xs text-muted-foreground">{r.area ? `${r.area}, ` : ''}{r.address}</div>
                            </div>
                          </TableCell>
                          <TableCell>{r.city || '-'}</TableCell>
                          <TableCell>
                            <Badge className={sc.color}>{sc.label}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(r.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => setSelectedId(r.id)}>
                                <Eye className="w-3.5 h-3.5 mr-1" /> View
                              </Button>
                              {r.verification_status === 'pending' && (
                                <>
                                  <Button size="sm" className="bg-primary hover:bg-primary/90"
                                    onClick={() => handleVerify(r.id, 'verified')}
                                    disabled={verifyRestaurant.isPending}>
                                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                                  </Button>
                                  <Button size="sm" variant="destructive"
                                    onClick={() => handleVerify(r.id, 'rejected')}
                                    disabled={verifyRestaurant.isPending}>
                                    <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filtered?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No restaurants found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Restaurant Detail Dialog */}
      <Dialog open={!!selectedId} onOpenChange={open => !open && setSelectedId(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Store className="w-5 h-5" /> {selected?.name}
            </DialogTitle>
            <DialogDescription>Restaurant application details</DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-6 pt-2">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge className={STATUS_CONFIG[selected.verification_status]?.color}>
                  {STATUS_CONFIG[selected.verification_status]?.label}
                </Badge>
              </div>

              {/* Restaurant Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Building className="w-4 h-4" /> Restaurant Info
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selected.name}</span></div>
                  <div><span className="text-muted-foreground">City:</span> <span className="font-medium">{selected.city || '-'}</span></div>
                  <div><span className="text-muted-foreground">Area:</span> <span className="font-medium">{selected.area || '-'}</span></div>
                  <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{selected.contact_phone || '-'}</span></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Address:</span> <span className="font-medium">{selected.address}</span></div>
                  <div><span className="text-muted-foreground">FSSAI:</span> <span className="font-medium">{selected.fssai_license || '-'}</span></div>
                  <div><span className="text-muted-foreground">GST:</span> <span className="font-medium">{selected.gst_number || '-'}</span></div>
                  {selected.university_name && (
                    <div className="col-span-2"><span className="text-muted-foreground">University:</span> <span className="font-medium">{selected.university_name}</span></div>
                  )}
                  <div><span className="text-muted-foreground">Opens:</span> <span className="font-medium">{selected.opening_hours || '-'}</span></div>
                  <div><span className="text-muted-foreground">Closes:</span> <span className="font-medium">{selected.closing_hours || '-'}</span></div>
                </div>
              </div>

              {/* Owner Info */}
              {selected.owner_details && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <User className="w-4 h-4" /> Owner Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">PAN:</span> <span className="font-medium">{selected.owner_details.pan_number || '-'}</span></div>
                    <div><span className="text-muted-foreground">Aadhaar:</span> <span className="font-medium">{selected.owner_details.aadhaar_number || '-'}</span></div>
                    <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{selected.owner_details.contact_phone || '-'}</span></div>
                    <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selected.owner_details.contact_email || '-'}</span></div>
                  </div>
                </div>
              )}

              {/* Bank Info */}
              {selected.bank_details && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Landmark className="w-4 h-4" /> Bank Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Holder:</span> <span className="font-medium">{selected.bank_details.account_holder_name || '-'}</span></div>
                    <div><span className="text-muted-foreground">Bank:</span> <span className="font-medium">{selected.bank_details.bank_name || '-'}</span></div>
                    <div><span className="text-muted-foreground">Account:</span> <span className="font-medium">{selected.bank_details.account_number || '-'}</span></div>
                    <div><span className="text-muted-foreground">IFSC:</span> <span className="font-medium">{selected.bank_details.ifsc_code || '-'}</span></div>
                    <div><span className="text-muted-foreground">UPI:</span> <span className="font-medium">{selected.bank_details.upi_id || '-'}</span></div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selected.verification_status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={() => handleVerify(selected.id, 'verified')}
                    disabled={verifyRestaurant.isPending}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Approve Restaurant
                  </Button>
                  <Button variant="destructive" className="flex-1"
                    onClick={() => handleVerify(selected.id, 'rejected')}
                    disabled={verifyRestaurant.isPending}>
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
