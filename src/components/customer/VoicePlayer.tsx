import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoicePlayerProps {
  src: string;
  isOwn: boolean;
}

export function VoicePlayer({ src, isOwn }: VoicePlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    });

    audio.addEventListener('ended', () => {
      setPlaying(false);
      setProgress(0);
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [src]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const formatTime = (s: number) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <button
        onClick={toggle}
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors',
          isOwn
            ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30'
            : 'bg-primary/10 hover:bg-primary/20'
        )}
      >
        {playing ? (
          <Pause className={cn('w-4 h-4', isOwn ? 'text-primary-foreground' : 'text-primary')} />
        ) : (
          <Play className={cn('w-4 h-4 ml-0.5', isOwn ? 'text-primary-foreground' : 'text-primary')} />
        )}
      </button>
      <div className="flex-1 space-y-1">
        <div className={cn('h-1 rounded-full overflow-hidden', isOwn ? 'bg-primary-foreground/20' : 'bg-muted')}>
          <div
            className={cn('h-full rounded-full transition-all', isOwn ? 'bg-primary-foreground/60' : 'bg-primary/60')}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={cn('text-[10px]', isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
          {formatTime(playing ? (audioRef.current?.currentTime || 0) : duration)}
        </span>
      </div>
    </div>
  );
}
