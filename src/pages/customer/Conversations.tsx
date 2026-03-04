import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { E2EEKeySetup } from '@/components/customer/E2EEKeySetup';
import { useConversations } from '@/hooks/useChat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Conversations() {
  const { data: conversations, isLoading } = useConversations();

  return (
    <DashboardLayout>
      <E2EEKeySetup>
      <div className="max-w-lg mx-auto pb-28 md:pb-6 space-y-4">
        <h1 className="font-display font-bold text-2xl">Messages</h1>
        <p className="text-sm text-muted-foreground">
          🔒 End-to-end encrypted. Only you and the recipient can read these messages.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No conversations yet</p>
            <p className="text-muted-foreground text-xs">Follow someone and they follow you back to start chatting</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                to={`/customer/chat/${conv.id}`}
                className="flex items-center gap-3 bg-card rounded-xl border border-border p-3 hover:border-primary/30 transition-colors"
              >
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-display font-semibold">
                    {conv.other_user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="font-semibold text-sm truncate">
                      {conv.other_user?.name || 'User'}
                    </p>
                    {conv.last_message_at && (
                      <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                        {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  {conv.other_user?.username && (
                    <p className="text-xs text-muted-foreground">@{conv.other_user.username}</p>
                  )}
                  {conv.last_message && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {conv.last_message.substring(0, 60)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      </E2EEKeySetup>
    </DashboardLayout>
  );
}
