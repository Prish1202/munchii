import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRegisteredCities() {
  return useQuery({
    queryKey: ['registered-cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('city')
        .eq('is_active', true)
        .not('city', 'is', null);

      if (error) throw error;

      // Deduplicate cities
      const cities = [...new Set((data || []).map(r => r.city!).filter(Boolean))];
      return cities.sort();
    },
    staleTime: 5 * 60_000,
  });
}
