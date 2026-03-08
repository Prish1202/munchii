import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  order_notifications: boolean;
  social_notifications: boolean;
  message_notifications: boolean;
  earning_notifications: boolean;
  push_notifications: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
}

const DEFAULTS: Omit<NotificationPreferences, 'id' | 'user_id'> = {
  order_notifications: true,
  social_notifications: true,
  message_notifications: true,
  earning_notifications: true,
  push_notifications: true,
  sound_enabled: true,
  vibration_enabled: true,
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create default preferences
        const { data: created, error: insertErr } = await supabase
          .from('notification_preferences')
          .insert({ user_id: user!.id, ...DEFAULTS })
          .select()
          .single();
        if (insertErr) throw insertErr;
        return created as NotificationPreferences;
      }

      return data as NotificationPreferences;
    },
    enabled: !!user?.id,
  });

  const updatePreference = useMutation({
    mutationFn: async (updates: Partial<Omit<NotificationPreferences, 'id' | 'user_id'>>) => {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['notification-preferences', user?.id] });
      const prev = queryClient.getQueryData<NotificationPreferences>(['notification-preferences', user?.id]);
      if (prev) {
        queryClient.setQueryData(['notification-preferences', user?.id], { ...prev, ...updates });
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['notification-preferences', user?.id], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', user?.id] });
    },
  });

  return {
    preferences: query.data ?? { ...DEFAULTS } as NotificationPreferences,
    isLoading: query.isLoading,
    updatePreference,
  };
}
