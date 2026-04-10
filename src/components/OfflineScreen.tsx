import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface OfflineScreenProps {
  onRetry: () => void;
}

export function OfflineScreen({ onRetry }: OfflineScreenProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    onRetry();
    setTimeout(() => setRetrying(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background text-foreground px-6">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center">
        <div className="rounded-full bg-muted p-6">
          <WifiOff className="h-12 w-12 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">You're Offline</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            It looks like you've lost your internet connection. Please check your Wi-Fi or mobile data and try again.
          </p>
        </div>

        <Button
          onClick={handleRetry}
          disabled={retrying}
          size="lg"
          className="gap-2 min-w-[160px]"
        >
          <RefreshCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
          {retrying ? "Checking…" : "Retry"}
        </Button>

        <p className="text-xs text-muted-foreground/60 mt-4">
          Munchii needs an internet connection to work.
        </p>
      </div>
    </div>
  );
}
