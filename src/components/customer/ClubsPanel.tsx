import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/customer/EmptyState';
import { Users, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

const SUGGESTED = [
  'College Batch',
  'Hostel Group',
  'Society',
  'Sports Club',
  'Coding Club',
  'Food Community',
];

export function ClubsPanel() {
  const [query, setQuery] = useState('');

  const notReady = () => toast.info('Clubs are launching soon — you\'ll be able to create and join here.');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Discover clubs"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <Button className="rounded-xl gradient-primary border-0" onClick={notReady}>
          <Plus className="w-4 h-4 mr-1" /> Create
        </Button>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">
          Popular categories
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              type="button"
              onClick={notReady}
              className="px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium hover:border-primary/40 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <EmptyState
        icon={<Users className="w-7 h-7 text-primary" />}
        title="You haven't joined any clubs"
        description="Clubs bring your batch, hostel or food crew together with group chat, announcements and shared media."
      />
    </div>
  );
}
