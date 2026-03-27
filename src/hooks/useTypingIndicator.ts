import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getChatSettings } from '@/pages/customer/ChatSettings';

export function useTypingIndicator(conversationId: string) {
  const { user } = useAuth();
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastBroadcastRef = useRef(0);

  useEffect(() => {
    if (!conversationId || !user?.id) return;

    const settings = getChatSettings();

    const channel = supabase.channel(`typing-${conversationId}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.user_id !== user.id) {
          // If user has hidden typing indicators, don't show others' typing
          if (settings.hideTypingIndicator) return;
          setIsOtherTyping(true);
          clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      clearTimeout(timeoutRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, user?.id]);

  const sendTyping = useCallback(() => {
    // If user has hidden typing indicators, don't broadcast typing
    const settings = getChatSettings();
    if (settings.hideTypingIndicator) return;

    const now = Date.now();
    if (now - lastBroadcastRef.current < 2000) return;
    lastBroadcastRef.current = now;

    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user?.id },
    });
  }, [user?.id]);

  return { isOtherTyping, sendTyping };
}
