import { useRef, useCallback, useEffect } from 'react';

// Generate a short notification beep using Web Audio API
function createBeep(frequency = 880, duration = 150, volume = 0.3): () => void {
  return () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = frequency;
      osc.type = 'sine';
      gain.gain.value = volume;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration / 1000);
    } catch {
      // Audio not available
    }
  };
}

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Vibration not available
  }
}

/**
 * Plays a short notification beep + vibrate for new messages.
 */
export function useMessageNotificationSound() {
  const play = useCallback(() => {
    createBeep(880, 150, 0.3)();
    vibrate(200);
  }, []);

  return { play };
}

/**
 * Plays a continuous ringing sound for incoming orders.
 * Returns play/stop controls. Auto-stops on unmount.
 */
export function useOrderRingSound() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    vibrate(0); // stop vibration
  }, []);

  const playRing = useCallback(() => {
    // Don't start if already ringing
    if (intervalRef.current) return;

    const ringOnce = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;
        const now = ctx.currentTime;

        // Two-tone ring pattern
        [0, 0.15, 0.3].forEach((offset, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = i % 2 === 0 ? 1200 : 900;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.4, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);
          osc.start(now + offset);
          osc.stop(now + offset + 0.12);
        });
      } catch {
        // Audio not available
      }
      vibrate([300, 200, 300]);
    };

    ringOnce();
    // Repeat every 2 seconds
    intervalRef.current = setInterval(ringOnce, 2000);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { playRing, stop };
}
