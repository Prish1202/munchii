import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register minimal service worker for offline shell caching (production only)
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreview =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if ("serviceWorker" in navigator && !isInIframe && !isPreview) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
} else if (isInIframe || isPreview) {
  navigator.serviceWorker?.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister())
  );
}

createRoot(document.getElementById("root")!).render(<App />);
