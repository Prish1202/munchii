import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initNativePush } from '@/lib/nativePush';

/** Must be rendered inside the router so taps on notifications can navigate. */
export function NativePushInit() {
  const navigate = useNavigate();
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    initNativePush(navigate).then((fn) => {
      if (cancelled) fn();
      else cleanup = fn;
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [navigate]);
  return null;
}
