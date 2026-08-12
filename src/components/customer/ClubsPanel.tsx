import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/customer/EmptyState';
import { useClubs } from '@/hooks/useClubs';
import { useB2Upload } from '@/hooks/useB2Upload';
import { useLocation } from '@/contexts/LocationContext';
import { resolveStorageUrl } from '@/lib/utils';
import { Users, Plus, Search, ImagePlus, Shield, LogOut, Trash2, MessageCircle } from 'lucide-react';
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
  const [category, setCategory] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [newCategory, setNewCategory] = useState(SUGGESTED[0]);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const { clubs, myClubs, isLoading, createClub, joinClub, leaveClub, deleteClub } = useClubs();
  const { upload, isUploading, progress } = useB2Upload();
  const { city } = useLocation();
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clubs.filter((c) => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q);
      const matchesCategory = !category || c.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [clubs, query, category]);

  const handleCover = async (file: File | undefined) => {
    if (!file) return;
    const result = await upload(file, 'clubs/covers');
    if (result) setCoverUrl(result.publicUrl);
  };

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Give your club a name');
      return;
    }
    await createClub.mutateAsync({
      name,
      description,
      category: newCategory,
      city: city || null,
      cover_url: coverUrl,
    });
    setName('');
    setDescription('');
    setCoverUrl(null);
    setOpen(false);
  };

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
        <Button className="rounded-xl gradient-primary border-0" onClick={() => setOpen(true)}>
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
              onClick={() => setCategory((c) => (c === s ? null : s))}
              className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                category === s
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {myClubs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">
            My clubs
          </p>
          <div className="space-y-2">
            {myClubs.map((c) => (
              <ClubRow
                key={c.id}
                club={c}
                onJoin={() => joinClub.mutate(c.id)}
                onLeave={() => leaveClub.mutate(c.id)}
                onDelete={() => deleteClub.mutate(c.id)}
                onOpen={() => navigate(`/customer/club/${c.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">
          Discover
        </p>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="w-7 h-7 text-primary" />}
            title={isLoading ? 'Loading clubs…' : 'No clubs found'}
            description="Clubs bring your batch, hostel or food crew together. Create the first one!"
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              <ClubRow
                key={c.id}
                club={c}
                onJoin={() => joinClub.mutate(c.id)}
                onLeave={() => leaveClub.mutate(c.id)}
                onDelete={() => deleteClub.mutate(c.id)}
                onOpen={() => navigate(`/customer/club/${c.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create a club</DialogTitle>
          </DialogHeader>

          <input
            ref={coverRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleCover(e.target.files?.[0])}
          />

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => coverRef.current?.click()}
              className="w-full h-28 rounded-xl border border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/40"
            >
              {coverUrl ? (
                <img src={resolveStorageUrl(coverUrl)} alt="Club cover" className="w-full h-full object-cover" />
              ) : (
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ImagePlus className="w-4 h-4" /> Add a cover image
                </span>
              )}
            </button>

            {isUploading && <Progress value={progress} className="h-1.5" />}

            <Input
              placeholder="Club name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
            />
            <Textarea
              placeholder="What is this club about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl resize-none"
              rows={3}
            />
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNewCategory(s)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium ${
                    newCategory === s
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <Button
              className="w-full rounded-xl gradient-primary border-0"
              onClick={submit}
              disabled={createClub.isPending || isUploading}
            >
              Create club
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClubRow({
  club,
  onJoin,
  onLeave,
  onDelete,
  onOpen,
}: {
  club: ReturnType<typeof useClubs>['clubs'][number];
  onJoin: () => void;
  onLeave: () => void;
  onDelete: () => void;
  onOpen?: () => void;
}) {
  const openable = !!onOpen && !!club.myRole;
  return (
    <div
      className={`flex items-center gap-3 bg-card rounded-2xl border border-border p-3 ${openable ? 'cursor-pointer hover:border-primary/40 transition-colors' : ''}`}
      onClick={openable ? onOpen : undefined}
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
        {club.cover_url ? (
          <img src={resolveStorageUrl(club.cover_url)} alt={club.name} className="w-full h-full object-cover" />
        ) : (
          <Users className="w-5 h-5 text-primary" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-sm truncate">{club.name}</p>
          {club.myRole === 'admin' && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] gap-1">
              <Shield className="w-3 h-3" /> Admin
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {club.memberCount} member{club.memberCount === 1 ? '' : 's'}
          {club.category ? ` · ${club.category}` : ''}
        </p>
      </div>

      {club.myRole ? (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={onOpen}>
            <MessageCircle className="w-4 h-4 mr-1" /> Chat
          </Button>
          {club.myRole === 'admin' ? (
            <Button size="sm" variant="ghost" className="text-destructive rounded-xl" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          ) : (
            <Button size="sm" variant="ghost" className="rounded-xl" onClick={onLeave}>
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      ) : (
        <Button size="sm" className="rounded-xl gradient-primary border-0" onClick={(e) => { e.stopPropagation(); onJoin(); }}>
          Join
        </Button>
      )}
    </div>
  );
}
