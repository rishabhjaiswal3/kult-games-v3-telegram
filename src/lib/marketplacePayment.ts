import type { AllowedChainConfig } from "@/lib/chain";

export const MARKETPLACE_PAYMENT_TOKENS = ["USDC", "USDT"] as const;

export type MarketplacePaymentToken = (typeof MARKETPLACE_PAYMENT_TOKENS)[number];

type ImportMetaEnvWithLegacy = ImportMetaEnv & {
  MARKETPLACE_CONTRACT_ADDRESS?: string;
  VITE_MARKETPLACE_CHAIN_NAME?: string;
  VITE_MARKETPLACE_RPC_URL?: string;
  VITE_MARKETPLACE_EXPLORER_URL?: string;
  VITE_MARKETPLACE_NATIVE_NAME?: string;
  VITE_MARKETPLACE_NATIVE_SYMBOL?: string;
  VITE_MARKETPLACE_NATIVE_DECIMALS?: string;
};

const KNOWN_MARKETPLACE_CHAINS: Record<number, AllowedChainConfig> = {
  8453: {
    caip2: "eip155:8453",
    decimalChainId: 8453,
    hexChainId: "0x2105",
    chainName: "Base",
    rpcUrls: ["https://mainnet.base.org"],
    blockExplorerUrls: ["https://basescan.org"],
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  16661: {
    caip2: "eip155:16661",
    decimalChainId: 16661,
    hexChainId: "0x4115",
    chainName: "0G Mainnet",
    rpcUrls: ["https://evmrpc.0g.ai"],
    blockExplorerUrls: ["https://chainscan.0g.ai"],
    nativeCurrency: {
      name: "0G",
      symbol: "0G",
      decimals: 18,
    },
  },
};

function readEnvValue(key: keyof ImportMetaEnvWithLegacy): string {
  const value = (import.meta.env as ImportMetaEnvWithLegacy)[key];
  return typeof value === "string" ? value.trim() : "";
}

function parsePositiveInteger(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined;
}

export function getMarketplacePaymentConfig() {
  const marketplaceContractAddress =
    readEnvValue("VITE_MARKETPLACE_CONTRACT_ADDRESS") || readEnvValue("MARKETPLACE_CONTRACT_ADDRESS");
  const chainIdRaw = readEnvValue("VITE_MARKETPLACE_CHAIN_ID");
  const marketplaceChainId = Number.isFinite(Number(chainIdRaw)) && Number(chainIdRaw) > 0
    ? Number(chainIdRaw)
    : 8453;

  const tokenAddressBySymbol: Record<MarketplacePaymentToken, string> = {
    USDC: readEnvValue("VITE_USDC_CONTRACT_ADDRESS"),
    USDT: readEnvValue("VITE_USDT_CONTRACT_ADDRESS"),
  };

  return {
    marketplaceContractAddress,
    marketplaceChainId,
    tokenAddressBySymbol,
  };
}

export function normalizeMarketplacePaymentToken(value: string | null | undefined): MarketplacePaymentToken {
  const upper = (value ?? "").trim().toUpperCase();
  return upper === "USDT" ? "USDT" : "USDC";
}

export function getMarketplaceChainConfig(chainIdOverride?: number): AllowedChainConfig {
  const configuredChainId = getMarketplacePaymentConfig().marketplaceChainId;
  const chainId = chainIdOverride ?? configuredChainId;
  const fallback = KNOWN_MARKETPLACE_CHAINS[chainId];
  const useMarketplaceEnvOverrides = chainId === configuredChainId;
  const nativeDecimals =
    (useMarketplaceEnvOverrides
      ? parsePositiveInteger(readEnvValue("VITE_MARKETPLACE_NATIVE_DECIMALS"))
      : undefined) ??
    fallback?.nativeCurrency?.decimals ??
    18;

  return {
    caip2: `eip155:${chainId}`,
    decimalChainId: chainId,
    hexChainId: `0x${chainId.toString(16)}` as `0x${string}`,
    chainName:
      (useMarketplaceEnvOverrides ? readEnvValue("VITE_MARKETPLACE_CHAIN_NAME") : "") ||
      fallback?.chainName ||
      `Chain ${chainId}`,
    rpcUrls:
      useMarketplaceEnvOverrides && readEnvValue("VITE_MARKETPLACE_RPC_URL")
        ? [readEnvValue("VITE_MARKETPLACE_RPC_URL")]
        : fallback?.rpcUrls,
    blockExplorerUrls:
      useMarketplaceEnvOverrides && readEnvValue("VITE_MARKETPLACE_EXPLORER_URL")
        ? [readEnvValue("VITE_MARKETPLACE_EXPLORER_URL")]
        : fallback?.blockExplorerUrls,
    nativeCurrency: {
      name:
        (useMarketplaceEnvOverrides ? readEnvValue("VITE_MARKETPLACE_NATIVE_NAME") : "") ||
        fallback?.nativeCurrency?.name ||
        "Native Token",
      symbol:
        (useMarketplaceEnvOverrides ? readEnvValue("VITE_MARKETPLACE_NATIVE_SYMBOL") : "") ||
        fallback?.nativeCurrency?.symbol ||
        "ETH",
      decimals: nativeDecimals,
    },
  };
}

export function getMarketplaceChainLabel(chainIdOverride?: number): string {
  return getMarketplaceChainConfig(chainIdOverride).chainName ?? `Chain ${chainIdOverride ?? 0}`;
}

export const unifiedMarketplaceAbi = [
  {
    type: "function",
    name: "purchase",
    stateMutability: "nonpayable",
    inputs: [
      { name: "gameId", type: "string" },
      { name: "category", type: "string" },
      { name: "itemId", type: "string" },
      { name: "paymentToken", type: "address" },
      { name: "orderId", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;
