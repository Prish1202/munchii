import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=co.median.android.qdozdjm';

const DONE_KEY = 'munchii_rating_done';
const PENDING_KEY = 'munchii_rating_pending';
const SNOOZE_KEY = 'munchii_rating_snooze_until';
const LOGIN_COUNT_KEY = 'munchii_login_count';
export const RATE_EVENT = 'munchii:rate-trigger';

/** Call after a successful login. Triggers the prompt on the 3rd login. */
export function recordLoginForRating() {
  const n = Number(localStorage.getItem(LOGIN_COUNT_KEY) || 0) + 1;
  localStorage.setItem(LOGIN_COUNT_KEY, String(n));
  if (n === 3) localStorage.setItem(PENDING_KEY, '1');
}

/** Call after a completed/paid order. */
export function triggerRatingPrompt() {
  localStorage.setItem(PENDING_KEY, '1');
  window.dispatchEvent(new Event(RATE_EVENT));
}

function canShow() {
  if (localStorage.getItem(DONE_KEY)) return false;
  if (Number(localStorage.getItem(SNOOZE_KEY) || 0) > Date.now()) return false;
  return localStorage.getItem(PENDING_KEY) === '1';
}

export function RatingPrompt() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    const check = () => { if (canShow()) window.setTimeout(() => setOpen(true), 1800); };
    check();
    window.addEventListener(RATE_EVENT, check);
    return () => window.removeEventListener(RATE_EVENT, check);
  }, [isAuthenticated]);

  const later = () => {
    localStorage.removeItem(PENDING_KEY);
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + 7 * 24 * 3600 * 1000));
    setOpen(false);
  };
  const rate = () => {
    localStorage.setItem(DONE_KEY, '1');
    localStorage.removeItem(PENDING_KEY);
    setOpen(false);
    window.open(PLAY_STORE_URL, '_blank', 'noopener');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[90] bg-foreground/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={later} />
          <motion.div
            role="dialog" aria-modal="true" aria-labelledby="rate-title"
            className="fixed inset-x-0 bottom-0 z-[91] mx-auto w-full max-w-md p-4"
            initial={{ y: '110%' }} animate={{ y: 0 }} exit={{ y: '110%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          >
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
              <div className="gradient-primary px-6 pb-8 pt-6 text-center text-primary-foreground">
                <button onClick={later} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1 text-primary-foreground/80 hover:text-primary-foreground"><X className="h-5 w-5" /></button>
                <div className="flex justify-center gap-1">
                  {[0, 1, 2, 3, 4].map(i => (
                    <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15 + i * 0.07 }}>
                      <Star className="h-8 w-8 fill-coin text-coin" />
                    </motion.span>
                  ))}
                </div>
                <h2 id="rate-title" className="mt-4 font-display text-2xl font-bold">How do you like Munchii?</h2>
              </div>
              <div className="space-y-3 p-6 text-center">
                <p className="text-sm text-muted-foreground">Your review on Google Play helps more students skip the queue. It only takes a moment!</p>
                <Button onClick={rate} className="h-12 w-full rounded-xl gradient-primary text-primary-foreground">Rate us on Google Play</Button>
                <Button onClick={later} variant="ghost" className="w-full rounded-xl">Maybe later</Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
