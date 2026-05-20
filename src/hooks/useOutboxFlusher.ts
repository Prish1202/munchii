import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { encryptMessage } from '@/lib/e2ee';
import { listOutbox, removeOutbox, incrementAttempts, type OutboxMessage } from '@/lib/chatOutbox';
import { useQueryClient } from '@tanstack/react-query';

let isFlushing = false;
const listeners = new Set<(items: OutboxMessage[]) => void>();
let cached: OutboxMessage[] = [];

async function refresh() {
  cached = await listOutbox();
  listeners.forEach((l) => l(cached));
}

export function notifyOutboxChanged() {
  refresh();
}

export function useOutboxItems() {
  const [items, setItems] = useState<OutboxMessage[]>(cached);
  useEffect(() => {
    const l = (it: OutboxMessage[]) => setItems(it);
    listeners.add(l);
    refresh();
    return () => { listeners.delete(l); };
  }, []);
  return items;
}

export function useOutboxFlusher() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const flush = useCallback(async () => {
    if (isFlushing || !user?.id || !navigator.onLine) return;
    isFlushing = true;
    try {
      const items = await listOutbox();
      for (const item of items) {
        if (item.senderId !== user.id) continue;
        if (item.attempts > 5) continue;
        try {
          // Fetch keys at flush-time (in case they changed)
          const [{ data: recipKey }, { data: senderKey }] = await Promise.all([
            supabase.from('user_public_keys').select('public_key').eq('user_id', item.recipientUserId).maybeSingle(),
            supabase.from('user_public_keys').select('public_key').eq('user_id', user.id).maybeSingle(),
          ]);
          if (!recipKey?.public_key || !senderKey?.public_key) {
            await incrementAttempts(item.id);
            continue;
          }
          const [encForRecip, encForSender] = await Promise.all([
            encryptMessage(item.plaintext, recipKey.public_key),
            encryptMessage(item.plaintext, senderKey.public_key),
          ]);
          const { error } = await supabase.from('messages').insert({
            conversation_id: item.conversationId,
            sender_id: user.id,
            encrypted_message: encForRecip,
            encrypted_for_sender: encForSender,
            reply_to_id: item.replyToId,
          });
          if (error) {
            await incrementAttempts(item.id);
            continue;
          }
          await removeOutbox(item.id);
        } catch {
          await incrementAttempts(item.id);
        }
      }
      await refresh();
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } finally {
      isFlushing = false;
    }
  }, [user?.id, queryClient]);

  useEffect(() => {
    if (!user?.id) return;
    // Flush on mount + when coming online + periodically as fallback
    flush();
    const onOnline = () => flush();
    window.addEventListener('online', onOnline);
    const interval = setInterval(() => { if (navigator.onLine) flush(); }, 15000);
    return () => {
      window.removeEventListener('online', onOnline);
      clearInterval(interval);
    };
  }, [user?.id, flush]);

  return { flush };
}
