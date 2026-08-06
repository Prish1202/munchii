import { cn } from '@/lib/utils';

export type ChatTabKey = 'chat' | 'pulse' | 'clubs' | 'connect';

const TABS: { key: ChatTabKey; label: string }[] = [
  { key: 'chat', label: 'Chat' },
  { key: 'pulse', label: 'Pulse' },
  { key: 'clubs', label: 'Clubs' },
  { key: 'connect', label: 'Connect' },
];

interface ChatTabsProps {
  value: ChatTabKey;
  onChange: (value: ChatTabKey) => void;
}

export function ChatTabs({ value, onChange }: ChatTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Chat sections"
      className="flex items-center gap-1 p-1 rounded-2xl bg-secondary/70 border border-border overflow-x-auto no-scrollbar"
    >
      {TABS.map((tab) => {
        const active = tab.key === value;
        return (
          <button
            key={tab.key}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={cn(
              'flex-1 min-w-[74px] px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ease-out',
              active
                ? 'gradient-primary text-primary-foreground shadow-sm scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
