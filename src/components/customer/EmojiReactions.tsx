import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

const QUICK_EMOJIS = ['❤️', '😂', '👍', '😮', '😢', '🔥'];

interface EmojiReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiReactionPicker({ onSelect, onClose }: EmojiReactionPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    // Wait for pop animation to finish
    setTimeout(() => {
      onSelect(emoji);
      onClose();
    }, 300);
  };

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-0.5 bg-popover/95 backdrop-blur-md border border-border rounded-full px-2.5 py-1.5 shadow-xl transition-all duration-200',
        visible
          ? 'opacity-100 scale-100 translate-y-0'
          : 'opacity-0 scale-75 translate-y-2'
      )}
    >
      {QUICK_EMOJIS.map((emoji, i) => (
        <button
          key={emoji}
          onClick={() => handleSelect(emoji)}
          className={cn(
            'text-xl p-1 rounded-full transition-all duration-200 hover:bg-accent/50',
            'emoji-reaction-btn',
            selectedEmoji === emoji && 'animate-emoji-pop'
          )}
          style={{
            animationDelay: visible ? `${i * 30}ms` : '0ms',
            animation: visible && !selectedEmoji
              ? `emoji-entrance 0.3s ease-out ${i * 30}ms both`
              : undefined,
          }}
        >
          <span className={cn(
            'block transition-transform duration-150',
            selectedEmoji === emoji && 'scale-150',
            selectedEmoji && selectedEmoji !== emoji && 'scale-75 opacity-40'
          )}>
            {emoji}
          </span>
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

  const grouped = reactions.reduce<Record<string, { count: number; isMine: boolean }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, isMine: false };
    acc[r.emoji].count++;
    if (r.user_id === currentUserId) acc[r.emoji].isMine = true;
    return acc;
  }, {});

  return (
    <div className="flex flex-wrap gap-1 mt-0.5 -mb-1">
      {Object.entries(grouped).map(([emoji, { count, isMine }]) => (
        <button
          key={emoji}
          onClick={() => onToggle(emoji)}
          className={cn(
            'inline-flex items-center gap-0.5 text-xs rounded-full px-1.5 py-0.5 border transition-all duration-200 active:scale-110',
            'reaction-badge',
            isMine
              ? 'bg-primary/15 border-primary/30 text-foreground shadow-sm shadow-primary/10'
              : 'bg-muted/80 border-border text-muted-foreground hover:border-primary/30 hover:bg-muted'
          )}
        >
          <span className="reaction-emoji">{emoji}</span>
          {count > 1 && <span className="text-[10px] font-medium">{count}</span>}
        </button>
      ))}
    </div>
  );
}
