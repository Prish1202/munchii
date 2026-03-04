import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUserStats } from '@/hooks/useProfile';
import { useWallet } from '@/hooks/useWallet';
import { useFollowerCounts, useIsFollowing, useToggleFollow } from '@/hooks/useFollowers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Coins, ShoppingBag, UserPlus, UserMinus, Loader2 } from 'lucide-react';

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile(userId);
  const { data: wallet } = useWallet(userId);
  const { data: stats } = useUserStats(userId);
  const { data: counts } = useFollowerCounts(userId || '');
  const { data: isFollowing } = useIsFollowing(userId || '');
  const toggleFollow = useToggleFollow();

  const isOwnProfile = user?.id === userId;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="font-display font-semibold text-xl">User not found</h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto pb-28 md:pb-6 space-y-5">
        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <Avatar className="w-24 h-24 mx-auto border-2 border-primary">
            <AvatarFallback className="bg-primary/10 text-primary text-3xl font-display font-bold">
              {profile.name?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <h1 className="font-display font-bold text-xl mt-3">{profile.name}</h1>
          {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
          {profile.campus && <Badge variant="secondary" className="mt-2 text-xs">🎓 {profile.campus}</Badge>}

          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div>
              <span className="font-semibold">{counts?.followers || 0}</span>
              <span className="text-muted-foreground ml-1">Followers</span>
            </div>
            <div>
              <span className="font-semibold">{counts?.following || 0}</span>
              <span className="text-muted-foreground ml-1">Following</span>
            </div>
          </div>

          {!isOwnProfile && userId && (
            <Button
              className="mt-4"
              variant={isFollowing ? 'outline' : 'default'}
              onClick={() => toggleFollow.mutate({ targetUserId: userId, isFollowing: !!isFollowing })}
              disabled={toggleFollow.isPending}
            >
              {isFollowing ? <><UserMinus className="w-4 h-4 mr-2" /> Unfollow</> : <><UserPlus className="w-4 h-4 mr-2" /> Follow</>}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <Coins className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="font-display font-bold text-lg">{wallet?.total_coins || 0}</p>
            <p className="text-xs text-muted-foreground">Coins</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <ShoppingBag className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="font-display font-bold text-lg">{stats?.totalOrders || 0}</p>
            <p className="text-xs text-muted-foreground">Orders</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
