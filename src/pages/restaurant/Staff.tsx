import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useMyRestaurant } from '@/hooks/useMenuManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Copy, KeyRound, Plus, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { STAFF_USERNAME_RE } from '@/lib/staff';

type Staff = { id: string; name: string; username: string; created_at: string };

async function callStaff(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('manage-staff', { body });
  if (error) {
    let msg = 'Something went wrong';
    try { const b = await (error as any).context?.json?.(); if (b?.error) msg = b.error; } catch { /* default */ }
    throw new Error(msg);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data;
}

export default function RestaurantStaff() {
  const qc = useQueryClient();
  const { data: restaurant } = useMyRestaurant();
  const outletCode = (restaurant as any)?.outlet_code as string | undefined;
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', password: '' });
  const [resetFor, setResetFor] = useState<Staff | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [removeFor, setRemoveFor] = useState<Staff | null>(null);

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['restaurant-staff', restaurant?.id],
    enabled: !!restaurant?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from('restaurant_staff' as any)
        .select('id, name, username, created_at').eq('restaurant_id', restaurant!.id).eq('is_active', true)
        .order('created_at');
      if (error) throw error;
      return (data || []) as unknown as Staff[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['restaurant-staff'] });
  const onErr = (e: any) => toast.error(e?.message || 'Something went wrong');

  const add = useMutation({
    mutationFn: () => callStaff({ action: 'create', ...form, username: form.username.trim().toLowerCase() }),
    onSuccess: () => { toast.success('Staff account created'); setAddOpen(false); setForm({ name: '', username: '', password: '' }); refresh(); },
    onError: onErr,
  });
  const remove = useMutation({
    mutationFn: (id: string) => callStaff({ action: 'remove', staffId: id }),
    onSuccess: () => { toast.success('Staff removed and signed out'); setRemoveFor(null); refresh(); },
    onError: onErr,
  });
  const reset = useMutation({
    mutationFn: () => callStaff({ action: 'reset_password', staffId: resetFor!.id, password: newPassword }),
    onSuccess: () => { toast.success('Password updated'); setResetFor(null); setNewPassword(''); },
    onError: onErr,
  });

  const usernameOk = STAFF_USERNAME_RE.test(form.username.trim().toLowerCase());
  const canAdd = form.name.trim().length >= 2 && usernameOk && form.password.length >= 6;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6 pb-24 md:pb-8">
        <header className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Manage Staff</h1>
            <p className="text-sm text-muted-foreground">Staff can only see live orders, accept/reject and mark ready.</p>
          </div>
          <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add staff</Button>
        </header>

        <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">Outlet Code (staff need this to log in)</p>
            <p className="text-lg font-bold tracking-wider">{outletCode || '—'}</p>
          </div>
          {outletCode && (
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard?.writeText(outletCode); toast.success('Outlet code copied'); }}>
              <Copy className="h-4 w-4 mr-1" /> Copy
            </Button>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border bg-card">
          {isLoading ? <p className="p-4 text-sm text-muted-foreground">Loading…</p>
            : staff.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No staff yet. Tap "Add staff" to create one.</p>
            : staff.map((s, i) => (
              <div key={s.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t' : ''}`}>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><UserRound className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">@{s.username}</p>
                </div>
                <Button variant="ghost" size="icon" aria-label="Reset password" onClick={() => setResetFor(s)}><KeyRound className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" aria-label="Remove staff" onClick={() => setRemoveFor(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add staff</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="s-name">Staff name</Label>
              <Input id="s-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="s-user">Username</Label>
              <Input id="s-user" autoCapitalize="none" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
              {form.username && !usernameOk && <p className="text-xs text-destructive">3–20 characters: letters, numbers, _ or .</p>}</div>
            <div className="space-y-1.5"><Label htmlFor="s-pass">Password</Label>
              <Input id="s-pass" type="text" autoCapitalize="none" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              <p className="text-xs text-muted-foreground">At least 6 characters. Share it with your staff member.</p></div>
          </div>
          <DialogFooter>
            <Button disabled={!canAdd || add.isPending} onClick={() => add.mutate()}>{add.isPending ? 'Creating…' : 'Create account'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetFor} onOpenChange={(o) => { if (!o) { setResetFor(null); setNewPassword(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset password for {resetFor?.name}</DialogTitle></DialogHeader>
          <div className="space-y-1.5"><Label htmlFor="s-newpass">New password</Label>
            <Input id="s-newpass" type="text" autoCapitalize="none" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
          <DialogFooter>
            <Button disabled={newPassword.length < 6 || reset.isPending} onClick={() => reset.mutate()}>{reset.isPending ? 'Saving…' : 'Save password'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removeFor} onOpenChange={(o) => { if (!o) setRemoveFor(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeFor?.name}?</AlertDialogTitle>
            <AlertDialogDescription>Their account is deactivated immediately and they will be signed out.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); if (removeFor) remove.mutate(removeFor.id); }} disabled={remove.isPending}>
              {remove.isPending ? 'Removing…' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
