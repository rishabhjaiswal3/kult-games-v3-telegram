import { useQuery } from "@tanstack/react-query";
import { aiArenaGatewayApi } from "@/api/aiArenaGatewayApi";
import { useAiArenaGatewaySession } from "@/hooks/useAiArenaGatewaySession";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredAiAgentInfo } from "@/lib/aiAgentStorage";
import { mergeAgentIntoMineResult } from "@/lib/mergeMyArenaAgents";
import { StorageKeys } from "@/constants/storageKeys";
import type { AiArenaAgent, MyArenaAgentsResult } from "@/types/aiArenaGateway";
import type { QueryClient } from "@tanstack/react-query";

export const MY_ARENA_AGENTS_QUERY_KEY = ["aiArenaGateway", "myAgents"] as const;

export function upsertMyArenaAgentCache(queryClient: QueryClient, agent: AiArenaAgent) {
  queryClient.setQueriesData<MyArenaAgentsResult>({ queryKey: MY_ARENA_AGENTS_QUERY_KEY }, (old) =>
    mergeAgentIntoMineResult(old ?? { agents: [], mineOk: true }, agent)
  );
}

function hasCachedAiArenaIdentity(): boolean {
  if (typeof localStorage === "undefined") return false;
  return (
    !!localStorage.getItem(StorageKeys.local.aiArenaUserId) ||
    !!localStorage.getItem(StorageKeys.local.aiArenaAccessToken) ||
    !!getStoredAiAgentInfo()?.id
  );
}

/**
 * Loads agents for the signed-in AI Arena user.
 * Gateway may not expose GET /v1/agents/mine (404) — API layer falls back to /v1/auth/me + /v1/agents.
 */
export function useMyArenaAgents(page = 1, pageSize = 50) {
  const { isAuthenticated } = useAuth();
  const { isAiArenaReady } = useAiArenaGatewaySession();
  const canLoadMine = isAuthenticated && (isAiArenaReady || hasCachedAiArenaIdentity());

  return useQuery({
    queryKey: [...MY_ARENA_AGENTS_QUERY_KEY, page, pageSize],
    queryFn: async () => {
      try {
        const data = await aiArenaGatewayApi.getMyAgentsFromMine(page, pageSize);
        return mergeAgentIntoMineResult(data);
      } catch {
        const stored = getStoredAiAgentInfo();
        if (stored) {
          return mergeAgentIntoMineResult({ agents: [], mineOk: false }, stored);
        }
        throw new Error("Could not load your AI Arena agents");
      }
    },
    enabled: canLoadMine,
    staleTime: 20_000,
    retry: 1,
  });
}

export function hasArenaAgent(data: MyArenaAgentsResult | undefined): boolean {
  if (data?.mineOk && (data.agents?.length ?? 0) > 0) return true;
  return !!getStoredAiAgentInfo()?.id;
}
