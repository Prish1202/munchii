import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Paperclip, Users, Loader2, Trash2, Download, FileText } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useB2Upload } from '@/hooks/useB2Upload';
import { resolveStorageUrl } from '@/lib/utils';
import { DateSeparator } from '@/components/customer/DateSeparator';
import {
  useClub,
  useClubMembership,
  useClubMessages,
  useSendClubMessage,
  useDeleteClubMessage,
  useClubMembers,
  ClubMessage,
} from '@/hooks/useClubMessages';
import { useClubs } from '@/hooks/useClubs';
import { toast } from 'sonner';

export default function ClubChat() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: club, isLoading: clubLoading } = useClub(clubId);
  const { data: membership, isLoading: membershipLoading } = useClubMembership(clubId);
  const { data: messages = [], isLoading } = useClubMessages(clubId);
  const { members } = useClubMembers(clubId);
  const sendMessage = useSendClubMessage(clubId);
  const deleteMessage = useDeleteClubMessage(clubId);
  const { joinClub } = useClubs();
  const { upload, isUploading, progress } = useB2Upload();

  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const isMember = !!membership;
  const isAdmin = membership?.role === 'admin';

  const handleSend = async () => {
    const value = text.trim();
    if (!value || sendMessage.isPending) return;
    setText('');
    await sendMessage.mutateAsync({ content: value });
  };

  const handleFile = async (file: File | undefined) => {
    if (!file || !clubId) return;
    const forbidden = /\.(exe|bat|cmd|sh|apk|msi|js|jar)$/i;
    if (forbidden.test(file.name)) {
      toast.error('This file type is not allowed');
      return;
    }
    const result = await upload(file, `clubs/${clubId}/media`);
    if (!result) return;
    await sendMessage.mutateAsync({
      media_url: result.publicUrl,
      media_type: file.type,
      media_name: file.name,
      media_size: file.size,
    });
  };

  if (clubLoading || membershipLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-background">
        <p className="font-display font-semibold">Club not found</p>
        <Button variant="outline" className="rounded-xl" onClick={() => navigate('/customer/messages')}>
          Back to messages
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      transition={{ type: 'tween', duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
    >
      <header className="flex items-center gap-3 px-3 py-2.5 border-b border-border bg-card/80 backdrop-blur-lg safe-area-top shrink-0">
        <button
          onClick={() => navigate('/customer/messages')}
          className="p-1.5 -ml-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Avatar className="w-9 h-9 rounded-xl">
          {club.cover_url ? <AvatarImage src={resolveStorageUrl(club.cover_url)} alt={club.name} /> : null}
          <AvatarFallback className="bg-primary/10 text-primary rounded-xl">
            <Users className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm truncate">{club.name}</p>
            {isAdmin && <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">Admin</Badge>}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {members.length} member{members.length === 1 ? '' : 's'}
            {club.category ? ` · ${club.category}` : ''}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-2 scrollbar-hide">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No messages yet — start the conversation 👋</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const msgDate = new Date(msg.created_at).toDateString();
            const prevDate = idx > 0 ? new Date(messages[idx - 1].created_at).toDateString() : null;
            const showDate = idx === 0 || msgDate !== prevDate;
            return (
              <div key={msg.id}>
                {showDate && <DateSeparator date={msg.created_at} />}
                <ClubBubble
                  msg={msg}
                  isOwn={msg.sender_id === user?.id}
                  canDelete={msg.sender_id === user?.id || isAdmin}
                  onDelete={() => deleteMessage.mutate(msg.id)}
                />
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {isMember ? (
        <div className="border-t border-border bg-card/90 backdrop-blur-lg px-3 py-2.5 safe-area-bottom shrink-0 space-y-2">
          {isUploading && (
            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground">Uploading… {progress}%</p>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl shrink-0"
              disabled={isUploading}
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Message ${club.name}`}
              rows={1}
              className="resize-none rounded-2xl min-h-[42px] max-h-32 py-2.5"
            />
            <Button
              size="icon"
              className="rounded-xl gradient-primary border-0 shrink-0"
              onClick={handleSend}
              disabled={!text.trim() || sendMessage.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t border-border bg-card px-4 py-4 safe-area-bottom shrink-0 text-center space-y-2">
          <p className="text-sm text-muted-foreground">Join this club to send messages.</p>
          <Button
            className="rounded-xl gradient-primary border-0"
            onClick={() => clubId && joinClub.mutate(clubId)}
            disabled={joinClub.isPending}
          >
            Join club
          </Button>
        </div>
      )}
    </motion.div>
  );
}

function ClubBubble({
  msg,
  isOwn,
  canDelete,
  onDelete,
}: {
  msg: ClubMessage;
  isOwn: boolean;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const url = msg.media_url ? resolveStorageUrl(msg.media_url) : '';
  const isImage = msg.media_type?.startsWith('image/');
  const isVideo = msg.media_type?.startsWith('video/');
  const isAudio = msg.media_type?.startsWith('audio/');

  return (
    <div className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && (
        <Avatar className="w-7 h-7 mt-auto shrink-0">
          {msg.sender?.avatar_url ? (
            <AvatarImage src={resolveStorageUrl(msg.sender.avatar_url)} alt={msg.sender?.name || ''} />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
            {msg.sender?.name?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={`group max-w-[78%] rounded-2xl px-3 py-2 shadow-soft ${
          isOwn ? 'gradient-primary text-primary-foreground rounded-br-md' : 'bg-card border border-border rounded-bl-md'
        }`}
      >
        {!isOwn && (
          <p className="text-[11px] font-semibold text-primary mb-0.5">{msg.sender?.name || 'Member'}</p>
        )}

        {msg.media_url && (
          <div className="mb-1.5 rounded-xl overflow-hidden">
            {isImage ? (
              <img src={url} alt={msg.media_name || 'image'} className="max-h-64 w-auto rounded-xl" loading="lazy" />
            ) : isVideo ? (
              <video src={url} controls playsInline preload="metadata" className="max-h-64 w-full rounded-xl" />
            ) : isAudio ? (
              <audio src={url} controls className="w-56" />
            ) : (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-2 p-2 rounded-xl ${isOwn ? 'bg-white/15' : 'bg-muted'}`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="text-xs truncate max-w-[150px]">{msg.media_name || 'Attachment'}</span>
                <Download className="w-3.5 h-3.5 shrink-0 opacity-70" />
              </a>
            )}
          </div>
        )}

        {msg.content && <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>}

        <div className="flex items-center justify-end gap-2 mt-0.5">
          <span className={`text-[10px] ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {canDelete && (
            <button
              onClick={onDelete}
              className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                isOwn ? 'text-primary-foreground/80' : 'text-destructive'
              }`}
              aria-label="Delete message"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
