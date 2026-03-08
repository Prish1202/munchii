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
              .is('read_at', null),
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
    enabled: !!user?.id,
  });

  return query;
}

export function useMessages(conversationId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [decryptedMessages, setDecryptedMessages] = useState<Message[]>([]);

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
  });

  // Decrypt messages when data changes
  useEffect(() => {
    async function decrypt() {
      if (!query.data || !user?.id) return;
      const results: Message[] = [];
        for (const msg of query.data) {
          try {
            // For own messages, decrypt the sender copy; for received, decrypt the recipient copy
            const isMine = msg.sender_id === user.id;
            const ciphertext = isMine && msg.encrypted_for_sender
              ? msg.encrypted_for_sender
              : msg.encrypted_message;
            const decrypted = await decryptMessage(ciphertext, user.id);
            results.push({ ...msg, decrypted });
          } catch {
            results.push({ ...msg, decrypted: '🔒 Cannot decrypt' });
          }
        }
      setDecryptedMessages(results);
    }
    decrypt();
  }, [query.data, user?.id]);

  // Real-time new messages
  const handleNewMessage = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }, [queryClient, conversationId]);

  useRealtimeSync({
    channelName: `messages-${conversationId}`,
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`,
    onInsert: handleNewMessage,
    onUpdate: handleNewMessage,
    enabled: !!conversationId,
  });

  return { ...query, messages: decryptedMessages };
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
    }: {
      conversationId: string;
      recipientPublicKey: string;
      senderPublicKey: string;
      plaintext: string;
    }) => {
      // Encrypt for recipient and sender separately so both can decrypt
      const [encryptedForRecipient, encryptedForSender] = await Promise.all([
        encryptMessage(plaintext, recipientPublicKey),
        encryptMessage(plaintext, senderPublicKey),
      ]);
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user!.id,
        encrypted_message: encryptedForRecipient,
        encrypted_for_sender: encryptedForSender,
      });
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
