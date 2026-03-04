import { cn } from '@/lib/utils';

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '🍽️' },
  { id: 'biryani', label: 'Biryani', emoji: '🍚' },
  { id: 'pizza', label: 'Pizza', emoji: '🍕' },
  { id: 'burger', label: 'Burger', emoji: '🍔' },
  { id: 'chinese', label: 'Chinese', emoji: '🥡' },
  { id: 'dessert', label: 'Dessert', emoji: '🍰' },
  { id: 'south', label: 'South', emoji: '🥘' },
  { id: 'thali', label: 'Thali', emoji: '🍛' },
];

interface CategoryFilterProps {
  selected: string;
  onSelect: (id: string) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            'flex flex-col items-center gap-1 min-w-[4rem] py-2.5 px-2 rounded-2xl transition-all duration-200 shrink-0',
            selected === cat.id
              ? 'bg-primary/10 ring-2 ring-primary/25 scale-105'
              : 'bg-card hover:bg-secondary border border-border hover:scale-[1.02]'
          )}
        >
          <span className="text-2xl">{cat.emoji}</span>
          <span className={cn(
            'text-[11px] font-semibold whitespace-nowrap',
            selected === cat.id ? 'text-primary' : 'text-muted-foreground'
          )}>
            {cat.label}
          </span>
        </button>
      ))}
    </div>
  );
}
