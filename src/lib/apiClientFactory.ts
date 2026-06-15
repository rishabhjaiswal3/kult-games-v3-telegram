import axios, { type AxiosInstance } from "axios";
import { AI_ARENA_GATEWAY_URL, MAIN_BACKEND } from "@/lib/serviceUrls";
import { TOKEN_KEY, WALLET_KEY } from "@/constants/storageKeys";
import {
  clearAiArenaAuthTokens,
  getAiArenaAccessToken,
  refreshAiArenaAccessToken,
} from "@/lib/aiArenaAuth";

export type ApiServiceId = "main" | "aiArenaGateway";

const SERVICE_BASE_URL: Record<ApiServiceId, string> = {
  main: MAIN_BACKEND,
  aiArenaGateway: AI_ARENA_GATEWAY_URL,
};

function attachAuthHeader(client: AxiosInstance) {
  client.interceptors.request.use(
    (config) => {
      const isAiArenaRequest =
        typeof config.baseURL === "string" && config.baseURL.includes("aiarena-gateway.onrender.com");

      if (isAiArenaRequest) {
        const arenaToken = getAiArenaAccessToken();
        if (arenaToken) {
          config.headers.Authorization = `Bearer ${arenaToken}`;
        }
      } else {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token && token !== "undefined" && token !== "null") {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
}

function attachAiArenaRefreshOn401(client: AxiosInstance) {
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error?.response?.status;
      const original = error?.config as (typeof error.config & { _retry?: boolean }) | undefined;
      if (status !== 401 || !original || original._retry) {
        return Promise.reject(error);
      }

      original._retry = true;
      try {
        const nextAccessToken = await refreshAiArenaAccessToken();
        original.headers = {
          ...(original.headers ?? {}),
          Authorization: `Bearer ${nextAccessToken}`,
        };
        return client.request(original);
      } catch (refreshErr) {
        clearAiArenaAuthTokens();
        return Promise.reject(refreshErr);
      }
    }
  );
}

/**
 * x402 automatic payment interceptor.
 *
 * When the gateway returns 402 Payment Required, this interceptor:
 *   1. Reads the payment requirements from the response body
 *   2. Gets the current agent ID from local storage
 *   3. POSTs to /v1/financial/escrow/x402/pay to deduct from the agent's
 *      custodial ARENA wallet and receive a synthetic tx hash
 *   4. Retries the original request with X-Payment-Tx-Hash + X-Payment-Agent-Id headers
 *
 * Only retries once (_x402Retry flag) to prevent infinite loops.
 */
function attachX402AutoPay(client: AxiosInstance) {
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status   = error?.response?.status;
      const original = error?.config as (typeof error.config & { _x402Retry?: boolean }) | undefined;

      if (status !== 402 || !original || original._x402Retry) {
        return Promise.reject(error);
      }

      const payment = error.response?.data?.payment as {
        amount?: number;
        action?: string;
        currency?: string;
      } | undefined;

      if (!payment?.amount || !payment?.action) return Promise.reject(error);

      // Get stored agent ID
      const { getStoredAiAgentInfo } = await import("@/lib/aiAgentStorage");
      const agentInfo = getStoredAiAgentInfo();
      if (!agentInfo?.agentId) {
        console.warn("[x402] No agent ID in storage — cannot auto-pay");
        return Promise.reject(error);
      }

      original._x402Retry = true;

      try {
        // Pay from agent's custodial wallet
        const payRes = await client.post<{ ok: boolean; txHash: string; agentId: string }>(
          "/v1/financial/escrow/x402/pay",
          { agentId: agentInfo.agentId, amount: payment.amount, purpose: payment.action }
        );

        if (!payRes.data?.ok || !payRes.data?.txHash) {
          console.warn("[x402] Payment initiation returned no txHash");
          return Promise.reject(error);
        }

        const { txHash } = payRes.data;
        console.info(`[x402] Auto-paid ${payment.amount} ARENA for ${payment.action} → tx ${txHash}`);

        // Retry with payment proof headers
        original.headers = {
          ...(original.headers ?? {}),
          "X-Payment-Tx-Hash":  txHash,
          "X-Payment-Agent-Id": agentInfo.agentId,
        };
        return client.request(original);
      } catch (payErr) {
        console.warn("[x402] Auto-pay failed:", payErr);
        return Promise.reject(error); // surface original 402
      }
    }
  );
}

/**
 * Only the main backend uses shared session storage for login; clearing tokens on 401
 * matches existing player/games behavior. Other services get their own client without this.
 */
function attachMainSessionOn401(client: AxiosInstance) {
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(WALLET_KEY);
      }
      return Promise.reject(error);
    }
  );
}

function buildClient(service: ApiServiceId): AxiosInstance {
  const instance = axios.create({
    baseURL: SERVICE_BASE_URL[service],
    headers: {
      "Content-Type": "application/json",
    },
  });

  attachAuthHeader(instance);

  if (service === "main") {
    attachMainSessionOn401(instance);
  }
  if (service === "aiArenaGateway") {
    attachAiArenaRefreshOn401(instance);
    attachX402AutoPay(instance);
  }

  return instance;
}

const cache = new Map<ApiServiceId, AxiosInstance>();

/**
 * Returns a shared Axios instance for the given microservice.
 * Add new services in {@link ApiServiceId} and {@link SERVICE_BASE_URL}.
 */
export function getApiClient(service: ApiServiceId): AxiosInstance {
  let client = cache.get(service);
  if (!client) {
    client = buildClient(service);
    cache.set(service, client);
  }
  return client;
}

/**
 * Factory entry for tests or one-off instances (does not use the singleton cache).
 */
export function createApiClient(service: ApiServiceId): AxiosInstance {
  return buildClient(service);
}
