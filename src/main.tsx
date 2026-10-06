import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import "./index.css";

// Clean up any previously registered web service workers (legacy push/offline workers).
navigator.serviceWorker?.getRegistrations().then((regs) =>
  regs.forEach((r) => r.unregister())
).catch(() => undefined);

createRoot(document.getElementById("root")!).render(<App />);
