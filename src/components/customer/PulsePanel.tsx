import { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { EmptyState } from '@/components/customer/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { useB2Upload } from '@/hooks/useB2Upload';
import { usePulses, timeLeft, type Pulse } from '@/hooks/usePulses';
import { usePulseAudience } from '@/hooks/usePulseAudience';
import { resolveStorageUrl } from '@/lib/utils';
import { Plus, Camera, Type, Video, Zap, Trash2, X, Heart, Eye } from 'lucide-react';
import { toast } from 'sonner';


const BG_COLORS = [
  'linear-gradient(135deg,#FF6A1A,#FF9E4A)',
  'linear-gradient(135deg,#1E3A8A,#3B82F6)',
  'linear-gradient(135deg,#7C3AED,#EC4899)',
  'linear-gradient(135deg,#059669,#34D399)',
];

export function PulsePanel() {
  const { data: profile } = useProfile();
  const { myPulses, groups, isLoading, createPulse, deletePulse, markViewed } = usePulses();
  const { upload, isUploading, progress } = useB2Upload();

  const [creating, setCreating] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [text, setText] = useState('');
  const [bg, setBg] = useState(BG_COLORS[0]);
  const [viewing, setViewing] = useState<Pulse[] | null>(null);
  const [viewIndex, setViewIndex] = useState(0);

  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined, media_type: 'image' | 'video') => {
    if (!file) return;
    const result = await upload(file, `pulses/${media_type}`);
    if (!result) return;
    await createPulse.mutateAsync({ media_type, media_url: result.publicUrl });
    setCreating(false);
  };

  const postText = async () => {
    if (!text.trim()) {
      toast.error('Write something first');
      return;
    }
    await createPulse.mutateAsync({ media_type: 'text', text_content: text.trim(), background_color: bg });
    setText('');
    setTextMode(false);
    setCreating(false);
  };

  const openViewer = (pulses: Pulse[]) => {
    setViewing(pulses);
    setViewIndex(0);
    if (pulses[0]) markViewed(pulses[0].id);
  };

  const step = (dir: 1 | -1) => {
    if (!viewing) return;
    const next = viewIndex + dir;
    if (next < 0) return;
    if (next >= viewing.length) {
      setViewing(null);
      return;
    }
    setViewIndex(next);
    markViewed(viewing[next].id);
  };

  const current = viewing?.[viewIndex];
  const isMine = !!current && myPulses.some((p) => p.id === current.id);
  const { entries, likeCount, viewCount, likedByMe, toggleLike } = usePulseAudience(current?.id, !!current);


  return (
    <div className="space-y-4">
      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0], 'image')}
      />
      <input
        ref={videoRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0], 'video')}
      />

      {/* My Pulse */}
      <div className="bg-card rounded-2xl border border-border p-3">
        <button
          type="button"
          onClick={() => (myPulses.length ? openViewer(myPulses) : setCreating((c) => !c))}
          className="w-full flex items-center gap-3 text-left"
        >
          <div className="relative">
            <Avatar className={`w-14 h-14 ring-2 ${myPulses.length ? 'ring-primary' : 'ring-border'}`}>
              {profile?.avatar_url && <AvatarImage src={resolveStorageUrl(profile.avatar_url)} alt={profile?.name || 'Me'} />}
              <AvatarFallback className="bg-primary/10 text-primary font-display font-semibold">
                {profile?.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full gradient-primary flex items-center justify-center border-2 border-card">
              <Plus className="w-3.5 h-3.5 text-primary-foreground" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">My Pulse</p>
            <p className="text-xs text-muted-foreground">
              {myPulses.length
                ? `${myPulses.length} active · ${timeLeft(myPulses[myPulses.length - 1].expires_at)}`
                : 'Share a photo, video or text — disappears in 24h'}
            </p>
          </div>
          {myPulses.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setCreating((c) => !c);
              }}
              className="text-xs font-semibold text-primary px-2 py-1 rounded-lg hover:bg-primary/10"
            >
              Add
            </span>
          )}
        </button>

        {isUploading && (
          <div className="mt-3">
            <Progress value={progress} className="h-1.5" />
            <p className="text-[11px] text-muted-foreground mt-1">Uploading… {progress}%</p>
          </div>
        )}

        {creating && !isUploading && (
          <div className="mt-3 pt-3 border-t border-border animate-in fade-in duration-200 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="rounded-xl h-auto py-3 flex-col gap-1" onClick={() => photoRef.current?.click()}>
                <Camera className="w-4 h-4" />
                <span className="text-xs">Photo</span>
              </Button>
              <Button variant="outline" className="rounded-xl h-auto py-3 flex-col gap-1" onClick={() => videoRef.current?.click()}>
                <Video className="w-4 h-4" />
                <span className="text-xs">Video</span>
              </Button>
              <Button
                variant={textMode ? 'default' : 'outline'}
                className="rounded-xl h-auto py-3 flex-col gap-1"
                onClick={() => setTextMode((t) => !t)}
              >
                <Type className="w-4 h-4" />
                <span className="text-xs">Text</span>
              </Button>
            </div>

            {textMode && (
              <div className="space-y-2">
                <div className="rounded-xl p-3" style={{ background: bg }}>
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="What's on your mind?"
                    className="bg-transparent border-0 text-primary-foreground placeholder:text-primary-foreground/70 resize-none focus-visible:ring-0"
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-2">
                  {BG_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setBg(c)}
                      style={{ background: c }}
                      className={`w-7 h-7 rounded-full border-2 ${bg === c ? 'border-foreground' : 'border-transparent'}`}
                      aria-label="Background colour"
                    />
                  ))}
                  <Button
                    size="sm"
                    className="ml-auto rounded-xl gradient-primary border-0"
                    disabled={createPulse.isPending}
                    onClick={postText}
                  >
                    Post Pulse
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Friends' Pulse */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">
          Recent updates
        </p>

        {groups.length === 0 ? (
          <EmptyState
            icon={<Zap className="w-7 h-7 text-primary" />}
            title={isLoading ? 'Loading Pulse…' : 'No Pulse updates yet'}
            description="When people you follow post a Pulse, it shows up here for 24 hours."
          />
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 px-1">
            {groups.map((g) => (
              <button
                key={g.user_id}
                type="button"
                onClick={() => openViewer(g.pulses)}
                className="flex flex-col items-center gap-1 w-[68px] shrink-0"
              >
                <Avatar className="w-14 h-14 ring-2 ring-primary ring-offset-2 ring-offset-background">
                  {g.author?.avatar_url && <AvatarImage src={resolveStorageUrl(g.author.avatar_url)} alt={g.author?.name || 'User'} />}
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {g.author?.name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[11px] truncate w-full text-center text-muted-foreground">
                  {g.author?.username || g.author?.name || 'User'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Viewer */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="p-0 max-w-sm overflow-hidden border-border">
          {current && (
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
                {viewing!.map((_, i) => (
                  <span
                    key={i}
                    className={`h-0.5 flex-1 rounded-full ${i <= viewIndex ? 'bg-primary-foreground' : 'bg-primary-foreground/30'}`}
                  />
                ))}
              </div>

              <div
                className="aspect-[9/16] w-full flex items-center justify-center bg-muted"
                style={current.media_type === 'text' ? { background: current.background_color || BG_COLORS[0] } : undefined}
              >
                {current.media_type === 'image' && (
                  <img src={resolveStorageUrl(current.media_url)} alt="Pulse" className="w-full h-full object-contain" />
                )}
                {current.media_type === 'video' && (
                  <video
                    src={resolveStorageUrl(current.media_url)}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    playsInline
                  />
                )}
                {current.media_type === 'text' && (
                  <p className="text-primary-foreground text-xl font-display font-semibold text-center px-6">
                    {current.text_content}
                  </p>
                )}
              </div>

              <button
                type="button"
                aria-label="Previous"
                onClick={() => step(-1)}
                className="absolute inset-y-0 left-0 w-1/3"
              />
              <button
                type="button"
                aria-label="Next"
                onClick={() => step(1)}
                className="absolute inset-y-0 right-0 w-1/3"
              />

              <div className="flex items-center justify-between p-3 bg-card">

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{timeLeft(current.expires_at)}</span>
                  {isMine && (
                    <button
                      type="button"
                      onClick={() => setShowAudience(true)}
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="w-4 h-4" /> {viewCount}
                      <Heart className="w-4 h-4 ml-1 text-primary" /> {likeCount}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!isMine && (
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={likedByMe ? 'Unlike Pulse' : 'Like Pulse'}
                      onClick={() => toggleLike.mutate(likedByMe)}
                      disabled={toggleLike.isPending}
                    >
                      <Heart className={`w-5 h-5 ${likedByMe ? 'fill-primary text-primary' : ''}`} />
                    </Button>
                  )}
                  {isMine && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={async () => {
                        await deletePulse.mutateAsync(current.id);
                        setViewing(null);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setViewing(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

        </DialogContent>
      </Dialog>
    </div>
  );
}
