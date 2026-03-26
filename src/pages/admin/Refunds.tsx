import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminRefunds, useUpdateRefundStatus, useCreateRefund, useAdminOrders } from '@/hooks/useAdminData';
import { RotateCcw, Search, Plus, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500 text-white', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-500 text-white', icon: CheckCircle },
  processed: { label: 'Processed', color: 'bg-primary text-primary-foreground', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-destructive text-destructive-foreground', icon: XCircle },
};

export default function AdminRefunds() {
  const { data: refunds, isLoading } = useAdminRefunds();
  const { data: orders } = useAdminOrders();
  const updateRefund = useUpdateRefundStatus();
  const createRefund = useCreateRefund();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingRefund, setEditingRefund] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newRefund, setNewRefund] = useState({ orderId: '', amount: '', reason: '' });

  const filtered = refunds?.filter(r => {
    const matchesSearch = r.order_id?.toLowerCase().includes(search.toLowerCase()) ||
      r.reason?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = refunds?.reduce((acc: Record<string, number>, r: any) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {}) || {};

  const totalRefunded = refunds?.filter((r: any) => r.status === 'processed').reduce((s: number, r: any) => s + Number(r.amount), 0) || 0;
  const totalPending = refunds?.filter((r: any) => r.status === 'pending').reduce((s: number, r: any) => s + Number(r.amount), 0) || 0;

  const handleUpdate = async () => {
    if (!editingRefund || !newStatus) return;
    try {
      await updateRefund.mutateAsync({ refundId: editingRefund.id, status: newStatus, adminNotes });
      toast.success('Refund status updated');
      setEditingRefund(null);
      setAdminNotes('');
      setNewStatus('');
    } catch {
      toast.error('Failed to update refund');
    }
  };

  const handleCreate = async () => {
    if (!newRefund.orderId || !newRefund.amount) return;
    const order = orders?.find(o => o.id.startsWith(newRefund.orderId));
    if (!order) { toast.error('Order not found'); return; }
    try {
      await createRefund.mutateAsync({
        orderId: order.id,
        customerId: order.customer_id || '',
        amount: parseFloat(newRefund.amount),
        reason: newRefund.reason,
      });
      toast.success('Refund created');
      setShowCreate(false);
      setNewRefund({ orderId: '', amount: '', reason: '' });
    } catch {
      toast.error('Failed to create refund');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Refund Management</h1>
            <p className="text-muted-foreground">Handle and track customer refunds</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-admin hover:bg-admin/90">
            <Plus className="w-4 h-4 mr-2" /> Create Refund
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{statusCounts['pending'] || 0}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{(statusCounts['approved'] || 0) + (statusCounts['processed'] || 0)}</div>
                  <div className="text-xs text-muted-foreground">Approved/Processed</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">₹{totalRefunded.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">Total Refunded</div>
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
                  <div className="text-xs text-muted-foreground">Pending Amount</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2"><RotateCcw className="w-5 h-5" /> Refund History</CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search refunds..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading refunds...</div>
            ) : filtered?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No refunds found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Admin Notes</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered?.map((refund: any) => {
                    const sc = STATUS_CONFIG[refund.status] || STATUS_CONFIG.pending;
                    return (
                      <TableRow key={refund.id}>
                        <TableCell className="font-mono text-xs">{refund.order_id?.slice(0, 8)}...</TableCell>
                        <TableCell className="font-medium">₹{Number(refund.amount).toFixed(2)}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">{refund.reason || '-'}</TableCell>
                        <TableCell><Badge className={sc.color}>{sc.label}</Badge></TableCell>
                        <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">{refund.admin_notes || '-'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{format(new Date(refund.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingRefund(refund);
                            setNewStatus(refund.status);
                            setAdminNotes(refund.admin_notes || '');
                          }}>
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Refund Dialog */}
      <Dialog open={!!editingRefund} onOpenChange={() => setEditingRefund(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Refund</DialogTitle>
            <DialogDescription>Update refund status for order {editingRefund?.order_id?.slice(0, 8)}... (₹{Number(editingRefund?.amount || 0).toFixed(2)})</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Reason</label>
              <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">{editingRefund?.reason || 'No reason provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Admin Notes</label>
              <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Add notes about this refund..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRefund(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateRefund.isPending} className="bg-admin hover:bg-admin/90">
              {updateRefund.isPending ? 'Updating...' : 'Update Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Refund Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Refund</DialogTitle>
            <DialogDescription>Initiate a refund for a customer order</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Order ID (first 8 chars)</label>
              <Input value={newRefund.orderId} onChange={e => setNewRefund(p => ({ ...p, orderId: e.target.value }))} placeholder="e.g. a1b2c3d4" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Amount (₹)</label>
              <Input type="number" value={newRefund.amount} onChange={e => setNewRefund(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Reason</label>
              <Textarea value={newRefund.reason} onChange={e => setNewRefund(p => ({ ...p, reason: e.target.value }))} placeholder="Reason for refund..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createRefund.isPending} className="bg-admin hover:bg-admin/90">
              {createRefund.isPending ? 'Creating...' : 'Create Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
