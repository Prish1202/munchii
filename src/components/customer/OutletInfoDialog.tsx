import { useQuery } from '@tanstack/react-query';
import { Phone, Navigation, CalendarDays, User, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { directionsUrl } from '@/lib/geo';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  restaurant: { id: string; name: string; address: string; created_at: string; contact_phone?: string | null; latitude?: number | null; longitude?: number | null };
}

export function OutletInfoDialog({ open, onOpenChange, restaurant: r }: Props) {
  const { data: ownerName } = useQuery({
    queryKey: ['outlet-owner', r.id],
    enabled: open,
    queryFn: async () => {
      const { data } = await (supabase.rpc as any)('get_outlet_owner_name', { _restaurant_id: r.id });
      return (data as string | null) ?? null;
    },
  });
  const year = new Date(r.created_at).getFullYear();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader><DialogTitle className="text-xl">{r.name}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" />{r.address}</p>
          <p className="flex gap-2"><CalendarDays className="h-4 w-4 text-primary" />Munchii partner since {year}</p>
          {ownerName && <p className="flex gap-2"><User className="h-4 w-4 text-primary" />Legal name: {ownerName}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="outline" className="gap-2 rounded-xl" disabled={!r.contact_phone} asChild={!!r.contact_phone}>
            {r.contact_phone ? <a href={`tel:${r.contact_phone}`}><Phone className="h-4 w-4" />Call</a> : <span><Phone className="h-4 w-4" />No phone</span>}
          </Button>
          <Button className="gap-2 rounded-xl" asChild>
            <a href={directionsUrl(r)} target="_blank" rel="noopener noreferrer"><Navigation className="h-4 w-4" />Direction</a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
