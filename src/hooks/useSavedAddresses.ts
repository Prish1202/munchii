import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SavedAddress {
  id: string;
  label: string;
  house: string;
  area: string | null;
  landmark: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;
  city: string | null;
  formatted: string | null;
  latitude: number;
  longitude: number;
}

export type NewAddress = Omit<SavedAddress, 'id'>;

export function useSavedAddresses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['saved-addresses', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('user_addresses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as SavedAddress[];
    },
  });
}

export function useAddAddress() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: NewAddress) => {
      const { data, error } = await (supabase as any)
        .from('user_addresses').insert({ ...a, user_id: user!.id }).select().single();
      if (error) throw error;
      return data as SavedAddress;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-addresses'] }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('user_addresses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-addresses'] }),
  });
}
