import { useState, useEffect, useCallback } from "react";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

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
