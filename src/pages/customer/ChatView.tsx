import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { E2EEKeySetup } from '@/components/customer/E2EEKeySetup';
import { MessageBubble } from '@/components/customer/MessageBubble';
import { TypingIndicator } from '@/components/customer/TypingIndicator';
import { DateSeparator } from '@/components/customer/DateSeparator';
import { OnlineIndicator } from '@/components/customer/OnlineIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages, useSendMessage, useRecipientPublicKey, usePublicKey, useConversations, useDeleteMessage } from '@/hooks/useChat';
import { useWallet } from '@/hooks/useWallet';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useMessageStatus } from '@/hooks/useMessageStatus';
import { usePresence } from '@/hooks/usePresence';
import { useReactions } from '@/hooks/useReactions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, Loader2, Lock, Coins, X, Reply, Forward } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ChatCoinTransfer } from '@/components/customer/ChatCoinTransfer';
import { EmojiBurst } from '@/components/customer/EmojiBurst';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ChatView() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { messages, isLoading, rawCount } = useMessages(conversationId || '');
  const { data: allConversations } = useConversations();
  const sendMessage = useSendMessage();
  const deleteMessage = useDeleteMessage();
  const [text, setText] = useState('');
  const [showCoinTransfer, setShowCoinTransfer] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; text: string } | null>(null);
  const [forwardMessage, setForwardMessage] = useState<{ id: string; text: string } | null>(null);
  const [isForwarding, setIsForwarding] = useState(false);
  const [burstEmoji, setBurstEmoji] = useState('');
  const [burstTrigger, setBurstTrigger] = useState(0);
  const [burstOrigin, setBurstOrigin] = useState<{ x: number; y: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { data: wallet } = useWallet();
  const { isOtherTyping, sendTyping } = useTypingIndicator(conversationId || '');

  const { data: conversation } = useQuery({
    queryKey: ['conversation-detail', conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId!)
        .single();
      return data;
    },
    enabled: !!conversationId,
  });

  const otherUserId = conversation
    ? conversation.user1_id === user?.id ? conversation.user2_id : conversation.user1_id
    : '';

  const { data: otherProfile } = useQuery({
    queryKey: ['profile', otherUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .eq('id', otherUserId)
        .single();
      return data;
    },
    enabled: !!otherUserId,
  });

  const { data: recipientPublicKey } = useRecipientPublicKey(otherUserId);
  const { data: senderPublicKey } = usePublicKey();

  const { isOnline } = usePresence(otherUserId || undefined);
  const { reactions, toggleReaction } = useReactions(conversationId || '');
  const { markAsRead } = useMessageStatus(conversationId || '', messages);

  const messageMap = useMemo(() => {
    const map = new Map<string, { text: string; senderId: string }>();
    for (const msg of messages) {
      map.set(msg.id, { text: msg.decrypted || '🔒', senderId: msg.sender_id });
    }
    return map;
  }, [messages]);

  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  const [optimisticMessages, setOptimisticMessages] = useState<Array<{
    id: string; text: string; created_at: string; sender_id: string; reply_to_id: string | null;
  }>>([]);

  const hasScrolledRef = useRef(false);

  useEffect(() => {
    if (!messages.length && !optimisticMessages.length) return;
    if (!hasScrolledRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
      hasScrolledRef.current = true;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOtherTyping, optimisticMessages]);

  useEffect(() => {
    if (optimisticMessages.length === 0) return;
    const realTexts = new Set(messages.filter(m => m.sender_id === user?.id).map(m => m.decrypted));
    setOptimisticMessages(prev => prev.filter(opt => !realTexts.has(opt.text)));
  }, [messages, optimisticMessages.length, user?.id]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase.channel(`emoji-burst-${conversationId}`);
    channel.on('broadcast', { event: 'emoji-burst' }, (payload: any) => {
      const { emoji, messageId, senderId } = payload.payload || {};
      if (senderId === user?.id) return;
      const el = document.querySelector(`[data-message-id="${messageId}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        setBurstOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      } else {
        setBurstOrigin(null);
      }
      setBurstEmoji(emoji);
      setBurstTrigger(prev => prev + 1);
    });
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, user?.id]);

  const handleSend = async () => {
    if (!text.trim() || !recipientPublicKey || !senderPublicKey || !conversationId) return;
    const msgText = text.trim();
    const replyToId = replyTo?.id || null;
    setText('');
    setReplyTo(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    setOptimisticMessages(prev => [...prev, {
      id: `optimistic-${Date.now()}`,
      text: msgText,
      created_at: new Date().toISOString(),
      sender_id: user!.id,
      reply_to_id: replyToId,
    }]);

    textareaRef.current?.focus();
    requestAnimationFrame(() => textareaRef.current?.focus());
    setTimeout(() => textareaRef.current?.focus(), 50);

    try {
      await sendMessage.mutateAsync({
        conversationId,
        recipientPublicKey,
        senderPublicKey,
        plaintext: msgText,
        replyToId,
      });
    } catch {
      setOptimisticMessages(prev => prev.filter(m => m.text !== msgText));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    sendTyping();
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  const handleToggleReaction = useCallback((messageId: string, emoji: string) => {
    toggleReaction.mutate({ messageId, emoji });
  }, [toggleReaction]);

  const handleBurstReaction = useCallback((messageId: string, emoji: string) => {
    const el = document.querySelector(`[data-message-id="${messageId}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setBurstOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    } else {
      setBurstOrigin(null);
    }
    setBurstEmoji(emoji);
    setBurstTrigger(prev => prev + 1);

    if (conversationId) {
      const channel = supabase.channel(`emoji-burst-${conversationId}`);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'emoji-burst',
            payload: { emoji, messageId, senderId: user?.id },
          });
          setTimeout(() => supabase.removeChannel(channel), 1000);
        }
      });
    }
  }, [conversationId, user?.id]);

  const handleReply = (messageId: string, messageText: string) => {
    setReplyTo({ id: messageId, text: messageText });
    textareaRef.current?.focus();
  };

  const handleForward = (messageId: string, messageText: string) => {
    setForwardMessage({ id: messageId, text: messageText });
  };

  const handleUnsend = async (messageId: string) => {
    if (!conversationId) return;
    if (!window.confirm('Unsend this message?')) return;
    await deleteMessage.mutateAsync({ messageId, conversationId });
  };

  const handleForwardSelect = async (targetConversationId: string, targetUserId: string) => {
    if (!senderPublicKey || !forwardMessage) return;
    setIsForwarding(true);
    try {
      const { data: publicKeyRow, error } = await supabase
        .from('user_public_keys')
        .select('public_key')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error) throw error;
      if (!publicKeyRow?.public_key) {
        toast.error('This user has not set up encryption yet');
        return;
      }

      await sendMessage.mutateAsync({
        conversationId: targetConversationId,
        recipientPublicKey: publicKeyRow.public_key,
        senderPublicKey,
        plaintext: `↪️ ${forwardMessage.text}`,
      });

      toast.success('Message forwarded');
      setForwardMessage(null);
    } catch {
      toast.error('Failed to forward message');
    } finally {
      setIsForwarding(false);
    }
  };

  const forwardTargets = (allConversations || []).filter((conv) => conv.id !== conversationId);

  return (
    <E2EEKeySetup>
      <EmojiBurst emoji={burstEmoji} trigger={burstTrigger} originX={burstOrigin?.x} originY={burstOrigin?.y} />
      <motion.div
        className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <header className="flex items-center gap-3 px-3 py-2.5 border-b border-border bg-card/80 backdrop-blur-lg safe-area-top shrink-0">
          <button
            onClick={() => navigate('/customer/messages')}
            className="p-1.5 -ml-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="relative">
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {otherProfile?.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5">
              <OnlineIndicator isOnline={isOnline} size="sm" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{otherProfile?.name || 'Loading...'}</p>
            {isOtherTyping ? (
              <p className="text-xs text-primary animate-pulse">typing...</p>
            ) : isOnline ? (
              <p className="text-xs text-primary">online</p>
            ) : otherProfile?.username ? (
              <p className="text-xs text-muted-foreground">@{otherProfile.username}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
            <Lock className="w-3 h-3" />
            E2EE
          </div>
        </header>

        <div className="flex-1 overscroll-contain overflow-y-auto px-3 py-4 space-y-3 scrollbar-hide">
          {isLoading || (rawCount > 0 && messages.length === 0) ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 && optimisticMessages.length === 0 ? (
            <div className="text-center py-12">
              <Lock className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Send your first encrypted message</p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const replyToData = (msg as any).reply_to_id ? messageMap.get((msg as any).reply_to_id) : null;
                const msgDate = new Date(msg.created_at).toDateString();
                const prevDate = idx > 0 ? new Date(messages[idx - 1].created_at).toDateString() : null;
                const showDate = idx === 0 || msgDate !== prevDate;
                return (
                  <div key={msg.id}>
                    {showDate && <DateSeparator date={msg.created_at} />}
                    <MessageBubble
                      messageId={msg.id}
                      isOwn={msg.sender_id === user?.id}
                      text={msg.decrypted || '🔒'}
                      time={msg.created_at}
                      deliveredAt={msg.delivered_at}
                      readAt={msg.read_at}
                      reactions={reactions.filter((r) => r.message_id === msg.id)}
                      currentUserId={user?.id || ''}
                      onToggleReaction={handleToggleReaction}
                      onBurstReaction={handleBurstReaction}
                      onReply={handleReply}
                      onForward={handleForward}
                      onUnsend={msg.sender_id === user?.id ? handleUnsend : undefined}
                      replyToText={replyToData?.text || null}
                      replyToIsOwn={replyToData ? replyToData.senderId === user?.id : undefined}
                    />
                  </div>
                );
              })}
              {optimisticMessages.map((msg) => {
                const replyToData = msg.reply_to_id ? messageMap.get(msg.reply_to_id) : null;
                return (
                  <div key={msg.id}>
                    <MessageBubble
                      messageId={msg.id}
                      isOwn={true}
                      text={msg.text}
                      time={msg.created_at}
                      deliveredAt={null}
                      readAt={null}
                      reactions={[]}
                      currentUserId={user?.id || ''}
                      onToggleReaction={handleToggleReaction}
                      onBurstReaction={handleBurstReaction}
                      onReply={handleReply}
                      onForward={handleForward}
                      replyToText={replyToData?.text || null}
                      replyToIsOwn={replyToData ? replyToData.senderId === user?.id : undefined}
                    />
                  </div>
                );
              })}
            </>
          )}
          {isOtherTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {showCoinTransfer && otherProfile && (
          <div className="px-3 shrink-0">
            <ChatCoinTransfer
              recipientId={otherUserId}
              recipientName={otherProfile.name}
              recipientUsername={otherProfile.username}
              availableCoins={wallet?.total_coins || 0}
              onClose={() => setShowCoinTransfer(false)}
              onTransferSuccess={async (coins) => {
                if (!recipientPublicKey || !senderPublicKey || !conversationId) return;
                const funMessages = [
                  `✨ Sent ${coins} coins! Treat yourself 🎁`,
                  `💸 ${coins} coins just flew your way! 🚀`,
                  `🪙 Here's ${coins} coins for you! Enjoy 🎉`,
                  `💰 ${coins} coins incoming! Spend wisely 😄`,
                ];
                const msg = funMessages[Math.floor(Math.random() * funMessages.length)];
                await sendMessage.mutateAsync({
                  conversationId,
                  recipientPublicKey,
                  senderPublicKey,
                  plaintext: `__COIN_TRANSFER__${coins}__${msg}`,
                });
              }}
            />
          </div>
        )}

        {forwardMessage && (
          <div className="border-t border-border bg-card/95 backdrop-blur-lg px-3 py-3 shrink-0 space-y-3 max-h-60 overflow-y-auto">
            <div className="flex items-center gap-2">
              <Forward className="w-4 h-4 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Forward message</p>
                <p className="text-xs text-muted-foreground truncate">{forwardMessage.text}</p>
              </div>
              <button onClick={() => setForwardMessage(null)} className="p-1 rounded-full hover:bg-secondary transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            {forwardTargets.length === 0 ? (
              <p className="text-xs text-muted-foreground">No other conversations available yet.</p>
            ) : (
              <div className="space-y-2">
                {forwardTargets.map((conv) => {
                  const targetId = conv.user1_id === user?.id ? conv.user2_id : conv.user1_id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleForwardSelect(conv.id, targetId)}
                      disabled={isForwarding}
                      className="w-full flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2.5 text-left hover:bg-secondary transition-colors disabled:opacity-60"
                    >
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {conv.other_user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{conv.other_user?.name || 'User'}</p>
                        {conv.other_user?.username && <p className="text-xs text-muted-foreground">@{conv.other_user.username}</p>}
                      </div>
                      {isForwarding ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Forward className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {replyTo && (
          <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-secondary/50 shrink-0">
            <Reply className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-primary">Reply</p>
              <p className="text-xs text-muted-foreground truncate">{replyTo.text}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-1 rounded-full hover:bg-secondary transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {!recipientPublicKey && !isLoading ? (
          <div className="px-3 py-3 text-center border-t border-border bg-card/80 backdrop-blur-lg safe-area-bottom shrink-0">
            <p className="text-sm text-muted-foreground">This user hasn't set up encryption yet.</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-border bg-card/80 backdrop-blur-lg safe-area-bottom shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 h-9 w-9 rounded-xl"
              onClick={() => setShowCoinTransfer(!showCoinTransfer)}
              title="Send coins"
            >
              <Coins className="w-5 h-5 text-primary" />
            </Button>
            <Textarea
              ref={textareaRef}
              placeholder="Type a message..."
              value={text}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={(e) => {
                if (sendMessage.isPending) {
                  e.preventDefault();
                  e.target.focus();
                }
              }}
              inputMode="text"
              enterKeyHint="send"
              className="flex-1 rounded-2xl bg-secondary border-0 focus-visible:ring-1 resize-none min-h-[38px] max-h-[120px] py-2 px-3.5 text-sm"
              maxLength={2000}
              rows={1}
            />
            <Button size="icon" onClick={handleSend} disabled={!text.trim() || sendMessage.isPending} className="flex-shrink-0 h-9 w-9 rounded-full">
              {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        )}
      </motion.div>
    </E2EEKeySetup>
  );
}

