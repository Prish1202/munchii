import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface OwnerDetails {
  id?: string;
  user_id: string;
  pan_number: string | null;
  aadhaar_number: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  full_address: string | null;
}

export interface BankDetails {
  id?: string;
  restaurant_id: string;
  account_holder_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  bank_name: string | null;
  upi_id: string | null;
}

export interface RestaurantWithStatus {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  city: string | null;
  is_active: boolean;
  verification_status: string;
  fssai_license: string | null;
  gst_number: string | null;
  contact_phone: string | null;
  photo_url: string | null;
  area: string | null;
  university_name: string | null;
  opening_hours: string | null;
  closing_hours: string | null;
  created_at: string;
  updated_at: string;
}

export function useOwnerDetails() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['owner-details', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_owner_details' as any)
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as OwnerDetails | null;
    },
    enabled: !!user?.id,
  });
}

export function useSaveOwnerDetails() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (details: Omit<OwnerDetails, 'id' | 'user_id'>) => {
      const { data: existing } = await supabase
        .from('restaurant_owner_details' as any)
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('restaurant_owner_details' as any)
          .update({ ...details, updated_at: new Date().toISOString() })
          .eq('user_id', user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('restaurant_owner_details' as any)
          .insert({ ...details, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-details'] });
      toast.success('Owner details saved');
    },
    onError: () => toast.error('Failed to save owner details'),
  });
}

export function useMyRestaurantFull() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-restaurant-full', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const { data: compliance } = await supabase
        .from('restaurant_compliance')
        .select('fssai_license, gst_number')
        .eq('restaurant_id', data.id)
        .maybeSingle();

      return {
        ...(data as any),
        fssai_license: compliance?.fssai_license ?? null,
        gst_number: compliance?.gst_number ?? null,
      } as RestaurantWithStatus;
    },
    enabled: !!user?.id,
  });
}

export function useSaveRestaurantDetails() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (details: {
      name: string;
      address: string;
      area: string;
      city: string;
      contact_phone: string;
      fssai_license: string;
      gst_number?: string;
      university_name?: string;
      opening_hours: string;
      closing_hours: string;
    }) => {
      const { fssai_license, gst_number, ...restaurantFields } = details;

      const { data: existing } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user!.id)
        .maybeSingle();

      let restaurantId: string;
      if (existing) {
        const { error } = await supabase
          .from('restaurants')
          .update({
            ...restaurantFields,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('id', existing.id);
        if (error) throw error;
        restaurantId = existing.id;
      } else {
        const { data, error } = await supabase
          .from('restaurants')
          .insert({
            owner_id: user!.id,
            ...restaurantFields,
            is_active: false,
            verification_status: 'draft',
          } as any)
          .select('id')
          .single();
        if (error) throw error;
        restaurantId = data.id;
      }

      // Upsert compliance fields into private table
      const { error: cErr } = await supabase
        .from('restaurant_compliance')
        .upsert({
          restaurant_id: restaurantId,
          fssai_license,
          gst_number: gst_number || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'restaurant_id' });
      if (cErr) throw cErr;

      return restaurantId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-restaurant-full'] });
      queryClient.invalidateQueries({ queryKey: ['my-restaurant'] });
      toast.success('Restaurant details saved');
    },
    onError: () => toast.error('Failed to save restaurant details'),
  });
}

export function useBankDetails(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['bank-details', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_bank_details' as any)
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as BankDetails | null;
    },
    enabled: !!restaurantId,
  });
}

export function useSaveBankDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ restaurantId, details }: {
      restaurantId: string;
      details: Omit<BankDetails, 'id' | 'restaurant_id'>;
    }) => {
      const { data: existing } = await supabase
        .from('restaurant_bank_details' as any)
        .select('id')
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('restaurant_bank_details' as any)
          .update({ ...details, updated_at: new Date().toISOString() })
          .eq('restaurant_id', restaurantId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('restaurant_bank_details' as any)
          .insert({ ...details, restaurant_id: restaurantId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-details'] });
      toast.success('Bank details saved');
    },
    onError: () => toast.error('Failed to save bank details'),
  });
}

export function useSubmitForVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (restaurantId: string) => {
      const { error } = await supabase
        .from('restaurants')
        .update({ verification_status: 'pending' } as any)
        .eq('id', restaurantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-restaurant-full'] });
      queryClient.invalidateQueries({ queryKey: ['my-restaurant'] });
      toast.success('Application submitted for verification!');
    },
    onError: () => toast.error('Failed to submit application'),
  });
}
