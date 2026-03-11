import { format, isToday, isYesterday } from 'date-fns';

interface DateSeparatorProps {
  date: string;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const d = new Date(date);
  let label: string;

  if (isToday(d)) {
    label = 'Today';
  } else if (isYesterday(d)) {
    label = 'Yesterday';
  } else {
    label = format(d, 'EEEE, MMMM d, yyyy');
  }

  return (
    <div className="flex items-center justify-center py-2">
      <span className="px-3 py-1 text-[11px] font-medium text-muted-foreground bg-muted/60 rounded-full backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}
