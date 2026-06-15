import type { PrivyClientConfig } from "@privy-io/react-auth";
import { mainnet } from "viem/chains";
import { PRIVY_WALLET_LIST } from "@/lib/privyWalletList";
import { buildAppChain } from "@/lib/zerogChain";

const canUseEmbeddedWallets =
  typeof window === "undefined" || window.isSecureContext;

/**
 * Privy wallet SIWE is verified on auth.privy.io — only known chains (e.g. mainnet) pass.
 * 0G (16661) in the SIWE message returns 422 `invalid_data`. Use mainnet for Privy login,
 * then switch the wallet to 0G after auth (see LoginModal). Kult backend SIWE uses 16661 separately.
 */
export function buildPrivyConfig(): PrivyClientConfig {
  const zeroGChain = buildAppChain();
  return {
    appearance: {
      theme: "dark",
      walletChainType: "ethereum-only",
      showWalletLoginFirst: true,
      walletList: [...PRIVY_WALLET_LIST],
    },
    ...(canUseEmbeddedWallets
      ? {
          embeddedWallets: {
            ethereum: { createOnLogin: "users-without-wallets" as const },
          },
        }
      : {}),
    loginMethods: ["wallet", "email", "google", "telegram"],
    supportedChains: [mainnet, zeroGChain],
    defaultChain: mainnet,
  };
}

export const privyConfig = buildPrivyConfig();
