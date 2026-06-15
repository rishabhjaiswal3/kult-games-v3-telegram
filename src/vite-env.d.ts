/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_KULT_AI_API_URL?: string;
  readonly VITE_MARKETPLACE_CONTRACT_ADDRESS?: string;
  readonly VITE_MARKETPLACE_CHAIN_ID?: string;
  readonly VITE_USDC_CONTRACT_ADDRESS?: string;
  readonly VITE_USDT_CONTRACT_ADDRESS?: string;
  readonly VITE_AI_ARENA_GATEWAY_URL?: string;
  readonly VITE_AI_ARENA_BEARER_TOKEN?: string;
  /** Embedded Moments app URL (full page iframe on /moments). */
  readonly VITE_MOMENTS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.MOV' {
  const src: string;
  export default src;
}
