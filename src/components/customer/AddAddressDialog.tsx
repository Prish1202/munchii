import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OutletMapPicker } from '@/components/restaurant/OutletMapPicker';
import { reverseGeocodeFull } from '@/lib/geo';
import { useAddAddress, SavedAddress } from '@/hooks/useSavedAddresses';
import { useLocation } from '@/contexts/LocationContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LABELS = ['Home', 'Work', 'Other'];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: (a: SavedAddress) => void;
}

export function AddAddressDialog({ open, onOpenChange, onSaved }: Props) {
  const { coords } = useLocation();
  const add = useAddAddress();
  const [step, setStep] = useState<'pin' | 'details'>('pin');
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(coords);
  const [geo, setGeo] = useState<{ city: string | null; label: string | null }>({ city: null, label: null });
  const [f, setF] = useState({ label: 'Home', house: '', area: '', landmark: '', receiver_name: '', receiver_phone: '' });

  useEffect(() => { if (open) { setStep('pin'); setPin(coords); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!pin) return;
    const t = setTimeout(async () => {
      const g = await reverseGeocodeFull(pin.lat, pin.lng);
      setGeo(g);
      setF(prev => (prev.area ? prev : { ...prev, area: g.label || '' }));
    }, 500);
    return () => clearTimeout(t);
  }, [pin]);

  const save = async () => {
    if (!pin) return;
    if (!f.house.trim()) { toast.error('Add house / flat / floor'); return; }
    if (f.receiver_phone && !/^[0-9+\s-]{7,15}$/.test(f.receiver_phone)) { toast.error('Enter a valid phone number'); return; }
    try {
      const saved = await add.mutateAsync({
        label: f.label, house: f.house.trim().slice(0, 120), area: f.area.trim().slice(0, 160) || null,
        landmark: f.landmark.trim().slice(0, 120) || null, receiver_name: f.receiver_name.trim().slice(0, 80) || null,
        receiver_phone: f.receiver_phone.trim() || null, city: geo.city, formatted: geo.label,
        latitude: pin.lat, longitude: pin.lng,
      });
      toast.success('Address saved');
      onSaved(saved);
      onOpenChange(false);
      setF({ label: 'Home', house: '', area: '', landmark: '', receiver_name: '', receiver_phone: '' });
    } catch {
      toast.error('Could not save address');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{step === 'pin' ? 'Set location on map' : 'Enter address details'}</DialogTitle>
        </DialogHeader>
        {step === 'pin' ? (
          <div className="space-y-3">
            <OutletMapPicker value={pin} onChange={setPin} />
            {geo.label && pin && <p className="text-sm text-muted-foreground">📍 {geo.label}</p>}
            <Button className="w-full rounded-xl" disabled={!pin} onClick={() => setStep('details')}>Confirm location</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl bg-muted p-3 text-sm">
              <span className="font-semibold">📍 {geo.label || 'Pinned location'}</span>
              <button type="button" className="ml-2 text-xs font-semibold text-primary" onClick={() => setStep('pin')}>Change</button>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Save address as</p>
              <div className="flex gap-2">
                {LABELS.map(l => (
                  <button key={l} type="button" onClick={() => setF({ ...f, label: l })}
                    className={cn('rounded-full border px-4 py-1.5 text-sm font-medium', f.label === l ? 'border-primary bg-primary/10 text-primary' : 'border-border')}>{l}</button>
                ))}
              </div>
            </div>
            <Input placeholder="House / Flat / Floor *" value={f.house} onChange={e => setF({ ...f, house: e.target.value })} />
            <Input placeholder="Area / Sector / Locality" value={f.area} onChange={e => setF({ ...f, area: e.target.value })} />
            <Input placeholder="Nearby landmark (optional)" value={f.landmark} onChange={e => setF({ ...f, landmark: e.target.value })} />
            <p className="pt-1 text-xs font-semibold text-muted-foreground">Receiver details</p>
            <Input placeholder="Receiver's name" value={f.receiver_name} onChange={e => setF({ ...f, receiver_name: e.target.value })} />
            <Input placeholder="Receiver's phone number" inputMode="tel" value={f.receiver_phone} onChange={e => setF({ ...f, receiver_phone: e.target.value })} />
            <Button className="w-full rounded-xl" onClick={save} disabled={add.isPending}>{add.isPending ? 'Saving…' : 'Save address'}</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
