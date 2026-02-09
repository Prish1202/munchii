import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import promoBanner1 from '@/assets/promo-banner-1.jpg';
import promoBanner2 from '@/assets/promo-banner-2.jpg';

const BANNERS = [
  { id: 1, image: promoBanner1, alt: 'Up to 50% off on your favorite meals' },
  { id: 2, image: promoBanner2, alt: 'Free delivery on your first order' },
];

export function PromoBanner() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % BANNERS.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {BANNERS.map((banner) => (
          <div key={banner.id} className="w-full flex-shrink-0">
            <div className="aspect-[2.2/1] sm:aspect-[3/1] w-full overflow-hidden rounded-2xl">
              <img
                src={banner.image}
                alt={banner.alt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
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
              'h-1.5 rounded-full transition-all',
              i === current ? 'w-6 bg-primary-foreground' : 'w-1.5 bg-primary-foreground/50'
            )}
          />
        ))}
      </div>
    </div>
  );
}
