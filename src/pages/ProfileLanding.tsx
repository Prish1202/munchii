import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Smartphone, Globe, Loader2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { resolveStorageUrl } from '@/lib/utils';
import { PLAY_STORE_URL, isMobileDevice, profileDeepLink } from '@/lib/appLinks';

export default function ProfileLanding() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['landing-profile', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url, bio, campus')
        .eq('id', userId!)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  const deepLink = useMemo(() => (userId ? profileDeepLink(userId) : ''), [userId]);

  useEffect(() => {
    if (!profile) return;
    document.title = `${profile.name} on Munchii`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        `${profile.name}${profile.username ? ` (@${profile.username})` : ''} on Munchii — pickup-only campus food marketplace.`,
      );
    }
  }, [profile]);

  const openInApp = () => {
    if (!deepLink) return;
    const start = Date.now();
    window.location.href = deepLink;
    // If the app didn't take over within ~1.5s, offer the Play Store.
    window.setTimeout(() => {
      if (Date.now() - start < 2200 && !document.hidden) {
        window.location.href = PLAY_STORE_URL;
      }
    }, 1500);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-10 bg-gradient-to-b from-primary/10 via-background to-background">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-card border border-border rounded-3xl shadow-soft p-6 text-center space-y-4"
      >
        {isLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="w-24 h-24 mx-auto rounded-full p-[3px] gradient-primary">
              <Avatar className="w-full h-full border-2 border-card">
                {profile?.avatar_url ? (
                  <AvatarImage src={resolveStorageUrl(profile.avatar_url)} alt={profile?.name || 'Profile'} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-display font-bold">
                  {profile?.name?.charAt(0)?.toUpperCase() || '🍔'}
                </AvatarFallback>
              </Avatar>
            </div>

            <div>
              <h1 className="font-display font-bold text-xl">{profile?.name || 'Munchii user'}</h1>
              {profile?.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
              {profile?.bio && <p className="text-sm text-foreground/80 mt-2">{profile.bio}</p>}
              {profile?.campus && <p className="text-xs text-muted-foreground mt-1">🎓 {profile.campus}</p>}
            </div>

            <div className="space-y-2.5 pt-1">
              {isMobile && (
                <Button className="w-full rounded-xl gradient-primary border-0 h-12 text-base" onClick={openInApp}>
                  <Smartphone className="w-5 h-5 mr-2" /> Open in App
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full rounded-xl h-11"
                onClick={() => navigate(`/customer/user/${userId}`)}
              >
                <Globe className="w-4 h-4 mr-2" /> Continue in browser
              </Button>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-xl h-11 border border-border bg-secondary/50 text-sm font-medium hover:bg-secondary transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> Get Munchii on Play Store
              </a>
            </div>

            <p className="text-[11px] text-muted-foreground pt-1">
              Continuing in the browser may ask you to log in or sign up.
            </p>
          </>
        )}
      </motion.section>
    </main>
  );
}
