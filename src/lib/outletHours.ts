// Mirrors DB function public.outlet_accepts_pickup (India time, per-day hours in restaurants.weekly_hours).
type DayHours = { open?: boolean; from?: string; to?: string };
const TZ = 'Asia/Kolkata';

function localParts(d: Date) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)?.value || '';
  return { day: get('weekday'), minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}
const toMin = (t?: string) => { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };

export function outletAcceptsAt(r: { is_active?: boolean | null; weekly_hours?: unknown } | null | undefined, at: Date) {
  if (!r || r.is_active === false) return false;
  const hours = r.weekly_hours as Record<string, DayHours> | null | undefined;
  if (!hours) return true;
  const { day, minutes } = localParts(at);
  const cfg = hours[day];
  if (!cfg) return true;
  if (cfg.open === false) return false;
  const from = toMin(cfg.from), to = toMin(cfg.to);
  if (from == null || to == null) return true;
  return to > from ? minutes >= from && minutes <= to : minutes >= from || minutes <= to;
}

/** Short status for customer UI, e.g. "Offline", "Closed today", "Opens 09:00". Null when open now. */
export function outletClosedLabel(r: { is_active?: boolean | null; weekly_hours?: unknown } | null | undefined, now = new Date()) {
  if (!r) return null;
  if (r.is_active === false) return 'Offline';
  if (outletAcceptsAt(r, now)) return null;
  const cfg = (r.weekly_hours as Record<string, DayHours> | null)?.[localParts(now).day];
  if (cfg?.open === false) return 'Closed today';
  return cfg?.from && localParts(now).minutes < (toMin(cfg.from) ?? 0) ? `Opens ${cfg.from}` : 'Closed now';
}
