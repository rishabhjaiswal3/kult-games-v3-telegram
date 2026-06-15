import axios from "axios";
import { StorageKeys } from "@/constants/storageKeys";
import { AI_ARENA_GATEWAY_URL } from "@/lib/serviceUrls";

type AiArenaPrivyAuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
  walletAddress: string;
  custodialSolanaAddress?: string;
  isNewUser?: boolean;
};

type AiArenaRefreshResponse = {
  accessToken: string;
  expiresIn: number;
};

function safeLocalStorageGet(key: string): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(key);
}

function safeLocalStorageSet(key: string, value: string) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, value);
}

export function getAiArenaAccessToken() {
  return safeLocalStorageGet(StorageKeys.local.aiArenaAccessToken);
}

export function getAiArenaRefreshToken() {
  return safeLocalStorageGet(StorageKeys.local.aiArenaRefreshToken);
}

export function clearAiArenaAuthTokens() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(StorageKeys.local.aiArenaAccessToken);
  localStorage.removeItem(StorageKeys.local.aiArenaRefreshToken);
  localStorage.removeItem(StorageKeys.local.aiArenaTokenExpiresAt);
  localStorage.removeItem(StorageKeys.local.aiArenaUserId);
  localStorage.removeItem(StorageKeys.local.aiArenaCustodialSolanaAddress);
}

function persistPrivyExchange(data: AiArenaPrivyAuthResponse) {
  safeLocalStorageSet(StorageKeys.local.aiArenaAccessToken, data.accessToken);
  safeLocalStorageSet(StorageKeys.local.aiArenaRefreshToken, data.refreshToken);
  safeLocalStorageSet(StorageKeys.local.aiArenaTokenExpiresAt, String(Date.now() + data.expiresIn * 1000));
  safeLocalStorageSet(StorageKeys.local.aiArenaUserId, data.userId);
  if (data.custodialSolanaAddress) {
    safeLocalStorageSet(StorageKeys.local.aiArenaCustodialSolanaAddress, data.custodialSolanaAddress);
  }
}

export async function exchangePrivyTokenForAiArenaToken(privyAccessToken: string) {
  const { data } = await axios.post<AiArenaPrivyAuthResponse>(
    `${AI_ARENA_GATEWAY_URL}/v1/auth/privy`,
    { accessToken: privyAccessToken },
    { headers: { "Content-Type": "application/json" } }
  );
  persistPrivyExchange(data);
  return data;
}

/** Never throws — AI Arena auth is optional and must not break Kult login. */
export async function tryExchangePrivyTokenForAiArenaToken(privyAccessToken: string) {
  try {
    return await exchangePrivyTokenForAiArenaToken(privyAccessToken);
  } catch (err) {
    console.warn("[AI Arena] Token exchange failed (non-blocking):", err);
    return null;
  }
}

export async function refreshAiArenaAccessToken() {
  const refreshToken = getAiArenaRefreshToken();
  if (!refreshToken) throw new Error("Missing AI Arena refresh token");

  const { data } = await axios.post<AiArenaRefreshResponse>(
    `${AI_ARENA_GATEWAY_URL}/v1/auth/refresh`,
    { refreshToken },
    { headers: { "Content-Type": "application/json" } }
  );

  safeLocalStorageSet(StorageKeys.local.aiArenaAccessToken, data.accessToken);
  safeLocalStorageSet(StorageKeys.local.aiArenaTokenExpiresAt, String(Date.now() + data.expiresIn * 1000));
  return data.accessToken;
}
