import "./polyfills";
import { createRoot } from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import App from "./App.tsx";
import "./index.css";
import { privyConfig } from "@/lib/privyConfig";
import { initTelegramMiniApp } from "@/lib/telegramMiniApp";
import { tonConnectConnector } from "@/lib/tonConnect";

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID ?? "";

initTelegramMiniApp();

createRoot(document.getElementById("root")!).render(
  <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
    <TonConnectUIProvider connector={tonConnectConnector}>
      <App />
    </TonConnectUIProvider>
  </PrivyProvider>
);
