import { cn } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  isOwn: boolean;
  text: string;
  time: string;
  deliveredAt?: string | null;
  readAt?: string | null;
}

export function MessageBubble({ isOwn, text, time, deliveredAt, readAt }: MessageBubbleProps) {
  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-secondary text-secondary-foreground rounded-bl-md'
        )}
      >
        <p className="whitespace-pre-wrap break-words">{text}</p>
        <div className={cn(
          'flex items-center gap-1 mt-1',
          isOwn ? 'justify-end' : ''
        )}>
          <span className={cn(
            'text-[10px]',
            isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
          )}>
            {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwn && (
            <span className={cn('flex-shrink-0', readAt ? 'text-blue-400' : isOwn ? 'text-primary-foreground/50' : 'text-muted-foreground')}>
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
  );
}
