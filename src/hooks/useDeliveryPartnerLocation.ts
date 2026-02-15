import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useDeliveryPartnerLocation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial status
  useEffect(() => {
    if (!user?.id) return;

    const fetch = async () => {
      const { data } = await supabase
        .from('delivery_partner_locations')
        .select('is_online')
        .eq('user_id', user.id)
        .maybeSingle();

      setIsOnline(data?.is_online ?? false);
      setIsLoading(false);
    };
    fetch();
  }, [user?.id]);

  const toggleOnline = useCallback(async (online: boolean) => {
    if (!user?.id) return;
    setIsLoading(true);

    // Detect city via reverse geocode when going online
    let city: string | null = null;
    let lat: number | null = null;
    let lng: number | null = null;

    if (online && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;

        // Reverse geocode for city
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address;
          city = addr?.city || addr?.town || addr?.village || addr?.state_district || null;
        } catch {}
      } catch {
        // GPS failed, still allow going online
      }
    }

    const payload: Record<string, any> = {
      user_id: user.id,
      is_online: online,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (lat !== null) payload.current_lat = lat;
    if (lng !== null) payload.current_lng = lng;
    if (city) payload.city = city;

    const { error } = await supabase
      .from('delivery_partner_locations')
      .upsert(payload as any, { onConflict: 'user_id' });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setIsOnline(online);
      toast({
        title: online ? 'You are online' : 'You are offline',
        description: online ? 'You will now receive delivery requests.' : 'You will not receive new assignments.',
      });
    }
    setIsLoading(false);
  }, [user?.id, toast]);

  const updateGPS = useCallback(async (lat: number, lng: number) => {
    if (!user?.id) return;
    await supabase
      .from('delivery_partner_locations')
      .update({ current_lat: lat, current_lng: lng, last_seen_at: new Date().toISOString() })
      .eq('user_id', user.id);
  }, [user?.id]);

  return { isOnline, isLoading, toggleOnline, updateGPS };
}
