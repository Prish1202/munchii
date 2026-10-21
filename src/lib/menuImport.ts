export interface MenuImportRow {
  id: string;
  name: string;
  price: string;
}

/** Deliberately conservative: ambiguous multi-price lines remain in the source text. */
export function parseMenuText(text: string): Omit<MenuImportRow, 'id'>[] {
  return text.split(/\r?\n/).flatMap(line => {
    const normalized = line.normalize('NFKC').trim();
    const match = normalized.match(/^(.+?)\s*(?:₹|Rs\.?|INR)?\s*([0-9]+(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?)\s*(?:\/-|\/-\.|\/|\.00)?\s*$/i);
    if (!match) return [];
    const name = match[1].replace(/^\s*\d+[.)]\s*/, '').replace(/[.·…\s:|–—-]+$/, '').trim();
    const price = Number(match[2].replace(/,/g, ''));
    if (!/[\p{L}]/u.test(name) || /\d\s*$/.test(name) || /(?:₹|\bRs\.?|\bINR)\s*\d/i.test(name)) return [];
    if (/^(?:grand\s+total|total|subtotal|tax|gst|cgst|sgst|service\s+charge|discount|phone|mobile|tel)\b/i.test(name)) return [];
    if (!Number.isFinite(price) || price <= 0) return [];
    return [{ name, price: price.toFixed(2) }];
  });
}

export function validateMenuImportRows(rows: MenuImportRow[]): string | null {
  if (!rows.length) return 'Add at least one item before saving.';
  for (const [index, row] of rows.entries()) {
    if (!row.name.trim()) return `Enter an item name in row ${index + 1}.`;
    if (!/^\d+(?:\.\d{1,2})?$/.test(row.price.trim()) || Number(row.price) <= 0 || !Number.isFinite(Number(row.price))) {
      return `Enter a price greater than ₹0, with up to two decimal places, in row ${index + 1}.`;
    }
  }
  return null;
}