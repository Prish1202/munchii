import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import {
  FULFILLMENT_LABELS, QUANTITY_LABELS, FulfillmentType, QuantityType, QuantityOption,
} from '@/lib/merchantTerms';

export interface ProductOptionsValue {
  fulfillment_type: FulfillmentType;
  quantity_type: QuantityType;
  quantity_options: QuantityOption[];
}

const PRESETS: Partial<Record<QuantityType, string[]>> = {
  WEIGHT: ['250g', '500g', '1kg'],
  PRICE: ['₹10', '₹20', '₹50'],
  UNIT: ['1 pc', '6 pcs', '12 pcs'],
};

export function ProductOptionsFields({ value, onChange }: { value: ProductOptionsValue; onChange: (v: ProductOptionsValue) => void }) {
  const setOpt = (i: number, patch: Partial<QuantityOption>) =>
    onChange({ ...value, quantity_options: value.quantity_options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)) });

  const setQtyType = (q: QuantityType) => {
    const preset = PRESETS[q];
    onChange({
      ...value,
      quantity_type: q,
      quantity_options: q === 'FIXED' ? [] : value.quantity_options.length ? value.quantity_options
        : (preset || []).map(label => ({ label, price: q === 'PRICE' ? Number(label.replace(/\D/g, '')) || 0 : 0 })),
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-border p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Fulfilment</Label>
          <Select value={value.fulfillment_type} onValueChange={v => onChange({ ...value, fulfillment_type: v as FulfillmentType })}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(FULFILLMENT_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Sold as</Label>
          <Select value={value.quantity_type} onValueChange={v => setQtyType(v as QuantityType)}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(QUANTITY_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {value.quantity_type !== 'FIXED' && (
        <div className="space-y-2">
          <Label>Options customers can pick (price for each)</Label>
          {value.quantity_options.map((o, i) => (
            <div key={i} className="flex gap-2">
              <Input value={o.label} placeholder="e.g. 500g" maxLength={20} onChange={e => setOpt(i, { label: e.target.value })} className="rounded-xl" />
              <Input type="number" min="0" step="0.01" value={o.price || ''} placeholder="₹" onChange={e => setOpt(i, { price: parseFloat(e.target.value) || 0 })} className="w-28 rounded-xl" />
              <Button type="button" variant="ghost" size="icon" aria-label="Remove option"
                onClick={() => onChange({ ...value, quantity_options: value.quantity_options.filter((_, idx) => idx !== i) })}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="rounded-full"
            onClick={() => onChange({ ...value, quantity_options: [...value.quantity_options, { label: '', price: 0 }] })}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add option
          </Button>
          <p className="text-xs text-muted-foreground">Customers choose one option before paying. The base price above is shown as "from".</p>
        </div>
      )}
    </div>
  );
}

export const cleanOptions = (v: ProductOptionsValue): ProductOptionsValue => ({
  ...v,
  quantity_options: v.quantity_type === 'FIXED' ? [] : v.quantity_options.filter(o => o.label.trim() && o.price > 0).map(o => ({ label: o.label.trim(), price: o.price })),
});
