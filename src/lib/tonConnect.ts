import { TonConnect } from "@tonconnect/sdk";

const TONCONNECT_MANIFEST_URL =
  import.meta.env.VITE_TONCONNECT_MANIFEST_URL?.trim()
  || `${window.location.origin}/tonconnect-manifest.json`;

const TONCONNECT_WALLETS_LIST_URL =
  import.meta.env.VITE_TONCONNECT_WALLETS_LIST_URL?.trim()
  || `${window.location.origin}/tonconnect-wallets-v2.json`;

export const tonConnectConnector = new TonConnect({
  manifestUrl: TONCONNECT_MANIFEST_URL,
  walletsListSource: TONCONNECT_WALLETS_LIST_URL,
  analytics: { mode: "off" },
});

export { TONCONNECT_MANIFEST_URL, TONCONNECT_WALLETS_LIST_URL };
