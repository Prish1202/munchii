import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface BurstEmoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  delay: number;
  side: 'left' | 'right';
}

interface EmojiBurstProps {
  emoji: string;
  trigger: number; // increment to trigger
  containerRef?: React.RefObject<HTMLDivElement>;
}

export function EmojiBurst({ emoji, trigger }: EmojiBurstProps) {
  const [bursts, setBursts] = useState<BurstEmoji[]>([]);

  useEffect(() => {
    if (trigger <= 0) return;

    const count = 12 + Math.floor(Math.random() * 8);
    const newBursts: BurstEmoji[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      emoji,
      x: 10 + Math.random() * 80,
      y: 20 + Math.random() * 60,
      scale: 0.6 + Math.random() * 1.2,
      rotation: -30 + Math.random() * 60,
      delay: Math.random() * 400,
      side: Math.random() > 0.5 ? 'left' : 'right',
    }));

    setBursts(prev => [...prev, ...newBursts]);

    const timer = setTimeout(() => {
      setBursts(prev => prev.filter(b => !newBursts.find(nb => nb.id === b.id)));
    }, 2000);

    return () => clearTimeout(timer);
  }, [trigger, emoji]);

  if (bursts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {bursts.map((b) => (
        <span
          key={b.id}
          className="absolute animate-emoji-burst"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            fontSize: `${b.scale * 2}rem`,
            animationDelay: `${b.delay}ms`,
            '--burst-rotation': `${b.rotation}deg`,
            '--burst-x': `${b.side === 'left' ? -20 - Math.random() * 40 : 20 + Math.random() * 40}px`,
            '--burst-y': `${-60 - Math.random() * 100}px`,
          } as React.CSSProperties}
        >
          {b.emoji}
        </span>
      ))}
    </div>
  );
}
