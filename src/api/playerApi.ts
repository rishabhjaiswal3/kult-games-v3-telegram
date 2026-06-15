import apiClient from "@/lib/apiClient";
import { TOKEN_KEY, WALLET_KEY } from "@/constants/storageKeys";
import { isRecord, unwrapApiData } from "@/api/utils";
import type {
  ApiEnvelope,
  FullPlayerProfile,
  LoginRequest,
  LoginResponse,
  PrivyTonLoginRequest,
  Player,
  PlayerGameScoreEntry,
  PlayerNonceResponse,
  PlayerProfileStats,
  UpdateNameRequest,
} from "@/types/api";

function storeExternalLogin(payload: unknown, fallbackWallet = ""): LoginResponse {
  const raw = isRecord(payload) ? payload : {};
  const token = typeof raw.token === "string" ? raw.token : "";
  const rawPlayer = isRecord(raw.player) ? raw.player : {};
  const walletAddress = String(rawPlayer.walletAddress ?? rawPlayer.wallet_address ?? fallbackWallet);
  const player: Player = {
    _id: String(rawPlayer.id ?? rawPlayer._id ?? ""),
    wallet_address: walletAddress,
    name: String(rawPlayer.name ?? ""),
  };
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(WALLET_KEY, walletAddress);
  }
  return { token, player };
}

/** Parses GET /player/profile — supports Rust `{ cached, profile }` and legacy flat `Player`. */
function parseProfilePayload(raw: unknown): FullPlayerProfile {
  if (!isRecord(raw)) {
    return {
      player: { _id: "", wallet_address: "", name: "" },
      cached: false,
      rank: null,
      totalScore: 0,
      level: 1,
      totalGamesPlayed: 0,
      completedQuests: 0,
      gameScoresList: [],
    };
  }

  const nested = raw.profile;
  if (isRecord(nested) && typeof nested.walletAddress === "string") {
    const list = Array.isArray(nested.gameScoresList) ? nested.gameScoresList : [];
    const gameScoresList: PlayerGameScoreEntry[] = list
      .filter(isRecord)
      .map((row) => ({
        identification: String(row.identification ?? ""),
        score: Number(row.score ?? 0),
        weight: Number(row.weight ?? 0),
        weightedScore: Number(row.weightedScore ?? row.weighted_score ?? 0),
        rank: row.rank == null ? null : Number(row.rank),
      }));

    const stats: PlayerProfileStats = {
      walletAddress: nested.walletAddress,
      username: String(nested.username ?? ""),
      rank: nested.rank == null ? null : Number(nested.rank),
      totalScore: Number(nested.totalScore ?? nested.total_score ?? 0),
      level: Number(nested.level ?? 1),
      totalGamesPlayed: Number(nested.totalGamesPlayed ?? nested.total_games_played ?? 0),
      completedQuests: Number(nested.completedQuests ?? nested.completed_quests ?? 0),
      gameScoresList,
      purchasedAssets: nested.purchasedAssets,
    };

    return {
      player: {
        _id: "",
        wallet_address: stats.walletAddress,
        name: stats.username,
      },
      cached: Boolean(raw.cached),
      rank: stats.rank,
      totalScore: stats.totalScore,
      level: stats.level,
      totalGamesPlayed: stats.totalGamesPlayed,
      completedQuests: stats.completedQuests,
      gameScoresList: stats.gameScoresList,
      purchasedAssets: stats.purchasedAssets,
    };
  }

  const wallet =
    (raw.wallet_address as string) ?? (raw.walletAddress as string) ?? "";
  const name = (raw.name as string) ?? (raw.username as string) ?? "";
  const id = (raw._id as string) ?? (raw.id as string) ?? "";

  return {
    player: {
      _id: id,
      wallet_address: wallet,
      name,
      referral_code: (raw.referral_code as string) ?? (raw.referralCode as string),
    },
    cached: false,
    rank: null,
    totalScore: 0,
    level: 1,
    totalGamesPlayed: 0,
    completedQuests: 0,
    gameScoresList: [],
  };
}

export const playerApi = {
  getNonce: async (walletAddress: string): Promise<PlayerNonceResponse> => {
    const { data } = await apiClient.get<ApiEnvelope<PlayerNonceResponse>>("/player/nonce", {
      params: { walletAddress },
    });
    return unwrapApiData(data);
  },

  login: async (
    walletAddress: string,
    message: string,
    signature: string,
    options?: Pick<LoginRequest, "name" | "metadata" | "referralCode">,
  ): Promise<LoginResponse> => {
    const body: LoginRequest = { walletAddress, message, signature, ...options };
    const { data } = await apiClient.post<ApiEnvelope<unknown> | Record<string, unknown>>("/player/login", body);
    const payload = isRecord(data) && "data" in data ? unwrapApiData(data as ApiEnvelope<unknown>) : data;
    const raw = isRecord(payload) ? payload : {};
    const token: string =
      (typeof raw.token === "string" ? raw.token : undefined) ??
      (typeof (data as Record<string, unknown>).token === "string"
        ? ((data as Record<string, unknown>).token as string)
        : "") ??
      "";
    const rawPlayer = isRecord(raw.player)
      ? raw.player
      : isRecord((data as Record<string, unknown>).player)
        ? ((data as Record<string, unknown>).player as Record<string, unknown>)
        : null;

    const player: Player | null = rawPlayer
      ? {
          _id: String(rawPlayer._id ?? rawPlayer.id ?? ""),
          wallet_address: String(rawPlayer.wallet_address ?? rawPlayer.walletAddress ?? walletAddress),
          name: String(rawPlayer.name ?? ""),
          referral_code:
            typeof rawPlayer.referral_code === "string"
              ? rawPlayer.referral_code
              : typeof rawPlayer.referralCode === "string"
                ? rawPlayer.referralCode
                : undefined,
        }
      : null;

    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(WALLET_KEY, walletAddress);
    }

    return {
      token,
      player: player ?? { _id: "", wallet_address: walletAddress, name: "" },
    };
  },

  loginWithTelegramMiniApp: async (initData: string, name?: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<ApiEnvelope<unknown>>("/player/telegram-miniapp-login", {
      initData,
      ...(name ? { name } : {}),
    });
    return storeExternalLogin(unwrapApiData(data));
  },

  loginWithPrivyTon: async (
    walletAddress: string,
    identityToken: string,
    options?: Omit<PrivyTonLoginRequest, "walletAddress" | "identityToken">,
  ): Promise<LoginResponse> => {
    const { data } = await apiClient.post<ApiEnvelope<unknown>>("/player/privy-login", {
      walletAddress,
      identityToken,
      ...options,
    });
    return storeExternalLogin(unwrapApiData(data), walletAddress);
  },

  getProfile: async (): Promise<Player> => {
    const { data } = await apiClient.get<ApiEnvelope<unknown>>("/player/profile");
    return parseProfilePayload(unwrapApiData(data)).player;
  },

  getFullProfile: async (): Promise<FullPlayerProfile> => {
    const { data } = await apiClient.get<ApiEnvelope<unknown>>("/player/profile");
    return parseProfilePayload(unwrapApiData(data));
  },

  updateName: async (name: string): Promise<string> => {
    const body: UpdateNameRequest = { name };
    const { data } = await apiClient.patch<ApiEnvelope<{ name?: string }>>("/player/name", body);
    const nextName = unwrapApiData(data).name;
    if (typeof nextName !== "string") {
      throw new Error("Invalid name response");
    }
    return nextName;
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(WALLET_KEY);
  },
};
