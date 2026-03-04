import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Coins, Users, MessageCircle, Sparkles } from 'lucide-react';

const BANNERS = [
  {
    id: 1,
    title: 'Get 4% points',
    subtitle: 'on every order — 1 point = ₹1',
    icon: Coins,
    gradient: 'from-primary to-primary-glow',
    emoji: '🎯',
  },
  {
    id: 2,
    title: 'Share points',
    subtitle: 'with your campus friends',
    icon: Users,
    gradient: 'from-social to-primary',
    emoji: '🤝',
  },
  {
    id: 3,
    title: 'E2EE Chat',
    subtitle: 'private food convos',
    icon: MessageCircle,
    gradient: 'from-accent to-social',
    emoji: '💬',
  },
];

export function PromoBanner() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % BANNERS.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 3500);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {BANNERS.map((banner) => (
          <div key={banner.id} className="w-full flex-shrink-0">
            <div className={cn(
              'relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br',
              banner.gradient
            )}>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl">
                  {banner.emoji}
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-primary-foreground">{banner.title}</h3>
                  <p className="text-sm text-primary-foreground/80">{banner.subtitle}</p>
                </div>
              </div>
              {/* Decorative */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute right-8 -top-2 w-12 h-12 rounded-full bg-white/5" />
            </div>
          </div>
        ))}
      </div>
      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === current ? 'w-6 bg-primary-foreground' : 'w-1.5 bg-primary-foreground/40'
            )}
          />
        ))}
      </div>
    </div>
  );
}
