import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { E2EEKeySetup } from '@/components/customer/E2EEKeySetup';
import { useConversations, useStartConversation } from '@/hooks/useChat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageSquare, Loader2, Search, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Conversations() {
  const { data: conversations, isLoading } = useConversations();
  const startConversation = useStartConversation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState<{ id: string; name: string; username: string } | null>(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    const q = search.trim().replace('@', '');
    if (q.length < 3) return;
    setSearching(true);
    setNotFound(false);
    setSearchResult(null);
    const { data } = await supabase
      .from('profiles')
      .select('id, name, username')
      .eq('username', q)
      .maybeSingle();
    if (data) {
      setSearchResult(data as any);
    } else {
      setNotFound(true);
    }
    setSearching(false);
  };

  const handleStartChat = async (userId: string) => {
    try {
      const convId = await startConversation.mutateAsync(userId);
      navigate(`/customer/chat/${convId}`);
    } catch {
      // error handled in hook
    }
  };

  return (
    <DashboardLayout>
      <E2EEKeySetup>
        <div className="max-w-lg mx-auto pb-28 md:pb-6 space-y-4">
          <h1 className="font-display font-bold text-2xl">Messages</h1>
          <p className="text-sm text-muted-foreground">
            🔒 End-to-end encrypted. Only you and the recipient can read these messages.
          </p>

          {/* Search by username */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by @username"
                value={search}
                onChange={e => { setSearch(e.target.value.replace(/\s/g, '')); setNotFound(false); setSearchResult(null); }}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-9 rounded-xl"
              />
            </div>
            <Button onClick={handleSearch} disabled={searching || search.trim().length < 3} variant="outline" className="rounded-xl">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find'}
            </Button>
          </div>

          {/* Search result */}
          {searchResult && (
            <div className="flex items-center gap-3 bg-card rounded-xl border border-primary/30 p-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary/10 text-primary font-display font-semibold">
                  {searchResult.name?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{searchResult.name}</p>
                <p className="text-xs text-muted-foreground">@{searchResult.username}</p>
              </div>
              <Button size="sm" className="rounded-xl gradient-primary border-0" onClick={() => handleStartChat(searchResult.id)} disabled={startConversation.isPending}>
                <UserPlus className="w-4 h-4 mr-1" /> Chat
              </Button>
            </div>
          )}
          {notFound && (
            <p className="text-sm text-muted-foreground text-center py-2">No user found with that username</p>
          )}

          {/* Conversations list */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !conversations || conversations.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No conversations yet</p>
              <p className="text-muted-foreground text-xs">Search for a friend by @username to start chatting</p>
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
