import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { E2EEKeySetup } from '@/components/customer/E2EEKeySetup';
import { MessageBubble } from '@/components/customer/MessageBubble';
import { TypingIndicator } from '@/components/customer/TypingIndicator';
import { DateSeparator } from '@/components/customer/DateSeparator';
import { OnlineIndicator } from '@/components/customer/OnlineIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages, useSendMessage, useRecipientPublicKey, usePublicKey } from '@/hooks/useChat';
import { useWallet } from '@/hooks/useWallet';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useMessageStatus } from '@/hooks/useMessageStatus';
import { usePresence } from '@/hooks/usePresence';
import { useReactions } from '@/hooks/useReactions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, Loader2, Lock, Coins, X, Reply } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ChatCoinTransfer } from '@/components/customer/ChatCoinTransfer';
import { EmojiBurst } from '@/components/customer/EmojiBurst';

export default function ChatView() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { messages, isLoading, rawCount } = useMessages(conversationId || '');
  const sendMessage = useSendMessage();
  const [text, setText] = useState('');
  const [showCoinTransfer, setShowCoinTransfer] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; text: string } | null>(null);
  const [burstEmoji, setBurstEmoji] = useState('');
  const [burstTrigger, setBurstTrigger] = useState(0);
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

  // Build a map of message id -> decrypted text for reply quotes
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

  // Optimistic messages for instant display
  const [optimisticMessages, setOptimisticMessages] = useState<Array<{
    id: string; text: string; created_at: string; sender_id: string; reply_to_id: string | null;
  }>>([]);

  const hasScrolledRef = useRef(false);

  useEffect(() => {
    if (!messages.length && !optimisticMessages.length) return;
    if (!hasScrolledRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      hasScrolledRef.current = true;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOtherTyping, optimisticMessages]);

  const handleSend = async () => {
    if (!text.trim() || !recipientPublicKey || !senderPublicKey || !conversationId) return;
    const msgText = text.trim();
    const replyToId = replyTo?.id || null;
    setText('');
    setReplyTo(null);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Add optimistic message immediately
    const optimisticId = `optimistic-${Date.now()}`;
    setOptimisticMessages(prev => [...prev, {
      id: optimisticId,
      text: msgText,
      created_at: new Date().toISOString(),
      sender_id: user!.id,
      reply_to_id: replyToId,
    }]);

    // Keep keyboard open on mobile by refocusing immediately + delayed
    textareaRef.current?.focus();
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);

    try {
      await sendMessage.mutateAsync({
        conversationId,
        recipientPublicKey,
        senderPublicKey,
        plaintext: msgText,
        replyToId,
      });
    } finally {
      // Remove optimistic message once real one arrives
      setOptimisticMessages(prev => prev.filter(m => m.id !== optimisticId));
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
    // Trigger emoji burst animation
    setBurstEmoji(emoji);
    setBurstTrigger(prev => prev + 1);
  }, [toggleReaction]);

  const handleReply = (messageId: string, messageText: string) => {
    setReplyTo({ id: messageId, text: messageText });
    textareaRef.current?.focus();
  };

  return (
    <E2EEKeySetup>
      <EmojiBurst emoji={burstEmoji} trigger={burstTrigger} />
      <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
        {/* Chat header */}
        <header className="flex items-center gap-3 px-3 py-2.5 border-b border-border bg-card/80 backdrop-blur-lg safe-area-top shrink-0">
          <button
            onClick={() => navigate('/customer/messages')}
            className="p-1.5 -ml-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
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

        {/* Messages area */}
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
                      onReply={handleReply}
                      replyToText={replyToData?.text || null}
                      replyToIsOwn={replyToData ? replyToData.senderId === user?.id : undefined}
                    />
                  </div>
                );
              })}
              {/* Optimistic messages - shown instantly before server confirms */}
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
                      onReply={handleReply}
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

        {/* Coin transfer inline */}
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

        {/* Reply preview bar */}
        {replyTo && (
          <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-secondary/50 shrink-0">
            <Reply className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-primary">Reply</p>
              <p className="text-xs text-muted-foreground truncate">{replyTo.text}</p>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="p-1 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Input footer */}
        {!recipientPublicKey && !isLoading ? (
          <div className="px-3 py-3 text-center border-t border-border bg-card/80 backdrop-blur-lg safe-area-bottom shrink-0">
            <p className="text-sm text-muted-foreground">
              This user hasn't set up encryption yet.
            </p>
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
                // Prevent keyboard dismiss on mobile when sending
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
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!text.trim() || sendMessage.isPending}
              className="flex-shrink-0 h-9 w-9 rounded-full"
            >
              {sendMessage.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </E2EEKeySetup>
  );
}
