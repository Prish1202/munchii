import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Marks messages as delivered/read for the current user in a conversation.
 * Only updates messages sent by the OTHER user (not own messages).
 */
export function useMessageStatus(conversationId: string, messages: Array<{ id: string; sender_id: string; delivered_at?: string | null; read_at?: string | null }>) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Mark undelivered messages as delivered when they appear
  useEffect(() => {
    if (!user?.id || !conversationId || !messages.length) return;

    const undelivered = messages.filter(
      (m) => m.sender_id !== user.id && !m.delivered_at
    );

    if (undelivered.length === 0) return;

    const ids = undelivered.map((m) => m.id);
    supabase
      .from('messages')
      .update({ delivered_at: new Date().toISOString() } as any)
      .in('id', ids)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      });
  }, [messages, user?.id, conversationId, queryClient]);

  // Mark as read (call when chat is visible/focused)
  const markAsRead = useCallback(() => {
    if (!user?.id || !conversationId || !messages.length) return;

    const unread = messages.filter(
      (m) => m.sender_id !== user.id && !m.read_at
    );

    if (unread.length === 0) return;

    const ids = unread.map((m) => m.id);
    supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() } as any)
      .in('id', ids)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      });
  }, [messages, user?.id, conversationId, queryClient]);

  return { markAsRead };
}
