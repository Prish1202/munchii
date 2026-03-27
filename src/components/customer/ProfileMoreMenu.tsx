import { useState } from 'react';
import { MoreHorizontal, Calendar, AtSign, User, Ban, Flag, Copy, Share2, MessageSquare } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ReportDialog } from '@/components/customer/ReportDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useConversations, useStartConversation } from '@/hooks/useChat';
import { useSendMessage, useRecipientPublicKey, usePublicKey } from '@/hooks/useChat';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ProfileMoreMenuProps {
  userId: string;
  username?: string | null;
  name: string;
  avatarUrl?: string | null;
  createdAt: string;
  isOwnProfile?: boolean;
}

export function ProfileMoreMenu({ userId, username, name, avatarUrl, createdAt, isOwnProfile }: ProfileMoreMenuProps) {
  const [showAbout, setShowAbout] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const navigate = useNavigate();
  const { data: conversations } = useConversations();
  const startConversation = useStartConversation();
  const { data: senderPublicKey } = usePublicKey();

  const profileUrl = `${window.location.origin}/user/${userId}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success('Profile link copied!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShareExternal = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name}'s Profile`,
          text: `Check out ${name}'s profile on Munchii`,
          url: profileUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyUrl();
    }
  };

  const handleShareToChat = async (conversationId: string, targetUserId: string) => {
    if (!senderPublicKey) return;
    try {
      const { data: publicKeyRow } = await supabase
        .from('user_public_keys')
        .select('public_key')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (!publicKeyRow?.public_key) {
        toast.error('This user has not set up encryption yet');
        return;
      }

      const { encryptMessage } = await import('@/lib/e2ee');
      const msg = `👤 Check out this profile: ${name} ${username ? `(@${username})` : ''}\n${profileUrl}`;
      const [encryptedForRecipient, encryptedForSender] = await Promise.all([
        encryptMessage(msg, publicKeyRow.public_key),
        encryptMessage(msg, senderPublicKey),
      ]);

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: (await supabase.auth.getUser()).data.user?.id,
        encrypted_message: encryptedForRecipient,
        encrypted_for_sender: encryptedForSender,
      } as any);

      toast.success('Profile shared!');
      setShowShare(false);
    } catch {
      toast.error('Failed to share profile');
    }
  };

  const handleBlock = () => {
    toast.info('Block feature coming soon');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-xl">
          <DropdownMenuItem onClick={() => setShowAbout(true)} className="gap-2.5 py-2.5">
            <User className="w-4 h-4" /> About this account
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCopyUrl} className="gap-2.5 py-2.5">
            <Copy className="w-4 h-4" /> Copy profile URL
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowShare(true)} className="gap-2.5 py-2.5">
            <Share2 className="w-4 h-4" /> Share this profile
          </DropdownMenuItem>
          {!isOwnProfile && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleBlock} className="gap-2.5 py-2.5 text-destructive focus:text-destructive">
                <Ban className="w-4 h-4" /> Block
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowReport(true)} className="gap-2.5 py-2.5 text-destructive focus:text-destructive">
                <Flag className="w-4 h-4" /> Report
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* About this account */}
      <Dialog open={showAbout} onOpenChange={setShowAbout}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-center">About this account</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-20 h-20 rounded-full p-[3px] gradient-primary">
              <Avatar className="w-full h-full border-2 border-background">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-display font-bold">
                  {name?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            </div>
            {username && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <AtSign className="w-4 h-4" />
                <span className="text-sm font-medium">{username}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Joined {format(new Date(createdAt), 'MMMM yyyy')}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share to chat dialog */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Share profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button variant="outline" className="w-full rounded-xl gap-2" onClick={handleShareExternal}>
              <Share2 className="w-4 h-4" /> Share externally
            </Button>
            <Button variant="outline" className="w-full rounded-xl gap-2" onClick={handleCopyUrl}>
              <Copy className="w-4 h-4" /> Copy link
            </Button>

            {conversations && conversations.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider pt-2">Send in chat</p>
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {conversations.map((conv) => {
                    const other = conv.other_user;
                    if (!other) return null;
                    return (
                      <button
                        key={conv.id}
                        onClick={() => handleShareToChat(conv.id, other.id)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors text-left"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {other.name?.charAt(0)?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{other.name}</p>
                          {other.username && <p className="text-xs text-muted-foreground">@{other.username}</p>}
                        </div>
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <ReportDialog
        open={showReport}
        onOpenChange={setShowReport}
        reportedUserId={userId}
      />
    </>
  );
}