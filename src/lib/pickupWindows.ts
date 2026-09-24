export const DEFAULT_PREPARATION_MINUTES = 10;
export const DEFAULT_RESTAURANT_BUFFER_MINUTES = 5;
export const PICKUP_WINDOW_MINUTES = 10;
export const PICKUP_SLOT_INTERVAL_MINUTES = 15;

export interface PickupWindow {
  start: Date;
  end: Date;
  value: string;
  label: string;
}

function roundUpToInterval(date: Date, intervalMinutes: number) {
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);
  const remainder = rounded.getMinutes() % intervalMinutes;
  if (remainder > 0) rounded.setMinutes(rounded.getMinutes() + intervalMinutes - remainder);
  return rounded;
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatPickupWindow(startValue: string | Date, slotMinutes: number = PICKUP_WINDOW_MINUTES) {
  const start = startValue instanceof Date ? startValue : new Date(startValue);
  if (Number.isNaN(start.getTime())) return '';
  const end = new Date(start.getTime() + Math.max(1, slotMinutes) * 60_000);
  return `${formatTime(start)}–${formatTime(end)}`;
}

export function getPickupWindows({
  preparationMinutes,
  bufferMinutes = DEFAULT_RESTAURANT_BUFFER_MINUTES,
  now = new Date(),
  count = 6,
  slotMinutes,
  minLeadMinutes = 0,
}: {
  slotMinutes?: number;
  minLeadMinutes?: number;
  preparationMinutes: number;
  bufferMinutes?: number;
  now?: Date;
  count?: number;
}): PickupWindow[] {
  const safePreparation = Math.max(1, preparationMinutes || DEFAULT_PREPARATION_MINUTES);
  const safeBuffer = Math.max(0, bufferMinutes || 0);
  // When slotMinutes is given, it controls both window length and interval.
  const interval = slotMinutes && slotMinutes > 0 ? Math.round(slotMinutes) : PICKUP_SLOT_INTERVAL_MINUTES;
  const length = slotMinutes && slotMinutes > 0 ? Math.round(slotMinutes) : PICKUP_WINDOW_MINUTES;
  const leadMinutes = Math.max(safePreparation + safeBuffer, Math.max(0, minLeadMinutes || 0));
  const readyAt = new Date(now.getTime() + leadMinutes * 60_000);
  const firstStart = roundUpToInterval(readyAt, interval);

  return Array.from({ length: count }, (_, index) => {
    const start = new Date(firstStart.getTime() + index * interval * 60_000);
    const end = new Date(start.getTime() + length * 60_000);
    return {
      start,
      end,
      value: start.toISOString(),
      label: `${formatTime(start)}–${formatTime(end)}`,
    };
  });
}