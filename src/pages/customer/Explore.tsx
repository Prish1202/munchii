import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Loader2, User, Trophy, Coins, Crown, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

function useSearchProfiles(query: string) {
  return useQuery({
    queryKey: ['search-profiles', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url, campus')
        .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: query.length >= 2,
  });
}

const RANK_STYLES = [
  'gradient-primary text-primary-foreground',
  'bg-secondary text-secondary-foreground',
  'gradient-coin text-primary-foreground',
];

const RANK_EMOJIS = ['👑', '🔥', '✨'];

export default function Explore() {
  const [search, setSearch] = useState('');
  const { data: profiles, isLoading: loadingProfiles } = useSearchProfiles(search);
  const { data: leaderboard, isLoading: loadingLeaderboard } = useLeaderboard();

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-24 md:pb-6 max-w-3xl mx-auto">
        <div className="gradient-surface rounded-[2rem] border border-border/80 p-5 shadow-soft">
          <h1 className="font-display font-bold text-2xl">Explore</h1>
          <p className="text-sm text-muted-foreground mt-1">Discover people, badges, and top earners on Munchii.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by @username or name..."
            className="w-full pl-12 pr-4 py-3.5 rounded-[1.4rem] border border-border bg-card text-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm font-medium placeholder:text-muted-foreground/60"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {search.length >= 2 ? (
          <div className="space-y-2">
            {loadingProfiles ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !profiles || profiles.length === 0 ? (
              <div className="text-center py-16 gradient-surface rounded-[1.8rem] border border-border/70 shadow-soft">
                <User className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-display font-semibold">No users found</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different username or name</p>
              </div>
            ) : (
              profiles.map((profile, i) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={`/customer/user/${profile.id}`}
                    className="flex items-center gap-3 p-3.5 rounded-[1.4rem] bg-card border border-border shadow-soft hover:-translate-y-0.5 transition-all"
                  >
                    <Avatar className="w-12 h-12 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-display font-bold">
                        {profile.name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-sm truncate">{profile.name}</p>
                      {profile.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
                    </div>
                    {profile.campus && (
                      <Badge variant="secondary" className="text-[10px] shrink-0 rounded-full">🎓 {profile.campus}</Badge>
                    )}
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <motion.div
              className="flex items-center gap-3 gradient-surface rounded-[1.6rem] border border-border/80 p-4 shadow-soft"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.div
                className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center glow-primary"
                animate={{ rotate: [0, 6, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </motion.div>
              <div>
                <h2 className="font-display font-bold text-lg">Campus Leaderboard</h2>
                <p className="text-xs text-muted-foreground">Top earners and active foodies this week</p>
              </div>
            </motion.div>

            {loadingLeaderboard ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !leaderboard || leaderboard.length === 0 ? (
              <div className="text-center py-12 gradient-surface rounded-[1.8rem] border border-border shadow-soft">
                <Coins className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-display font-semibold">No rankings yet</p>
                <p className="text-sm text-muted-foreground mt-1">Start earning coins to appear here!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.length >= 3 && (
                  <div className="flex items-end justify-center gap-3 mb-6 pt-2">
                    {[1, 0, 2].map((rank) => {
                      const entry = leaderboard[rank];
                      if (!entry) return null;
                      const height = rank === 0 ? 'h-24' : rank === 1 ? 'h-20' : 'h-16';
                      return (
                        <motion.div
                          key={entry.user_id}
                          className="flex flex-col items-center"
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + rank * 0.15, type: 'spring' }}
                        >
                          <motion.div className="text-xl mb-1" animate={rank === 0 ? { y: [0, -5, 0], scale: [1, 1.1, 1] } : {}} transition={{ duration: 2, repeat: Infinity }}>
                            {RANK_EMOJIS[rank]}
                          </motion.div>
                          <Avatar className="w-11 h-11 border-2 border-primary/20 shadow-soft">
                            <AvatarFallback className="font-display font-bold text-xs bg-primary/10 text-primary">
                              {entry.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-xs font-bold mt-1 truncate max-w-[70px]">{entry.name}</p>
                          <p className="text-[10px] text-primary font-bold">{entry.total_coins} pts</p>
                          <div className={`w-16 ${height} rounded-t-[1rem] mt-1 ${rank === 0 ? 'gradient-primary' : rank === 1 ? 'bg-secondary' : 'gradient-coin'} opacity-70`} />
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {leaderboard.map((entry, i) => (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.06, duration: 0.3 }}
                  >
                    <Link
                      to={`/customer/user/${entry.user_id}`}
                      className={`flex items-center gap-3 p-3.5 rounded-[1.5rem] border transition-all hover:-translate-y-0.5 shadow-soft ${
                        i < 3 ? 'gradient-surface border-primary/20' : 'bg-card border-border'
                      }`}
                    >
                      <motion.div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 font-display font-bold text-sm ${
                          i < 3 ? RANK_STYLES[i] : 'bg-muted text-muted-foreground'
                        }`}
                        whileHover={{ scale: 1.12 }}
                      >
                        {i === 0 ? <Crown className="w-4 h-4" /> : `#${i + 1}`}
                      </motion.div>

                      <Avatar className="w-10 h-10 border border-border">
                        <AvatarFallback className="font-display font-bold text-sm bg-primary/10 text-primary">
                          {entry.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-display font-bold text-sm truncate">{entry.name}</p>
                          {i < 3 && (
                            <motion.span
                              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary"
                              animate={{ scale: [1, 1.08, 1] }}
                              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2 }}
                            >
                              <Sparkles className="w-3 h-3" /> Hot streak
                            </motion.span>
                          )}
                        </div>
                        {entry.username && <p className="text-xs text-muted-foreground">@{entry.username}</p>}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <motion.div animate={i < 3 ? { y: [0, -3, 0] } : {}} transition={{ duration: 1.5, repeat: Infinity }}>
                          <Coins className="w-4 h-4 text-coin" />
                        </motion.div>
                        <span className="font-display font-bold text-sm text-foreground">{entry.total_coins}</span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
