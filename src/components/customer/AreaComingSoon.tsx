import { useState } from 'react';
import { Rocket, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { MerchantType } from '@/lib/merchantTerms';
import type { Coords } from '@/lib/geo';

interface Props {
  category: MerchantType;
  city: string | null;
  areaLabel: string | null;
  coords: Coords | null;
}

export function AreaComingSoon({ category, city, areaLabel, coords }: Props) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const campus = category === 'canteen';
  const title = campus ? "We're coming soon to your campus!" : "We're coming soon to your area!";

  const request = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from('city_interests').insert({
      user_id: user.id,
      city: (city || areaLabel || 'Unknown').slice(0, 100),
      category,
      area_label: areaLabel?.slice(0, 200) ?? null,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
    } as any);
    setBusy(false);
    if (error && error.code !== '23505') { toast.error('Something went wrong, try again'); return; }
    setDone(true);
    toast.success(error ? "You've already requested this area" : 'Request sent! We’ll let you know when we arrive.');
  };

  return (
    <div className="flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Rocket className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-display text-xl font-bold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        No {campus ? 'campus canteens' : category === 'grocery' ? 'grocery stores' : 'restaurants'} near {areaLabel || city || 'you'} yet. Tell us you want Munchii here.
      </p>
      <Button className="mt-6 gap-2 rounded-xl" onClick={request} disabled={busy || done}>
        <Send className="h-4 w-4" />
        {done ? 'Requested' : busy ? 'Sending…' : campus ? 'Request Munchii in your campus' : 'Request Munchii in your area'}
      </Button>
    </div>
  );
}
