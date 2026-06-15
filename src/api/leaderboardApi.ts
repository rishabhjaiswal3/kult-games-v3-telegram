import apiClient from "@/lib/apiClient";
import { isRecord, pickNumber, pickString, unwrapApiData } from "@/api/utils";
import type { ApiEnvelope, LeaderboardEntry, LeaderboardResponse } from "@/types/api";

function normalizeLeaderboardEntry(rawValue: unknown, index: number): LeaderboardEntry {
  const raw = isRecord(rawValue) ? rawValue : {};
  const wallet = pickString(raw.wallet_address, raw.walletAddress, raw.player) ?? "";

  return {
    rank: pickNumber(raw.rank) ?? index + 1,
    wallet_address: wallet,
    name: pickString(raw.name, raw.username),
    score: pickNumber(raw.score) ?? 0,
    wins: pickNumber(raw.wins),
    level:
      raw.level == null
        ? undefined
        : typeof raw.level === "string"
          ? raw.level
          : String(raw.level),
    game: pickString(raw.game, raw.identification),
    metadata: raw.metadata,
  };
}

function normalizeLeaderboardResponse(payload: unknown, fallbackPage: number, fallbackPageSize: number): LeaderboardResponse {
  const raw = isRecord(payload) ? payload : {};
  const entriesRaw = Array.isArray(raw.entries) ? raw.entries : [];
  const entries = entriesRaw.map((entry, index) => normalizeLeaderboardEntry(entry, index));
  const total = pickNumber(raw.total, raw.totalCount, raw.count) ?? entries.length;
  const limit = pickNumber(raw.limit, raw.pageSize, raw.page_size, raw.perPage) ?? fallbackPageSize;

  return {
    entries,
    total,
    page: pickNumber(raw.page) ?? fallbackPage,
    limit,
    totalPages: pickNumber(raw.totalPages) ?? (total === 0 ? 0 : Math.ceil(total / limit)),
    updated_at: pickString(raw.updated_at, raw.updatedAt),
  };
}

export const leaderboardApi = {
  getGlobal: async (page = 1, limit = 50): Promise<LeaderboardResponse> => {
    const { data } = await apiClient.get<ApiEnvelope<unknown>>("/leaderboard/global", {
      params: { page, page_size: limit, limit },
    });
    return normalizeLeaderboardResponse(unwrapApiData(data), page, limit);
  },

  getByGame: async (gameId: string, page = 1, limit = 50): Promise<LeaderboardResponse> => {
    const { data } = await apiClient.get<ApiEnvelope<unknown>>(`/leaderboard/game/${gameId}`, {
      params: { page, page_size: limit, limit },
    });
    return normalizeLeaderboardResponse(unwrapApiData(data), page, limit);
  },

  refresh: async (): Promise<void> => {
    await apiClient.post("/leaderboard/refresh");
  },
};
