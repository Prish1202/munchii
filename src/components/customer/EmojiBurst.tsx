import { useState, useEffect } from 'react';

interface BurstEmoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  delay: number;
  offsetX: number;
  offsetY: number;
}

interface EmojiBurstProps {
  emoji: string;
  trigger: number;
  originX?: number; // center X in viewport px
  originY?: number; // center Y in viewport px
}

export function EmojiBurst({ emoji, trigger, originX, originY }: EmojiBurstProps) {
  const [bursts, setBursts] = useState<BurstEmoji[]>([]);

  useEffect(() => {
    if (trigger <= 0) return;

    const cx = originX ?? window.innerWidth / 2;
    const cy = originY ?? window.innerHeight / 2;

    const count = 14 + Math.floor(Math.random() * 6);
    const newBursts: BurstEmoji[] = Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const dist = 60 + Math.random() * 120;
      return {
        id: Date.now() + i,
        emoji,
        x: cx,
        y: cy,
        scale: 0.7 + Math.random() * 0.8,
        rotation: -40 + Math.random() * 80,
        delay: Math.random() * 200,
        offsetX: Math.cos(angle) * dist,
        offsetY: Math.sin(angle) * dist - 40 - Math.random() * 60, // bias upward
      };
    });

    setBursts(prev => [...prev, ...newBursts]);

    const timer = setTimeout(() => {
      setBursts(prev => prev.filter(b => !newBursts.find(nb => nb.id === b.id)));
    }, 1800);

    return () => clearTimeout(timer);
  }, [trigger, emoji, originX, originY]);

  if (bursts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {bursts.map((b) => (
        <span
          key={b.id}
          className="absolute animate-emoji-burst"
          style={{
            left: `${b.x}px`,
            top: `${b.y}px`,
            fontSize: `${b.scale * 1.8}rem`,
            animationDelay: `${b.delay}ms`,
            '--burst-rotation': `${b.rotation}deg`,
            '--burst-x': `${b.offsetX}px`,
            '--burst-y': `${b.offsetY}px`,
          } as React.CSSProperties}
        >
          {b.emoji}
        </span>
      ))}
    </div>
  );
}
