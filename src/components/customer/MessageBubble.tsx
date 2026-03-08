import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, SmilePlus } from 'lucide-react';
import { EmojiReactionPicker, ReactionBadges } from './EmojiReactions';

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

export function MessageBubble({
  isOwn, text, time, messageId, deliveredAt, readAt,
  reactions, currentUserId, onToggleReaction,
}: MessageBubbleProps) {
  const [showPicker, setShowPicker] = useState(false);

  const longPress = useLongPress(() => setShowPicker(true));

  return (
    <div className={cn('flex group', isOwn ? 'justify-end' : 'justify-start')}>
      <div className="relative max-w-[75%]">
        <div
          {...{ onTouchStart: longPress.onTouchStart, onTouchEnd: longPress.onTouchEnd, onTouchMove: longPress.onTouchMove }}
          className={cn(
            'px-3.5 py-2.5 rounded-2xl text-sm select-none',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-secondary text-secondary-foreground rounded-bl-md'
          )}
        >
          <p className="whitespace-pre-wrap break-words">{text}</p>
          <div className={cn('flex items-center gap-1 mt-1', isOwn ? 'justify-end' : '')}>
            <span className={cn(
              'text-[10px]',
              isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
            )}>
              {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isOwn && (
              <span className={cn('flex-shrink-0', readAt ? 'text-blue-400' : 'text-primary-foreground/50')}>
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

        {/* Reaction badges */}
        <ReactionBadges
          reactions={reactions}
          currentUserId={currentUserId}
          onToggle={(emoji) => onToggleReaction(messageId, emoji)}
        />

        {/* Hover trigger for desktop */}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className={cn(
            'absolute -bottom-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity',
            'bg-popover border border-border rounded-full p-1 shadow-sm hover:bg-accent',
            'hidden md:block',
            isOwn ? '-left-7' : '-right-7'
          )}
        >
          <SmilePlus className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        {/* Emoji picker */}
        {showPicker && (
          <div className={cn(
            'absolute z-50 bottom-full mb-1',
            isOwn ? 'right-0' : 'left-0'
          )}>
            <EmojiReactionPicker
              onSelect={(emoji) => onToggleReaction(messageId, emoji)}
              onClose={() => setShowPicker(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
