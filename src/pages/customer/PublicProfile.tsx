import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUserStats } from '@/hooks/useProfile';
import { useFollowerCounts, useIsFollowing, useToggleFollow } from '@/hooks/useFollowers';
import { useStartConversation } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CoinTransfer } from '@/components/customer/CoinTransfer';
import { useWallet } from '@/hooks/useWallet';
import { ShoppingBag, UserPlus, UserMinus, Loader2, MessageSquare, Send, Grid3x3, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { ReportDialog } from '@/components/customer/ReportDialog';
import { ProfileMoreMenu } from '@/components/customer/ProfileMoreMenu';

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile(userId);
  const { data: stats } = useUserStats(userId);
  const { data: counts } = useFollowerCounts(userId || '');
  const { data: isFollowing } = useIsFollowing(userId || '');
  const toggleFollow = useToggleFollow();
  const startConversation = useStartConversation();
  const { data: wallet } = useWallet();
  const [showShareCoins, setShowShareCoins] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const handleMessage = async () => {
    if (!userId) return;
    try {
      const convId = await startConversation.mutateAsync(userId);
      navigate(`/customer/chat/${convId}`);
    } catch { /* error handled in hook */ }
  };

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
      <div className="max-w-lg mx-auto pb-28 md:pb-6 space-y-4">
        {/* Profile Header — Instagram style */}
        <motion.div
          className="bg-card rounded-3xl border border-border p-5"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full p-[3px] gradient-primary">
                <Avatar className="w-full h-full border-2 border-background">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-display font-bold">
                    {profile.name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex-1 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="font-display font-bold text-lg">{stats?.totalOrders || 0}</p>
                <p className="text-[11px] text-muted-foreground">Orders</p>
              </div>
              <Link to={isOwnProfile ? '/customer/profile/followers' : '#'} className="hover:opacity-80">
                <p className="font-display font-bold text-lg">{counts?.followers || 0}</p>
                <p className="text-[11px] text-muted-foreground">Followers</p>
              </Link>
              <Link to={isOwnProfile ? '/customer/profile/following' : '#'} className="hover:opacity-80">
                <p className="font-display font-bold text-lg">{counts?.following || 0}</p>
                <p className="text-[11px] text-muted-foreground">Following</p>
              </Link>
            </div>
          </div>

          {/* Name & bio section */}
          <div className="mt-4">
            <h1 className="font-display font-bold text-lg">{profile.name}</h1>
            {profile.username && (
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            )}
            {(profile as any).bio && (
              <p className="text-sm mt-1.5">{(profile as any).bio}</p>
            )}
            {profile.campus && (
              <Badge variant="secondary" className="mt-1.5 text-xs">🎓 {profile.campus}</Badge>
            )}
          </div>

          {/* Action buttons */}
          {!isOwnProfile && userId && (
            <div className="flex gap-2 mt-4">
              <Button
                className="flex-1 rounded-xl"
                variant={isFollowing ? 'outline' : 'default'}
                onClick={() => toggleFollow.mutate({ targetUserId: userId, isFollowing: !!isFollowing })}
                disabled={toggleFollow.isPending}
                size="sm"
              >
                {isFollowing ? <><UserMinus className="w-4 h-4 mr-1.5" /> Unfollow</> : <><UserPlus className="w-4 h-4 mr-1.5" /> Follow</>}
              </Button>
              {isFollowing && (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={handleMessage}
                    disabled={startConversation.isPending}
                    size="sm"
                  >
                    <MessageSquare className="w-4 h-4 mr-1.5" /> Message
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setShowShareCoins(true)}
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                className="rounded-xl text-muted-foreground hover:text-destructive"
                onClick={() => setShowReport(true)}
                size="sm"
              >
                <Flag className="w-4 h-4" />
              </Button>
            </div>
          )}

          {isOwnProfile && (
            <div className="flex gap-2 mt-4">
              <Link to="/customer/profile" className="flex-1">
                <Button variant="outline" className="w-full rounded-xl" size="sm">
                  Edit Profile
                </Button>
              </Link>
              <Link to="/customer/coins">
                <Button variant="outline" className="rounded-xl gap-1.5" size="sm">
                  <Sparkles className="w-3.5 h-3.5" /> Coins
                </Button>
              </Link>
            </div>
          )}
        </motion.div>

        {/* Content Grid placeholder — Instagram-style */}
        <motion.div
          className="bg-card rounded-2xl border border-border p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
            <Grid3x3 className="w-4 h-4 text-foreground" />
            <span className="text-sm font-display font-bold">Activity</span>
          </div>

          {(stats?.totalOrders || 0) === 0 ? (
            <div className="text-center py-10">
              <ShoppingBag className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No activity yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: Math.min(stats?.totalOrders || 0, 9) }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl bg-secondary/60 flex items-center justify-center"
                >
                  <ShoppingBag className="w-5 h-5 text-muted-foreground/50" />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Share Coins Dialog */}
      <Dialog open={showShareCoins} onOpenChange={setShowShareCoins}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">Share Points with @{profile.username}</DialogTitle>
            <DialogDescription>Send points from your balance to this user.</DialogDescription>
          </DialogHeader>
          <CoinTransfer availableCoins={wallet?.total_coins || 0} prefillUsername={profile.username || undefined} />
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <ReportDialog
        open={showReport}
        onOpenChange={setShowReport}
        reportedUserId={userId}
      />
    </DashboardLayout>
  );
}
