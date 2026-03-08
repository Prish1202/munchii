import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeSync } from './useRealtimeSync';
import { useCallback } from 'react';

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export function useReactions(conversationId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['reactions', conversationId],
    queryFn: async () => {
      // Get all message IDs in this conversation first, then reactions
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId);

      if (!messages?.length) return [] as Reaction[];

      const msgIds = messages.map((m) => m.id);
      const { data, error } = await supabase
        .from('message_reactions')
        .select('*')
        .in('message_id', msgIds);

      if (error) throw error;
      return (data || []) as Reaction[];
    },
    enabled: !!conversationId,
  });

  const handleChange = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['reactions', conversationId] });
  }, [queryClient, conversationId]);

  useRealtimeSync({
    channelName: `reactions-${conversationId}`,
    table: 'message_reactions',
    onInsert: handleChange,
    onDelete: handleChange,
    enabled: !!conversationId,
  });

  const toggleReaction = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check if user already has ANY reaction on this message
      const { data: existing } = await supabase
        .from('message_reactions')
        .select('id, emoji')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // If same emoji, remove it (toggle off)
        if (existing.emoji === emoji) {
          await supabase.from('message_reactions').delete().eq('id', existing.id);
        } else {
          // Different emoji: remove old, add new (swap)
          await supabase.from('message_reactions').delete().eq('id', existing.id);
          await supabase.from('message_reactions').insert({
            message_id: messageId,
            user_id: user.id,
            emoji,
          });
        }
      } else {
        await supabase.from('message_reactions').insert({
          message_id: messageId,
          user_id: user.id,
          emoji,
        });
      }
    },
    onSuccess: () => handleChange(),
  });

  return { reactions: query.data || [], isLoading: query.isLoading, toggleReaction };
}
