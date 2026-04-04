import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { resolveStorageUrl } from '@/lib/utils';

interface ProfilePreviewCardProps {
  userId: string;
}

export function ProfilePreviewCard({ userId }: ProfilePreviewCardProps) {
  const navigate = useNavigate();
  const { data: profile } = useQuery({
    queryKey: ['profile-preview', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url, campus, bio')
        .eq('id', userId)
        .single();
      return data;
    },
    enabled: !!userId,
  });

  if (!profile) return null;

  return (
    <button
      onClick={() => navigate(`/customer/user/${profile.id}`)}
      className="w-full max-w-[240px] flex items-center gap-3 p-3 rounded-2xl bg-card border border-border shadow-soft hover:bg-muted/50 transition-colors text-left"
    >
      <Avatar className="w-10 h-10 shrink-0">
        {profile.avatar_url ? <AvatarImage src={resolveStorageUrl(profile.avatar_url) || undefined} alt={profile.name} /> : null}
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
          {profile.name?.charAt(0)?.toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{profile.name}</p>
        {profile.username && <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>}
        {profile.campus && <p className="text-[10px] text-muted-foreground truncate">{profile.campus}</p>}
      </div>
      <User className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}

// Detect if text contains a profile link
export function parseProfileLink(text: string): string | null {
  const trimmed = text.trim();
  const uuidPattern = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
  const profilePathPattern = '(?:customer/(?:user|profile)|user)';
  const patterns = [
    // Full URLs
    new RegExp(`https?://[^\\s]+/${profilePathPattern}/(${uuidPattern})(?:[/?#][^\\s]*)?`, 'i'),
    // Relative paths (the whole message is just the path)
    new RegExp(`^/?${profilePathPattern}/(${uuidPattern})(?:[/?#][^\\s]*)?$`, 'i'),
    // Just the path anywhere in text
    new RegExp(`/${profilePathPattern}/(${uuidPattern})(?:[/?#][^\\s]*)?`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  return null;
}
