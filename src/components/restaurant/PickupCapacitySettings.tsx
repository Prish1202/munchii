import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PauseCircle, PlayCircle, Minus, Plus } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type Update = (patch: Record<string, unknown>) => void;

const BASIC_FIELDS: { key: string; label: string; min: number; max: number; def: number; hint: string }[] = [
  { key: 'pickup_slot_minutes', label: 'Pickup slot duration (min)', min: 5, max: 30, def: 10, hint: 'Length of each pickup window' },
  { key: 'max_orders_per_slot', label: 'Max orders per slot', min: 1, max: 200, def: 10, hint: 'Slot shows FULL once reached' },
];

const ADVANCED_FIELDS: typeof BASIC_FIELDS = [
  { key: 'max_workload_per_slot', label: 'Max prep workload per slot (min)', min: 10, max: 2000, def: 150, hint: 'Sum of prep minutes of orders in a slot' },
  { key: 'min_advance_minutes', label: 'Minimum advance time (min)', min: 0, max: 240, def: 0, hint: 'Earliest a customer may book ahead' },
  { key: 'max_advance_minutes', label: 'Maximum advance booking (min)', min: 30, max: 2880, def: 480, hint: 'How far ahead customers can book' },
];

export function PauseOrdersControl({ restaurant, update }: { restaurant: any; update: Update }) {
  const until = restaurant.orders_paused_until ? new Date(restaurant.orders_paused_until) : null;
  const paused = restaurant.orders_paused_indefinitely || (until && until > new Date());
  const pause = (mins: number | null) =>
    update(mins === null
      ? { orders_paused_indefinitely: true, orders_paused_until: null }
      : { orders_paused_indefinitely: false, orders_paused_until: new Date(Date.now() + mins * 60_000).toISOString() });
  const adjust = (d: number) =>
    update({ max_orders_per_slot: Math.max(1, (restaurant.max_orders_per_slot ?? 10) + d) });

  return (
    <Card className={paused ? 'rounded-lg border-destructive/60' : 'rounded-lg border-primary/30'}>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 font-semibold">
              {paused ? <PauseCircle className="w-4 h-4 text-destructive" /> : <PlayCircle className="w-4 h-4 text-primary" />}
              {paused ? 'Orders paused' : 'Accepting orders'}
            </p>
            <p className="text-xs text-muted-foreground">
              {restaurant.orders_paused_indefinitely ? 'Paused until you reopen' : paused && until ? `Automatically reopens at ${until.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Customers can place pickup orders'}
            </p>
          </div>
          {paused && <Button size="sm" onClick={() => update({ orders_paused_indefinitely: false, orders_paused_until: null })}>Accepting orders</Button>}
        </div>
        {!paused && (
          <div className="space-y-2">
            <Button variant="destructive" className="w-full" onClick={() => pause(null)}><PauseCircle className="mr-2 h-4 w-4" />Pause orders</Button>
            <div className="grid grid-cols-3 gap-2">
              {[10, 20, 30].map((m) => <Button key={m} variant="outline" size="sm" onClick={() => pause(m)}>Pause {m} min</Button>)}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between rounded-lg bg-muted p-2">
          <span className="text-sm">Orders per slot</span>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => adjust(-1)}><Minus className="w-4 h-4" /></Button>
            <span className="w-8 text-center font-semibold">{restaurant.max_orders_per_slot ?? 10}</span>
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => adjust(1)}><Plus className="w-4 h-4" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PickupCapacitySettings({ restaurant, update }: { restaurant: any; update: Update }) {
  return (
    <Card className="rounded-lg" id="ordering">
      <CardHeader><CardTitle className="text-lg">Ordering & Pickup</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {BASIC_FIELDS.map((f) => (
          <div key={f.key} className="space-y-1">
            <Label>{f.label}</Label>
            <Input
              key={`${f.key}-${restaurant[f.key]}`}
              type="number" min={f.min} max={f.max} className="rounded-xl"
              defaultValue={restaurant[f.key] ?? f.def}
              onBlur={(e) => {
                const v = Math.min(f.max, Math.max(f.min, parseInt(e.target.value) || f.def));
                if (v !== (restaurant[f.key] ?? f.def)) update({ [f.key]: v });
              }}
            />
            <p className="text-xs text-muted-foreground">{f.hint}</p>
          </div>
        ))}
        <Accordion type="single" collapsible className="rounded-lg border px-4">
          <AccordionItem value="advanced" className="border-0">
            <AccordionTrigger className="hover:no-underline">
              <span className="text-left">
                <span className="block font-semibold">Advanced</span>
                <span className="block text-xs font-normal text-muted-foreground">Workload and advance-booking limits</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              {ADVANCED_FIELDS.map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label>{f.label}</Label>
                  <Input
                    key={`${f.key}-${restaurant[f.key]}`}
                    type="number" min={f.min} max={f.max} className="rounded-lg"
                    defaultValue={restaurant[f.key] ?? f.def}
                    onBlur={(e) => {
                      const v = Math.min(f.max, Math.max(f.min, parseInt(e.target.value) || f.def));
                      if (v !== (restaurant[f.key] ?? f.def)) update({ [f.key]: v });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">{f.hint}</p>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
