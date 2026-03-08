import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { E2EEKeySetup } from '@/components/customer/E2EEKeySetup';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages, useSendMessage, useRecipientPublicKey, usePublicKey } from '@/hooks/useChat';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, Loader2, Lock, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChatCoinTransfer } from '@/components/customer/ChatCoinTransfer';

export default function ChatView() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const { messages, isLoading } = useMessages(conversationId || '');
  const sendMessage = useSendMessage();
  const [text, setText] = useState('');
  const [showCoinTransfer, setShowCoinTransfer] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: wallet } = useWallet();

  // Get conversation details to find the other user
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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !recipientPublicKey || !senderPublicKey || !conversationId) return;
    const msgText = text.trim();
    setText('');
    await sendMessage.mutateAsync({
      conversationId,
      recipientPublicKey,
      senderPublicKey,
      plaintext: msgText,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <DashboardLayout>
      <E2EEKeySetup>
      <div className="max-w-lg mx-auto flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <Link to="/customer/messages" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {otherProfile?.name?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{otherProfile?.name || 'Loading...'}</p>
            {otherProfile?.username && (
              <p className="text-xs text-muted-foreground">@{otherProfile.username}</p>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            E2EE
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 scrollbar-hide">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <Lock className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Send your first encrypted message</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm',
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-secondary text-secondary-foreground rounded-bl-md'
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.decrypted || '🔒'}</p>
                    <p className={cn(
                      'text-[10px] mt-1',
                      isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
                    )}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Coin transfer inline */}
        {showCoinTransfer && otherProfile && (
          <ChatCoinTransfer
            recipientId={otherUserId}
            recipientName={otherProfile.name}
            recipientUsername={otherProfile.username}
            availableCoins={wallet?.total_coins || 0}
            onClose={() => setShowCoinTransfer(false)}
          />
        )}

        {/* Input */}
        {!recipientPublicKey && !isLoading ? (
          <div className="py-3 text-center">
            <p className="text-sm text-muted-foreground">
              This user hasn't set up encryption yet. They need to open the chat feature first.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-3 border-t border-border">
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              onClick={() => setShowCoinTransfer(!showCoinTransfer)}
              title="Send coins"
            >
              <Coins className="w-5 h-5 text-primary" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              maxLength={2000}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!text.trim() || sendMessage.isPending}
              className="flex-shrink-0"
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
    </DashboardLayout>
  );
}
