import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search for restaurants, cuisines...' }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border bg-card text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
