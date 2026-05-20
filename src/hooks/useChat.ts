import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeSync } from './useRealtimeSync';
import { encryptMessage, decryptMessage } from '@/lib/e2ee';
import { useMessageNotificationSound } from './useNotificationSound';
import { useNotificationPreferences } from './useNotificationPreferences';
import { toast } from 'sonner';
import { useEffect, useState, useCallback, useRef } from 'react';

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  other_user?: {
    id: string;
    name: string;
    username: string | null;
    avatar_url: string | null;
  };
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  encrypted_message: string;
  encrypted_for_sender?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  reply_to_id?: string | null;
  created_at: string;
  decrypted?: string;
  media_url?: string | null;
  media_type?: string | null;
  media_filename?: string | null;
}

// Fetch & store public key for the current user
export function usePublicKey() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['public-key', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_public_keys')
        .select('public_key')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data?.public_key || null;
    },
    enabled: !!user?.id,
  });

  const queryClient = useQueryClient();

  const upsertKey = useMutation({
    mutationFn: async (publicKey: string) => {
      const { error } = await supabase
        .from('user_public_keys')
        .upsert({ user_id: user!.id, public_key: publicKey }, { onConflict: 'user_id' });
      if (error) throw error;
      return publicKey;
    },
    onSuccess: (publicKey) => {
      // Immediately update the cache so encryption uses the correct new key
      queryClient.setQueryData(['public-key', user!.id], publicKey);
    },
  });

  return { ...query, upsertKey };
}

// Get recipient public key
export function useRecipientPublicKey(userId: string) {
  return useQuery({
    queryKey: ['public-key', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_public_keys')
        .select('public_key')
        .eq('user_id', userId)
        .maybeSingle();
      return data?.public_key || null;
    },
    enabled: !!userId,
  });
}

export function useConversations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Enrich with other user profiles
      const conversations = data as Conversation[];
      const otherUserIds = conversations.map(c =>
        c.user1_id === user!.id ? c.user2_id : c.user1_id
      );

      if (otherUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, username, avatar_url')
          .in('id', otherUserIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        for (const conv of conversations) {
          const otherId = conv.user1_id === user!.id ? conv.user2_id : conv.user1_id;
          conv.other_user = profileMap.get(otherId) as any;
        }

        // Get last message + unread count for each conversation
        for (const conv of conversations) {
          const [{ data: lastMsg }, { count }] = await Promise.all([
            supabase
              .from('messages')
              .select('encrypted_message, encrypted_for_sender, sender_id, created_at')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .neq('sender_id', user!.id)
              .is('delivered_at', null),
          ]);

          conv.unread_count = count || 0;

          if (lastMsg) {
            conv.last_message_at = lastMsg.created_at;
            try {
              const isMine = lastMsg.sender_id === user!.id;
              const ciphertext = isMine && lastMsg.encrypted_for_sender
                ? lastMsg.encrypted_for_sender
                : lastMsg.encrypted_message;
              conv.last_message = await decryptMessage(ciphertext, user!.id);
            } catch {
              conv.last_message = '🔒 Encrypted message';
            }
          }
        }

        // Sort by last message time
        conversations.sort((a, b) => {
          const aTime = a.last_message_at || a.created_at;
          const bTime = b.last_message_at || b.created_at;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });
      }

      return conversations;
    },
    enabled: !!user?.id,
  });

  // Real-time updates on new conversations
  const { play: playMsgSound } = useMessageNotificationSound();
  const { preferences: notifPrefs } = useNotificationPreferences();
  // Track current path to avoid sound when user is viewing the chat
  const pathRef = useRef(window.location.pathname);
  useEffect(() => {
    const update = () => { pathRef.current = window.location.pathname; };
    window.addEventListener('popstate', update);
    const observer = new MutationObserver(update);
    observer.observe(document.querySelector('head') || document.body, { childList: true, subtree: true });
    // Also poll for SPA route changes
    const interval = setInterval(update, 500);
    return () => { window.removeEventListener('popstate', update); observer.disconnect(); clearInterval(interval); };
  }, []);

  const handleChange = useCallback(() => {
    queryClient.refetchQueries({ queryKey: ['conversations', user?.id] });
  }, [queryClient, user?.id]);

  const handleNewMessage = useCallback((payload: any) => {
    queryClient.refetchQueries({ queryKey: ['conversations', user?.id] });
    // Play sound if the message is from someone else and user is NOT on that chat page
    const senderId = payload?.new?.sender_id;
    const convId = payload?.new?.conversation_id;
    if (senderId && senderId !== user?.id) {
      const onChatPage = pathRef.current.includes(`/chat/${convId}`);
      if (!onChatPage && notifPrefs.message_notifications && notifPrefs.sound_enabled) {
        playMsgSound();
      }
    }
  }, [queryClient, user?.id, playMsgSound]);

  useRealtimeSync({
    channelName: `conversations-${user?.id}`,
    table: 'conversations',
    onInsert: handleChange,
    onUpdate: handleChange,
    enabled: !!user?.id,
  });

  // Real-time updates on any message change (for unread counts + last message)
  useRealtimeSync({
    channelName: `conversations-messages-${user?.id}`,
    table: 'messages',
    onInsert: handleNewMessage,
    onUpdate: handleChange,
    onDelete: handleChange,
    enabled: !!user?.id,
  });

  return query;
}

