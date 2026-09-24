import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getPickupWindows, PICKUP_SLOT_INTERVAL_MINUTES, PickupWindow } from '@/lib/pickupWindows';

export interface SlotWindow extends PickupWindow {
  orderCount: number;
  remaining: number;
}

/** Pickup windows filtered by restaurant capacity, pause state and booking limits. */
export function useAvailablePickupWindows(opts: {
  restaurantId: string | null | undefined;
  preparationMinutes: number;
  bufferMinutes: number;
  now: Date;
  count?: number;
}) {
  const { restaurantId, preparationMinutes, bufferMinutes, now, count = 6 } = opts;

  const settings = useQuery({
    queryKey: ['restaurant-pickup-settings', restaurantId],
    enabled: !!restaurantId,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('restaurants').select('*').eq('id', restaurantId!).single();
      if (error) throw error;
      return data as any;
    },
  });

  const s = settings.data;
  const minAdvance = s?.min_advance_minutes ?? 0;
  const maxAdvance = s?.max_advance_minutes ?? 480;
  const buffer = s?.preparation_buffer_minutes ?? bufferMinutes;

  const candidates = useMemo(() => {
    const effectiveNow = new Date(now.getTime() + Math.max(0, minAdvance - preparationMinutes - buffer) * 60_000);
    const n = Math.min(64, Math.max(1, Math.floor(maxAdvance / PICKUP_SLOT_INTERVAL_MINUTES)));
    const limit = now.getTime() + maxAdvance * 60_000;
    return getPickupWindows({ preparationMinutes, bufferMinutes: buffer, now: effectiveNow, count: n })
      .filter((w) => w.start.getTime() <= limit);
  }, [now, minAdvance, maxAdvance, preparationMinutes, buffer]);

  const from = candidates[0]?.value;
  const to = candidates[candidates.length - 1]?.value;

  const usage = useQuery({
    queryKey: ['slot-usage', restaurantId, from, to],
    enabled: !!restaurantId && !!from,
    refetchInterval: 20_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_slot_usage' as any, { _restaurant_id: restaurantId, _from: from, _to: to });
      if (error) throw error;
      return (data || []) as { slot_start: string; order_count: number; workload: number }[];
    },
  });

  const paused = !!s && (s.orders_paused_indefinitely || (s.orders_paused_until && new Date(s.orders_paused_until) > now));

  const windows: SlotWindow[] = useMemo(() => {
    if (paused) return [];
    const maxOrders = s?.max_orders_per_slot ?? 10;
    const maxLoad = s?.max_workload_per_slot ?? 150;
    const map = new Map<number, { c: number; w: number }>();
    (usage.data || []).forEach((u) => map.set(new Date(u.slot_start).getTime(), { c: Number(u.order_count), w: Number(u.workload) }));
    return candidates
      .map((w) => {
        const u = map.get(w.start.getTime()) || { c: 0, w: 0 };
        const fits = u.c + 1 <= maxOrders && u.w + preparationMinutes <= maxLoad;
        return { ...w, orderCount: u.c, remaining: fits ? maxOrders - u.c : 0 };
      })
      .filter((w) => w.remaining > 0)
      .slice(0, count);
  }, [candidates, usage.data, s, paused, preparationMinutes, count]);

  return { windows, paused, isLoading: settings.isLoading || usage.isLoading, refetch: usage.refetch };
}
