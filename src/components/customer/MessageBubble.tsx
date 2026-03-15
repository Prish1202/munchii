import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, SmilePlus, Coins, Reply, Flag } from 'lucide-react';
import { EmojiReactionPicker, ReactionBadges } from './EmojiReactions';
import { useIsMobile } from '@/hooks/use-mobile';
import { ReportDialog } from './ReportDialog';

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
  replyToText?: string | null;
  replyToIsOwn?: boolean;
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
              <span className={cn('flex-shrink-0', readAt ? 'text-blue-400' : 'text-muted-foreground/50')}>
                {readAt ? (
                  <CheckCheck className="w-3.5 h-3.5" />
                ) : deliveredAt ? (
                  <CheckCheck className="w-3.5 h-3.5" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
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

export function MessageBubble({
  isOwn, text, time, messageId, deliveredAt, readAt,
  reactions, currentUserId, onToggleReaction, onBurstReaction, onReply,
  replyToText, replyToIsOwn,
}: MessageBubbleProps) {
  const [showPicker, setShowPicker] = useState(false);
  const longPress = useLongPress(() => setShowPicker(true));
  const isMobile = useIsMobile();

  // Swipe-to-reply state
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
  };

  const handleEmojiLongPress = (emoji: string) => {
    // Long press = react + burst animation
    onToggleReaction(messageId, emoji);
    onBurstReaction?.(messageId, emoji);
  };

  return (
    <div
      className={cn('flex group relative', isOwn ? 'justify-end' : 'justify-start')}
      data-message-id={messageId}
    >
      {/* Reply icon indicator */}
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
          className={cn(
            'px-3.5 py-2.5 rounded-2xl text-sm select-none',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-secondary text-secondary-foreground rounded-bl-md'
          )}
        >
          {replyToText && (
            <ReplyQuote text={replyToText} isOwn={isOwn} />
          )}
          <p className="whitespace-pre-wrap break-words">{text}</p>
          <div className={cn('flex items-center gap-1 mt-1', isOwn ? 'justify-end' : '')}>
            <span className={cn(
              'text-[10px]',
              isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
            )}>
              {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isOwn && (
              <span className={cn(
                'flex-shrink-0 transition-all duration-500',
                readAt ? 'text-blue-400 animate-[seen-pop_0.4s_ease-out]' : 'text-primary-foreground/50'
              )}>
                {readAt ? (
                  <CheckCheck className="w-3.5 h-3.5" />
                ) : deliveredAt ? (
                  <CheckCheck className="w-3.5 h-3.5" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </span>
            )}
          </div>
        </div>

        <ReactionBadges
          reactions={reactions}
          currentUserId={currentUserId}
          onToggle={(emoji) => onToggleReaction(messageId, emoji)}
        />

        {/* Desktop action buttons */}
        <div className={cn(
          'absolute -bottom-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex gap-0.5',
          'hidden md:flex',
          isOwn ? '-left-14' : '-right-14'
        )}>
          {onReply && (
            <button
              onClick={() => onReply(messageId, text)}
              className="bg-popover border border-border rounded-full p-1 shadow-sm hover:bg-accent"
              title="Reply"
            >
              <Reply className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="bg-popover border border-border rounded-full p-1 shadow-sm hover:bg-accent"
          >
            <SmilePlus className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {showPicker && (
          <div className={cn(
            'absolute z-50 bottom-full mb-1',
            isOwn ? 'right-0' : 'left-0'
          )}>
            <EmojiReactionPicker
              onSelect={handleEmojiSelect}
              onLongPress={handleEmojiLongPress}
              onClose={() => setShowPicker(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
