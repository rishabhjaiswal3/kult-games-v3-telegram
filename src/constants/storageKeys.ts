/**
 * Single registry for localStorage / sessionStorage key strings.
 * Do not hardcode these values elsewhere.
 */
export const StorageKeys = {
  local: {
    /** JWT for main Kult API (`Authorization: Bearer`). */
    authToken: "kult_token",
    /** Wallet address string persisted after main API login. */
    walletAddress: "kult_wallet",
    /** Anonymous KULT AI chat user id. */
    kultAiUserId: "kult-ai-user-id",
    /** AI Warzone agent hot wallet (for fund API). */
    warzoneHotWalletAddress: "kult_warzone_hot_wallet",
    /** Full AI Warzone agent object (JSON) from create / GET agent. */
    aiAgentInfo: "ai_agent_info",
    /** AI Arena gateway JWT access token (Bearer for /v1/*). */
    aiArenaAccessToken: "kult_aiarena_access_token",
    /** AI Arena gateway refresh token for silent renewal. */
    aiArenaRefreshToken: "kult_aiarena_refresh_token",
    /** AI Arena gateway token expiry epoch (ms). */
    aiArenaTokenExpiresAt: "kult_aiarena_token_expires_at",
    /** AI Arena user id from /v1/auth/privy response. */
    aiArenaUserId: "kult_aiarena_user_id",
    /** AI Arena custodial solana wallet address. */
    aiArenaCustodialSolanaAddress: "kult_aiarena_custodial_solana",
    /** Last AI Arena battle id seen or created in the live arena flow. */
    aiArenaLastBattleId: "kult_aiarena_last_battle_id",
  },
  session: {
    /** Wallet address after Warzone agent binding sign. */
    warzoneAgentWalletVerified: "kult_ai_agent_wallet_verified",
    /** Derived Warzone agent id (`address_keccak…`). */
    warzoneAgentId: "kult_warzone_agent_id",
  },
} as const;

/** Shorthand for interceptors and auth — same as `StorageKeys.local.authToken`. */
export const TOKEN_KEY = StorageKeys.local.authToken;
/** Shorthand — same as `StorageKeys.local.walletAddress`. */
export const WALLET_KEY = StorageKeys.local.walletAddress;

export type LocalStorageKey = (typeof StorageKeys.local)[keyof typeof StorageKeys.local];
export type SessionStorageKey = (typeof StorageKeys.session)[keyof typeof StorageKeys.session];
