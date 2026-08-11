import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, SmilePlus, Coins, Reply, Flag, Copy, Forward, Trash2 } from 'lucide-react';
import { ReactionBadges } from './EmojiReactions';
import { ProfilePreviewCard, parseProfileLink } from './ProfilePreviewCard';
import { MediaPreview } from './MediaPreview';
import { useIsMobile } from '@/hooks/use-mobile';
import { ReportDialog } from './ReportDialog';
import { toast } from 'sonner';
import { getChatSettings } from '@/pages/customer/ChatSettings';

const QUICK_EMOJIS = ['❤️', '😂', '👍', '😮', '😢', '🔥'];

interface MessageBubbleProps {
  isOwn: boolean;
  text: string;
  time: string;
  messageId: string;
  deliveredAt?: string | null;
  readAt?: string | null;
  reactions: Array<{ emoji: string; user_id: string; id: string }>;
  currentUserId: string;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onBurstReaction?: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string, text: string) => void;
  onForward?: (messageId: string, text: string) => void;
  onUnsend?: (messageId: string) => void;
  replyToText?: string | null;
  replyToIsOwn?: boolean;
  activeMessageId?: string | null;
  onActivate?: (messageId: string | null) => void;
  mediaUrl?: string | null;
  mediaType?: string | null;
  mediaFilename?: string | null;
}

function useLongPress(callback: () => void, ms = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggeredRef = useRef(false);

  const start = useCallback(() => {
    triggeredRef.current = false;
    timerRef.current = setTimeout(() => {
      triggeredRef.current = true;
      callback();
    }, ms);
  }, [callback, ms]);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    triggered: triggeredRef,
  };
}

function parseCoinTransfer(text: string) {
  const match = text.match(/^__COIN_TRANSFER__(\d+)__(.+)$/);
  if (match) return { coins: parseInt(match[1], 10), message: match[2] };
  return null;
}

