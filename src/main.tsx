import "./polyfills";
import { createRoot } from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import App from "./App.tsx";
import "./index.css";
import { privyConfig } from "@/lib/privyConfig";
import { initTelegramMiniApp } from "@/lib/telegramMiniApp";

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID ?? "";
const TONCONNECT_MANIFEST_URL =
  import.meta.env.VITE_TONCONNECT_MANIFEST_URL?.trim()
  || `${window.location.origin}/tonconnect-manifest.json`;

initTelegramMiniApp();

createRoot(document.getElementById("root")!).render(
  <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
    <TonConnectUIProvider manifestUrl={TONCONNECT_MANIFEST_URL}>
      <App />
    </TonConnectUIProvider>
  </PrivyProvider>
);
