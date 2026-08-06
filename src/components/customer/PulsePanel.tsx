import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/customer/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { Plus, Camera, Type, Video, Zap } from 'lucide-react';
import { toast } from 'sonner';

export function PulsePanel() {
  const { profile } = useProfile();
  const [creating, setCreating] = useState(false);

  const notReady = () => {
    setCreating(false);
    toast.info('Pulse sharing is coming soon — stay tuned!');
  };

  return (
    <div className="space-y-4">
      {/* My Pulse */}
      <div className="bg-card rounded-2xl border border-border p-3">
        <button
          type="button"
          onClick={() => setCreating((c) => !c)}
          className="w-full flex items-center gap-3 text-left"
        >
          <div className="relative">
            <Avatar className="w-14 h-14 ring-2 ring-border">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile?.name || 'Me'} />}
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
            <p className="text-xs text-muted-foreground">Share a photo, video or text — disappears in 24h</p>
          </div>
        </button>

        {creating && (
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border animate-in fade-in duration-200">
            <Button variant="outline" className="rounded-xl h-auto py-3 flex-col gap-1" onClick={notReady}>
              <Camera className="w-4 h-4" />
              <span className="text-xs">Photo</span>
            </Button>
            <Button variant="outline" className="rounded-xl h-auto py-3 flex-col gap-1" onClick={notReady}>
              <Video className="w-4 h-4" />
              <span className="text-xs">Video</span>
            </Button>
            <Button variant="outline" className="rounded-xl h-auto py-3 flex-col gap-1" onClick={notReady}>
              <Type className="w-4 h-4" />
              <span className="text-xs">Text</span>
            </Button>
          </div>
        )}
      </div>

      {/* Friends' Pulse */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">
          Recent updates
        </p>
        <EmptyState
          icon={<Zap className="w-7 h-7 text-primary" />}
          title="No Pulse updates yet"
          description="When people you follow post a Pulse, it shows up here for 24 hours."
        />
      </div>
    </div>
  );
}
