import { useEffect, useRef, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PresenceState {
  user_id: string;
  online_at: string;
}

/**
 * Tracks own presence and returns the set of online user IDs.
 * Works for both single-user and multi-user monitoring.
 */
export function usePresence(otherUserId?: string) {
  const { user } = useAuth();
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel('presence:global', {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>();
        setOnlineIds(new Set(Object.keys(state)));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]);

  const isOnline = useMemo(
    () => (otherUserId ? onlineIds.has(otherUserId) : false),
    [onlineIds, otherUserId]
  );

  return { isOnline, onlineIds };
}
