import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// OneSignal service worker handles both push notifications and offline caching.
// Only register on production (not in iframes or preview domains).
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreview =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if ("serviceWorker" in navigator && !isInIframe && !isPreview) {
  // Unregister old /sw.js if present, then OneSignal SDK will register its own worker
  navigator.serviceWorker.getRegistrations().then((regs) =>
    regs.forEach((r) => {
      if (r.active?.scriptURL?.includes('/sw.js')) {
        r.unregister();
      }
    })
  );
} else if (isInIframe || isPreview) {
  navigator.serviceWorker?.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister())
  );
}

createRoot(document.getElementById("root")!).render(<App />);
