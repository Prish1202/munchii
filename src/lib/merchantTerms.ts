export type MerchantType = 'restaurant' | 'canteen' | 'grocery';
export type FulfillmentType = 'READY_TO_PICK' | 'PICK_AND_PACK' | 'WEIGH_AND_PACK' | 'PREPARE';
export type QuantityType = 'FIXED' | 'WEIGHT' | 'UNIT' | 'PRICE';
export interface QuantityOption { label: string; price: number }

export const MERCHANT_TYPES: { value: MerchantType; emoji: string; label: string; short: string; tagline: string }[] = [
  { value: 'restaurant', emoji: '🍔', label: 'Restaurant / Café', short: 'Food', tagline: 'Restaurants & Cafés' },
  { value: 'canteen', emoji: '🏫', label: 'In-campus Canteen', short: 'Campus', tagline: 'Campus Canteens' },
  { value: 'grocery', emoji: '🛒', label: 'Grocery / Daily Needs', short: 'Grocery', tagline: 'Grocery & Daily Needs' },
];

export const isGrocery = (t?: string | null) => t === 'grocery';

export function merchantTerms(t?: string | null) {
  const g = isGrocery(t);
  return {
    business: g ? 'Store' : t === 'canteen' ? 'Canteen' : 'Restaurant',
    catalog: g ? 'Products' : 'Menu',
    item: g ? 'Product' : 'Item',
    queue: g ? 'Packing queue' : 'Kitchen queue',
    preparing: g ? 'Packing' : 'Preparing',
  };
}

export const FULFILLMENT_LABELS: Record<FulfillmentType, string> = {
  READY_TO_PICK: 'Ready to pick',
  PICK_AND_PACK: 'Pick & pack',
  WEIGH_AND_PACK: 'Weigh & pack',
  PREPARE: 'Prepare (cooked)',
};

export const QUANTITY_LABELS: Record<QuantityType, string> = {
  FIXED: 'Fixed item / pack',
  WEIGHT: 'By weight (250g / 500g / 1kg)',
  UNIT: 'By unit (pcs)',
  PRICE: 'By price (e.g. ₹20)',
};

export const usesPrepTime = (f?: string | null) => !f || f === 'PREPARE' || f === 'WEIGH_AND_PACK';