function CoinTransferBubble({ coins, message, time, isOwn, deliveredAt, readAt }: { coins: number; message: string; time: string; isOwn: boolean; deliveredAt?: string | null; readAt?: string | null }) {
  const label = isOwn ? 'Sent' : 'Received';
  const settings = getChatSettings();
  const effectiveReadAt = settings.hideBlueTick ? null : readAt;
  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[75%] min-w-[180px]">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/10 p-4 text-center space-y-1.5">
          <div className="mx-auto w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
            <Coins className="w-5 h-5 text-primary" />
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-primary">{coins} <span className="text-sm font-semibold">coins</span></p>
          <p className="text-xs text-foreground/80">{message}</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <span className="text-[10px] text-muted-foreground">
              {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isOwn && (
              <span className={cn('flex-shrink-0', effectiveReadAt ? 'text-blue-400' : 'text-muted-foreground/50')}>
                {effectiveReadAt ? <CheckCheck className="w-3.5 h-3.5" /> : deliveredAt ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReplyQuote({ text, isOwn }: { text: string; isOwn: boolean }) {
  const truncated = text.length > 80 ? text.slice(0, 80) + '…' : text;
  return (
    <div className={cn(
      'px-3 py-1.5 mb-1 rounded-lg border-l-2 text-xs',
      isOwn
        ? 'bg-primary-foreground/10 border-primary-foreground/40 text-primary-foreground/70'
        : 'bg-muted/60 border-primary/40 text-muted-foreground'
    )}>
      <p className="truncate">{truncated}</p>
    </div>
  );
}

function MessageBubbleImpl({
  isOwn, text, time, messageId, deliveredAt, readAt,
  reactions, currentUserId, onToggleReaction, onBurstReaction, onReply,
  onForward, onUnsend, replyToText, activeMessageId, onActivate,
  mediaUrl, mediaType, mediaFilename,
}: MessageBubbleProps) {
  const settings = getChatSettings();
  const effectiveReadAt = settings.hideBlueTick ? null : readAt;
  const showActions = activeMessageId === messageId;
  const [showReport, setShowReport] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [menuDirection, setMenuDirection] = useState<'above' | 'below'>('above');
  const isMobile = useIsMobile();
  const bubbleRef = useRef<HTMLDivElement>(null);

  const activateThis = useCallback(() => {
    // Determine menu direction based on bubble position
    if (bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect();
      // If top of bubble is less than 200px from viewport top, show menu below
      setMenuDirection(rect.top < 200 ? 'below' : 'above');
    }
    onActivate?.(messageId);
    if (navigator.vibrate) navigator.vibrate(10);
  }, [onActivate, messageId]);

  const longPress = useLongPress(activateThis);

  const swipeRef = useRef<{ startX: number; startY: number; swiping: boolean }>({ startX: 0, startY: 0, swiping: false });
  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeThreshold = 60;

  const coinTransfer = parseCoinTransfer(text);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    longPress.onTouchStart();
    swipeRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, swiping: false };
    setSwipeOffset(0);
  }, [longPress]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - swipeRef.current.startX;
    const dy = e.touches[0].clientY - swipeRef.current.startY;
    if (!swipeRef.current.swiping && Math.abs(dy) > Math.abs(dx)) {
      longPress.onTouchMove();
      return;
    }
    const swipeDir = isOwn ? -1 : 1;
    const progress = dx * swipeDir;
    if (progress > 10) {
      swipeRef.current.swiping = true;
      longPress.onTouchMove();
      const clamped = Math.min(progress, swipeThreshold + 20);
      setSwipeOffset(clamped * swipeDir);
    }
  }, [isOwn, longPress, swipeThreshold]);

  const handleTouchEnd = useCallback(() => {
    longPress.onTouchEnd();
    if (swipeRef.current.swiping && Math.abs(swipeOffset) >= swipeThreshold && onReply) {
      onReply(messageId, text);
      if (navigator.vibrate) navigator.vibrate(15);
    }
    setSwipeOffset(0);
    swipeRef.current.swiping = false;
  }, [swipeOffset, swipeThreshold, onReply, messageId, text, longPress]);

  if (coinTransfer) {
    return <CoinTransferBubble coins={coinTransfer.coins} message={coinTransfer.message} time={time} isOwn={isOwn} deliveredAt={deliveredAt} readAt={readAt} />;
  }

  const swipeActive = isMobile && swipeOffset !== 0;
  const replyIconOpacity = Math.min(Math.abs(swipeOffset) / swipeThreshold, 1);

  const handleEmojiSelect = (emoji: string) => {
    onToggleReaction(messageId, emoji);
    onActivate?.(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Message copied');
    } catch {
      toast.error('Failed to copy message');
    } finally {
      onActivate?.(null);
    }
  };

  const closeActions = () => onActivate?.(null);

  const actionItems = isOwn
    ? [
        { label: 'Reply', icon: Reply, action: () => { onReply?.(messageId, text); closeActions(); } },
        { label: 'Forward', icon: Forward, action: () => { onForward?.(messageId, text); closeActions(); } },
        { label: 'Copy', icon: Copy, action: handleCopy },
        { label: 'Unsend', icon: Trash2, action: () => { onUnsend?.(messageId); closeActions(); }, destructive: true },
      ]
    : [
        { label: 'Reply', icon: Reply, action: () => { onReply?.(messageId, text); closeActions(); } },
        { label: 'Copy', icon: Copy, action: handleCopy },
        { label: 'Forward', icon: Forward, action: () => { onForward?.(messageId, text); closeActions(); } },
        { label: 'Report', icon: Flag, action: () => { setShowReport(true); closeActions(); }, destructive: true },
      ];

  return (
    <div className={cn('flex group relative', isOwn ? 'justify-end' : 'justify-start')} data-message-id={messageId}>
      {isMobile && (
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 flex items-center justify-center transition-opacity',
            isOwn ? 'left-2' : 'right-2'
          )}
          style={{ opacity: replyIconOpacity }}
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Reply className="w-4 h-4 text-primary" />
          </div>
        </div>
      )}

      <div
        ref={bubbleRef}
        className="relative max-w-[75%]"
        style={{
          transform: swipeActive ? `translateX(${swipeOffset}px)` : undefined,
          transition: swipeActive ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        <div
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchMove={isMobile ? handleTouchMove : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
          onContextMenu={(e) => {
            e.preventDefault();
            activateThis();
          }}
          className={cn(
            'px-3.5 py-2.5 rounded-2xl text-sm select-none shadow-soft',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-card text-card-foreground rounded-bl-md border border-border/70'
          )}
        >
          {replyToText && <ReplyQuote text={replyToText} isOwn={isOwn} />}
          {mediaLifecycle === 'VIEW_ONCE_MEDIA' && mediaType ? (
            <div className="mb-1">
              <ViewOnceMedia
                messageId={messageId}
                isOwn={isOwn}
                mediaType={mediaType}
                viewedAt={mediaViewedAt}
                available={!!mediaFilePath}
              />
              {text && text !== '📎 Media' && (
                <p className="whitespace-pre-wrap break-words mt-1.5">{text}</p>
              )}
            </div>
          ) : mediaUrl && mediaType ? (
            <div className="mb-1">
              <MediaPreview
                mediaUrl={mediaUrl}
                mediaType={mediaType}
                fileName={mediaFilename || undefined}
                isOwn={isOwn}
                onForward={onForward ? () => onForward(messageId, text) : undefined}
              />
              {text && text !== '📎 Media' && text !== '🎙️ Voice message' && (
                <p className="whitespace-pre-wrap break-words mt-1.5">{text}</p>
              )}
            </div>
          ) : (() => {
            const profileId = parseProfileLink(text);
            if (profileId) {
              return <ProfilePreviewCard userId={profileId} />;
            }
            return <p className="whitespace-pre-wrap break-words">{text}</p>;
          })()}
          <div className={cn('flex items-center gap-1 mt-1', isOwn ? 'justify-end' : '')}>
            <span className={cn('text-[10px]', isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
              {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isOwn && (
              <span className={cn('flex-shrink-0 transition-all duration-500', effectiveReadAt ? 'text-blue-400 animate-[seen-pop_0.4s_ease-out]' : 'text-primary-foreground/50')}>
                {effectiveReadAt ? <CheckCheck className="w-3.5 h-3.5" /> : deliveredAt ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              </span>
            )}
          </div>
        </div>

        <ReactionBadges
          reactions={reactions}
          currentUserId={currentUserId}
          onToggle={(emoji) => onToggleReaction(messageId, emoji)}
        />

        {/* Desktop hover actions */}
        <div className={cn('absolute -bottom-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex gap-0.5', 'hidden md:flex', isOwn ? '-left-14' : '-right-14')}>
          {onReply && (
            <button onClick={() => onReply(messageId, text)} className="bg-popover border border-border rounded-full p-1 shadow-soft hover:bg-accent/10" title="Reply">
              <Reply className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
          <button onClick={() => setShowPicker(!showPicker)} className="bg-popover border border-border rounded-full p-1 shadow-soft hover:bg-accent/10" title="React">
            <SmilePlus className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={handleCopy} className="bg-popover border border-border rounded-full p-1 shadow-soft hover:bg-accent/10" title="Copy">
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Full-screen backdrop to dismiss action menu */}
        {showActions && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => onActivate?.(null)}
            onTouchStart={() => onActivate?.(null)}
          />
        )}

        {/* Long-press action sheet — dynamically positioned above or below bubble */}
        {showActions && (
          <div
            data-message-actions
            className={cn(
              'absolute z-50 min-w-[220px] rounded-2xl border border-border bg-popover p-1.5 shadow-xl animate-scale-in',
              isOwn ? 'right-0' : 'left-0',
              menuDirection === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'
            )}
          >
            {/* Emoji row */}
            <div className="flex items-center justify-around px-1 py-1.5 border-b border-border/50 mb-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="text-xl p-1.5 rounded-full hover:bg-secondary active:scale-125 transition-transform select-none"
                >
                  {emoji}
                </button>
              ))}
            </div>
            {/* Action items */}
            {actionItems.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left hover:bg-secondary transition-colors',
                  item.destructive && 'text-destructive'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* Desktop emoji picker */}
        {showPicker && (
          <div className={cn('absolute z-50 bottom-full mb-1', isOwn ? 'right-0' : 'left-0')}>
            <div className="flex items-center gap-0.5 bg-popover/95 backdrop-blur-md border border-border rounded-full px-2.5 py-1.5 shadow-xl">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => { onToggleReaction(messageId, emoji); setShowPicker(false); }}
                  className="text-xl p-1 rounded-full hover:bg-accent/50 select-none transition-transform active:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isOwn && (
        <ReportDialog
          open={showReport}
          onOpenChange={(open) => { setShowReport(open); }}
          reportedMessageId={messageId}
        />
      )}
    </div>
  );
}

export const MessageBubble = memo(MessageBubbleImpl, (prev, next) => {
  // Reactions identity changes per render in parent; compare by length + ids
  const sameReactions =
    prev.reactions.length === next.reactions.length &&
    prev.reactions.every((r, i) => r.id === next.reactions[i].id && r.emoji === next.reactions[i].emoji);
  return (
    prev.messageId === next.messageId &&
    prev.text === next.text &&
    prev.time === next.time &&
    prev.isOwn === next.isOwn &&
    prev.deliveredAt === next.deliveredAt &&
    prev.readAt === next.readAt &&
    prev.currentUserId === next.currentUserId &&
    prev.replyToText === next.replyToText &&
    prev.replyToIsOwn === next.replyToIsOwn &&
    prev.mediaUrl === next.mediaUrl &&
    prev.mediaType === next.mediaType &&
    prev.mediaFilename === next.mediaFilename &&
    (prev.activeMessageId === next.activeMessageId ||
      (prev.activeMessageId !== prev.messageId && next.activeMessageId !== next.messageId)) &&
    sameReactions
  );
});