export function useMessages(conversationId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [decryptedMessages, setDecryptedMessages] = useState<Message[]>([]);
  // Cache decrypted text by message id so we don't re-decrypt on every refetch
  const decryptCacheRef = useRef<Map<string, string>>(new Map());

  const query = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversationId,
    staleTime: 30_000,
  });

  useEffect(() => {
    let isActive = true;

    async function decrypt() {
      if (!query.data || !user?.id) {
        if (isActive) setDecryptedMessages([]);
        return;
      }

      const cache = decryptCacheRef.current;
      const results = await Promise.all(
        query.data.map(async (msg) => {
          const cached = cache.get(msg.id);
          if (cached !== undefined) {
            return { ...msg, decrypted: cached };
          }
          try {
            const isMine = msg.sender_id === user.id;
            const ciphertext = isMine && msg.encrypted_for_sender
              ? msg.encrypted_for_sender
              : msg.encrypted_message;
            const decrypted = await decryptMessage(ciphertext, user.id);
            cache.set(msg.id, decrypted);
            return { ...msg, decrypted };
          } catch {
            return { ...msg, decrypted: '🔒 Cannot decrypt' };
          }
        })
      );

      // Prune cache for messages that no longer exist (e.g. unsent)
      if (cache.size > query.data.length + 50) {
        const ids = new Set(query.data.map((m) => m.id));
        for (const k of cache.keys()) if (!ids.has(k)) cache.delete(k);
      }

      if (isActive) {
        setDecryptedMessages(results);
      }
    }

    decrypt();

    return () => {
      isActive = false;
    };
  }, [query.data, user?.id]);

  const removeMessageLocally = useCallback((messageId?: string) => {
    if (!messageId) return;

    queryClient.setQueryData<Message[]>(['messages', conversationId], (current) =>
      current ? current.filter((message) => message.id !== messageId) : current
    );
    setDecryptedMessages((current) => current.filter((message) => message.id !== messageId));
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }, [conversationId, queryClient]);

  const refreshMessages = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }, [queryClient, conversationId]);

  useRealtimeSync({
    channelName: `messages-${conversationId}`,
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`,
    onInsert: refreshMessages,
    onUpdate: refreshMessages,
    onDelete: (payload) => {
      const deletedRow = payload.old as { id?: string } | null;
      const deletedId = deletedRow?.id;
      if (deletedId) {
        removeMessageLocally(deletedId);
        return;
      }
      refreshMessages();
    },
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`message-actions-${conversationId}`);
    channel.on('broadcast', { event: 'message-unsent' }, (payload: any) => {
      removeMessageLocally(payload.payload?.messageId);
    });
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, removeMessageLocally]);

  return {
    ...query,
    messages: decryptedMessages,
    rawCount: query.data?.length ?? 0,
    isFetched: query.isFetched,
  };
}

export function useSendMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      recipientPublicKey,
      senderPublicKey,
      plaintext,
      replyToId,
      mediaUrl,
      mediaType,
      mediaFilename,
    }: {
      conversationId: string;
      recipientPublicKey: string;
      senderPublicKey: string;
      plaintext: string;
      replyToId?: string | null;
      mediaUrl?: string;
      mediaType?: string;
      mediaFilename?: string;
    }) => {
      const [encryptedForRecipient, encryptedForSender] = await Promise.all([
        encryptMessage(plaintext, recipientPublicKey),
        encryptMessage(plaintext, senderPublicKey),
      ]);
      const insertPayload: any = {
        conversation_id: conversationId,
        sender_id: user!.id,
        encrypted_message: encryptedForRecipient,
        encrypted_for_sender: encryptedForSender,
        reply_to_id: replyToId || null,
      };
      if (mediaUrl) insertPayload.media_url = mediaUrl;
      if (mediaType) insertPayload.media_type = mediaType;
      if (mediaFilename) insertPayload.media_filename = mediaFilename;

      const { error } = await supabase.from('messages').insert(insertPayload);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['messages', vars.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: () => {
      toast.error('Failed to send message');
    },
  });
}

export function useDeleteMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user!.id);

      if (error) throw error;
      return { conversationId, messageId };
    },
    onMutate: async ({ messageId, conversationId }) => {
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });

      const previousMessages = queryClient.getQueryData<Message[]>(['messages', conversationId]);
      queryClient.setQueryData<Message[]>(['messages', conversationId], (current) =>
        current ? current.filter((message) => message.id !== messageId) : current
      );

      return { previousMessages };
    },
    onSuccess: ({ conversationId, messageId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      const channel = supabase.channel(`message-actions-${conversationId}`);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'message-unsent',
            payload: { messageId },
          });
          setTimeout(() => supabase.removeChannel(channel), 1000);
        }
      });

      toast.success('Message unsent');
    },
    onError: (_, vars, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', vars.conversationId], context.previousMessages);
      }
      toast.error('Failed to unsend message');
    },
  });
}

export function useStartConversation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      // Ensure consistent ordering for the unique constraint
      const [user1, user2] = [user!.id, otherUserId].sort();

      // Check if conversation exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('user1_id', user1)
        .eq('user2_id', user2)
        .maybeSingle();

      if (existing) return existing.id;

      const { data, error } = await supabase
        .from('conversations')
        .insert({ user1_id: user1, user2_id: user2 })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (err: any) => {
      if (err.message?.includes('violates row-level security')) {
        toast.error('You can only chat with mutual followers');
      } else {
        toast.error('Failed to start conversation');
      }
    },
  });
}
