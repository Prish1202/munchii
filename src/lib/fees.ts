export const PLATFORM_FEE = 3;
export const COMMISSION_RATE = 0.05;

/** Merchant commission on the item total; 0 when admin turned commission off for the outlet. */
export function commissionFor(itemTotal: number, commissionEnabled: boolean | null | undefined = true) {
  if (commissionEnabled === false) return 0;
  return Math.round(itemTotal * COMMISSION_RATE * 100) / 100;
}
