import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Marks messages as READ for the current user in a specific conversation.
 * Call this when the user opens/views a specific chat.
 */
export function useMessageStatus(conversationId: string, messages: Array<{ id: string; sender_id: string; delivered_at?: string | null; read_at?: string | null }>) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
      .update({ read_at: new Date().toISOString(), delivered_at: new Date().toISOString() } as any)
      .in('id', ids)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      });
  }, [messages, user?.id, conversationId, queryClient]);

  return { markAsRead };
}

/**
 * Marks ALL undelivered messages across conversations as DELIVERED.
 * Call this when the user opens the conversations/messages list page.
 */
export function useMarkDelivered(conversations: Array<{ id: string }> | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id || !conversations?.length) return;

    const convIds = conversations.map((c) => c.id);

    // Find all undelivered messages sent by others in user's conversations
    supabase
      .from('messages')
      .update({ delivered_at: new Date().toISOString() } as any)
      .in('conversation_id', convIds)
      .neq('sender_id', user.id)
      .is('delivered_at', null)
      .then(({ error }) => {
        if (!error) {
          // Invalidate to refresh status for senders
          convIds.forEach((id) => {
            queryClient.invalidateQueries({ queryKey: ['messages', id] });
          });
        }
      });
  }, [user?.id, conversations, queryClient]);
}
