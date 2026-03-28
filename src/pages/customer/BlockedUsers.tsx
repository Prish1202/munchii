import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ArrowLeft, Ban, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBlockedUsers, useToggleBlock } from '@/hooks/useBlockedUsers';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function BlockedUsers() {
  const navigate = useNavigate();
  const { data: blockedUsers, isLoading } = useBlockedUsers();
  const toggleBlock = useToggleBlock();

  const blockedIds = blockedUsers?.map(b => b.blocked_id) || [];

  const { data: profiles } = useQuery({
    queryKey: ['blocked-profiles', blockedIds],
    queryFn: async () => {
      if (blockedIds.length === 0) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .in('id', blockedIds);
      return data || [];
    },
    enabled: blockedIds.length > 0,
  });

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto pb-28 md:pb-6 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/customer/account-privacy')} className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-lg">Blocked Users</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !blockedUsers || blockedUsers.length === 0 ? (
          <motion.div
            className="bg-card rounded-2xl border border-border p-8 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Ban className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display font-bold text-base mb-1">No Blocked Users</h3>
            <p className="text-sm text-muted-foreground">
              When you block someone from their profile, they'll appear here.
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="bg-card rounded-2xl border border-border overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {profiles?.map((profile) => (
              <div key={profile.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {profile.name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{profile.name}</p>
                  {profile.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => toggleBlock.mutate({ targetUserId: profile.id, isBlocked: true })}
                  disabled={toggleBlock.isPending}
                >
                  Unblock
                </Button>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
