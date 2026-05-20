import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const { isOnline } = useOnlineStatus();
  if (isOnline) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-[9998] bg-destructive text-destructive-foreground text-xs font-medium py-1.5 px-3 flex items-center justify-center gap-2 safe-area-top shadow-md">
      <WifiOff className="w-3.5 h-3.5" />
      <span>You're offline — messages will send when you're back online</span>
    </div>
  );
}
