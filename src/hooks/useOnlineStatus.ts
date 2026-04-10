import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const wasOffline = useRef(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline.current) {
        toast.success("You're back online!", { duration: 3000 });
      }
      wasOffline.current = false;
    };
    const handleOffline = () => {
      setIsOnline(false);
      wasOffline.current = true;
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const retry = useCallback(() => {
    // Ping a tiny resource to confirm connectivity
    fetch("/robots.txt", { cache: "no-store" })
      .then(() => setIsOnline(true))
      .catch(() => setIsOnline(false));
  }, []);

  return { isOnline, retry };
}
