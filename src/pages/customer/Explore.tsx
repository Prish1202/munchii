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

const RANK_COLORS = [
  'from-yellow-400 to-amber-500',
  'from-slate-300 to-slate-400',
  'from-amber-600 to-orange-700',
];

const RANK_EMOJIS = ['👑', '🥈', '🥉'];

export default function Explore() {
  const [search, setSearch] = useState('');
  const { data: profiles, isLoading: loadingProfiles } = useSearchProfiles(search);
  const { data: leaderboard, isLoading: loadingLeaderboard } = useLeaderboard();

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-24 md:pb-6 max-w-3xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="font-display font-bold text-2xl">Explore</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Find people on Munchii</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by @username or name..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm font-medium placeholder:text-muted-foreground/60"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Search Results */}
        {search.length >= 2 ? (
          <div className="space-y-2">
            {loadingProfiles ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !profiles || profiles.length === 0 ? (
              <div className="text-center py-16">
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
                    className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:shadow-md transition-all"
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
                      <Badge variant="secondary" className="text-[10px] shrink-0">🎓 {profile.campus}</Badge>
                    )}
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          /* Leaderboard */
          <div className="space-y-4">
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.div
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Trophy className="w-4 h-4 text-white" />
              </motion.div>
              <div>
                <h2 className="font-display font-bold text-lg">Leaderboard</h2>
                <p className="text-xs text-muted-foreground">Top earners on Munchii</p>
              </div>
            </motion.div>

            {loadingLeaderboard ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !leaderboard || leaderboard.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <Coins className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-display font-semibold">No rankings yet</p>
                <p className="text-sm text-muted-foreground mt-1">Start earning coins to appear here!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Top 3 podium */}
                {leaderboard.length >= 3 && (
                  <div className="flex items-end justify-center gap-3 mb-6 pt-4">
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
                          transition={{ delay: 0.3 + rank * 0.15, type: "spring" }}
                        >
                          <motion.div
                            className="text-xl mb-1"
                            animate={rank === 0 ? { y: [0, -5, 0], scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            {RANK_EMOJIS[rank]}
                          </motion.div>
                          <Avatar className={`w-10 h-10 border-2 ${rank === 0 ? 'border-yellow-400' : rank === 1 ? 'border-slate-300' : 'border-amber-600'}`}>
                            <AvatarFallback className="font-display font-bold text-xs bg-primary/10 text-primary">
                              {entry.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-xs font-bold mt-1 truncate max-w-[70px]">{entry.name}</p>
                          <p className="text-[10px] text-coin font-bold">{entry.total_coins} pts</p>
                          <div className={`w-16 ${height} rounded-t-xl mt-1 bg-gradient-to-t ${RANK_COLORS[rank]} opacity-20`} />
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Rest of leaderboard */}
                {leaderboard.map((entry, i) => (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.06, duration: 0.3 }}
                  >
                    <Link
                      to={`/customer/user/${entry.user_id}`}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all hover:shadow-md ${
                        i < 3 ? 'bg-gradient-to-r from-card to-card border-yellow-400/30' : 'bg-card border-border'
                      }`}
                    >
                      <motion.div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-display font-bold text-sm ${
                          i < 3 ? `bg-gradient-to-br ${RANK_COLORS[i]} text-white` : 'bg-muted text-muted-foreground'
                        }`}
                        whileHover={{ scale: 1.15 }}
                      >
                        {i === 0 ? <Crown className="w-4 h-4" /> : `#${i + 1}`}
                      </motion.div>

                      <Avatar className={`w-10 h-10 ${i < 3 ? 'border-2 border-yellow-400/40' : 'border border-border'}`}>
                        <AvatarFallback className={`font-display font-bold text-sm ${
                          i < 3 ? 'bg-yellow-400/10 text-yellow-700' : 'bg-primary/10 text-primary'
                        }`}>
                          {entry.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-sm truncate">{entry.name}</p>
                        {entry.username && <p className="text-xs text-muted-foreground">@{entry.username}</p>}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <motion.div
                          animate={i < 3 ? { rotate: [0, 360] } : {}}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        >
                          <Coins className="w-4 h-4 text-yellow-500" />
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
