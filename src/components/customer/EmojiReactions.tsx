import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

const QUICK_EMOJIS = ['❤️', '😂', '👍', '😮', '😢', '🔥'];

interface EmojiReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiReactionPicker({ onSelect, onClose }: EmojiReactionPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="flex items-center gap-1 bg-popover border border-border rounded-full px-2 py-1 shadow-lg animate-in fade-in zoom-in-95 duration-150"
    >
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => { onSelect(emoji); onClose(); }}
          className="text-lg hover:scale-125 transition-transform p-0.5"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

interface ReactionBadgesProps {
  reactions: Array<{ emoji: string; user_id: string; id: string }>;
  currentUserId: string;
  onToggle: (emoji: string) => void;
}

export function ReactionBadges({ reactions, currentUserId, onToggle }: ReactionBadgesProps) {
  if (!reactions.length) return null;

  // Group by emoji
  const grouped = reactions.reduce<Record<string, { count: number; isMine: boolean }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, isMine: false };
    acc[r.emoji].count++;
    if (r.user_id === currentUserId) acc[r.emoji].isMine = true;
    return acc;
  }, {});

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(grouped).map(([emoji, { count, isMine }]) => (
        <button
          key={emoji}
          onClick={() => onToggle(emoji)}
          className={cn(
            'inline-flex items-center gap-0.5 text-xs rounded-full px-1.5 py-0.5 border transition-colors',
            isMine
              ? 'bg-primary/15 border-primary/30 text-foreground'
              : 'bg-muted border-border text-muted-foreground hover:border-primary/30'
          )}
        >
          <span>{emoji}</span>
          {count > 1 && <span className="text-[10px]">{count}</span>}
        </button>
      ))}
    </div>
  );
}
