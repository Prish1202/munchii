import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Clean up any previously registered web service workers (legacy push/offline workers).
navigator.serviceWorker?.getRegistrations().then((regs) =>
  regs.forEach((r) => r.unregister())
).catch(() => undefined);

createRoot(document.getElementById("root")!).render(<App />);
