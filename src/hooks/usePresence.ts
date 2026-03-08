import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PresenceState {
  user_id: string;
  online_at: string;
}

/**
 * Tracks own presence and monitors another user's online status.
 * Uses Supabase Realtime Presence (no DB writes).
 */
export function usePresence(otherUserId?: string) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel('presence:global', {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        if (!otherUserId) return;
        const state = channel.presenceState<PresenceState>();
        const entries = state[otherUserId];
        if (entries && entries.length > 0) {
          setIsOnline(true);
          setLastSeen(entries[0].online_at);
        } else {
          setIsOnline(false);
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key === otherUserId) {
          setIsOnline(false);
          setLastSeen(new Date().toISOString());
        }
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
  }, [user?.id, otherUserId]);

  return { isOnline, lastSeen };
}
