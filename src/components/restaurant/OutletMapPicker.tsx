import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  value: { lat: number; lng: number } | null;
  onChange: (v: { lat: number; lng: number }) => void;
}

const DEFAULT_CENTER: [number, number] = [22.9734, 78.6569]; // India

const pinIcon = L.divIcon({
  className: '',
  html: '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:hsl(var(--primary));border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

export function OutletMapPicker({ value, onChange }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const cb = useRef(onChange);
  cb.current = onChange;
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const place = (lat: number, lng: number, zoom?: number) => {
    if (!map.current) return;
    if (!marker.current) {
      marker.current = L.marker([lat, lng], { draggable: true, icon: pinIcon }).addTo(map.current);
      marker.current.on('dragend', () => {
        const p = marker.current!.getLatLng();
        cb.current({ lat: p.lat, lng: p.lng });
      });
    } else marker.current.setLatLng([lat, lng]);
    map.current.setView([lat, lng], zoom ?? Math.max(map.current.getZoom(), 16));
    cb.current({ lat, lng });
  };

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { zoomControl: true }).setView(value ? [value.lat, value.lng] : DEFAULT_CENTER, value ? 16 : 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap', maxZoom: 19,
    }).addTo(map.current);
    if (value) {
      marker.current = L.marker([value.lat, value.lng], { draggable: true, icon: pinIcon }).addTo(map.current);
      marker.current.on('dragend', () => { const p = marker.current!.getLatLng(); cb.current({ lat: p.lat, lng: p.lng }); });
    }
    map.current.on('click', (e: L.LeafletMouseEvent) => place(e.latlng.lat, e.latlng.lng, map.current!.getZoom()));
    setTimeout(() => map.current?.invalidateSize(), 200);
    return () => { map.current?.remove(); map.current = null; marker.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useMyLocation = () => {
    setErr(null);
    if (!navigator.geolocation) { setErr('Location not supported on this device'); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      p => { setBusy(false); place(p.coords.latitude, p.coords.longitude, 17); },
      () => { setBusy(false); setErr('Location permission denied — tap the map to drop the pin.'); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const search = async () => {
    if (!query.trim()) return;
    setErr(null); setBusy(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`, { headers: { 'Accept-Language': 'en' } });
      const d = await r.json();
      if (d?.[0]) place(Number(d[0].lat), Number(d[0].lon), 17);
      else setErr('Place not found — try a nearby landmark.');
    } catch { setErr('Search failed'); }
    setBusy(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search area or landmark"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); search(); } }} className="pl-9 rounded-xl" />
        </div>
        <Button type="button" variant="outline" onClick={search} disabled={busy} className="rounded-xl">Find</Button>
      </div>
      <div ref={el} className="relative z-0 h-64 w-full overflow-hidden rounded-xl border border-border" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={useMyLocation} disabled={busy} className="rounded-xl">
          <Crosshair className="mr-1.5 h-4 w-4" /> {busy ? 'Locating…' : 'Use my current location'}
        </Button>
        <span className="text-xs text-muted-foreground">
          {value ? `Pinned: ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : 'Tap the map or drag the pin to your outlet entrance'}
        </span>
      </div>
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
}
