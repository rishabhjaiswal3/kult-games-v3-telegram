export interface AiArenaLeaderboardEntry {
  rank: number;
  agentId: string;
  /** ELO from Redis — gateway returns `score`. */
  score: number;
  /** Enriched client-side from GET /v1/agents/:id */
  name?: string;
  clan?: string;
  eloRating?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  archetype?: string;
}

export interface AiArenaGlobalLeaderboardResponse {
  entries: AiArenaLeaderboardEntry[];
}

export interface ZgDaReceipt {
  daRequestId?: string | null;
  daBatchId?: string | null;
  daBlobIndex?: number | null;
  daBatchHeaderHash?: string | null;
  daConfirmationBlock?: number | null;
  daFinalizedAt?: string | null;
  daStatus?: string | null;
}

export interface AiArenaAgentTraits {
  aggression?: number;
  intelligence?: number;
  adaptability?: number;
  resilience?: number;
  creativity?: number;
  loyalty?: number;
  deception?: number;
  patience?: number;
  precision?: number;
  [key: string]: number | undefined;
}

export interface AiArenaAgent {
  id: string;
  /** Owner on gateway list responses; used client-side to filter "my" agents. */
  userId?: string;
  name: string;
  clan: "ZEROG" | "BASE" | "SOLANA" | string;
  archetype: string;
  evolutionStage: string;
  eloRating: number;
  wins: number;
  losses: number;
  draws?: number;
  status?: string;
  description?: string;
  traits?: AiArenaAgentTraits | Record<string, unknown>;
  inftTokenId?: string | null;
  createdAt?: string;
  metadata?: Record<string, unknown> | null;
  /** 0G Storage root hash for this agent's metadata blob (set on creation). */
  metadataRootHash?: string | null;
  /** 0G Storage root hash for this agent's avatar PNG (set on creation). */
  avatarRootHash?: string | null;
}

// ── Achievements ─────────────────────────────────────────────────────────────

export type AchievementRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
export type AchievementCategory = "BATTLES" | "TRAINING" | "AGENTS" | "AUTONOMOUS" | "COLLECTION" | "SPECIAL";

export interface AiArenaAchievement {
  id: string;
  name: string;
  desc: string;
  points: number;
  category: AchievementCategory;
  rarity: AchievementRarity;
  unlocked: boolean;
  progress?: { current: number; target: number };
}

export interface AiArenaAchievementsResponse {
  agentId: string;
  agentName: string;
  stats: {
    totalPoints: number;
    unlockedCount: number;
    totalCount: number;
    categoriesCompleted: number;
    totalCategories: number;
    commonCount: number;
    rareCount: number;
    epicCount: number;
    legendaryCount: number;
    totalCommon: number;
    totalRare: number;
    totalEpic: number;
    totalLegendary: number;
  };
  categories: {
    name: AchievementCategory;
    unlockedCount: number;
    totalCount: number;
  }[];
  achievements: AiArenaAchievement[];
}

export interface AiArenaCreateAgentRequest {
  name: string;
  clan: "ZEROG" | "BASE" | "SOLANA";
  archetype: "BERSERKER" | "TACTICIAN" | "DEFENDER" | "ASSASSIN" | "SUPPORT" | "HYBRID";
  backstory: string;
}

export interface AiArenaListAgentsResponse {
  agents: AiArenaAgent[];
  page?: number;
  pageSize?: number;
  total?: number;
}

/** Result from loading the current user's agents (mine endpoint or fallback). */
export interface MyArenaAgentsResult {
  agents: AiArenaAgent[];
  mineOk: boolean;
  total?: number;
}

/**
 * Normalized current-user profile from GET /v1/auth/me or GET /v1/users/me.
 * Gateways may return `{ user: { … } }` or a flat legacy `{ userId, walletAddress }`.
 * Some deployments embed `agents` on the profile; when absent, callers filter `/v1/agents` by `userId`.
 */
export interface AiArenaProfileResponse {
  userId: string;
  walletAddress: string;
  custodialSolanaAddress?: string | null;
  username?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  createdAt?: string;
  agents?: AiArenaAgent[];
}

/** @deprecated Use {@link AiArenaProfileResponse} */
export type AiArenaAuthMeResponse = AiArenaProfileResponse;

export interface AiArenaCreateAgentResponse {
  agent: AiArenaAgent;
}

export interface AiArenaBattleResult {
  winnerId: string;
  loserId: string;
  rounds: number;
  eloChange?: Record<string, number>;
  log?: Array<string | Record<string, unknown>>;
}

export interface AiArenaBattle {
  id: string;
  status: "PENDING" | "INITIALIZING" | "IN_PROGRESS" | "COMPLETED" | "DISPUTED" | "CANCELLED" | string;
  agentIds?: string[];
  gameId?: string;
  mode?: string;
  config?: Record<string, unknown>;
  result?: AiArenaBattleResult;
  startedAt?: string | null;
  endedAt?: string;
  createdAt?: string;
}

export interface AiArenaBattleResponse {
  battle: AiArenaBattle;
}

export interface AiArenaCreateBattleRequest {
  agentId: string;
  opponentId: string;
  mode: string;
  gameId: string;
  wagerAmount?: number;
}

export interface AiArenaCreateBattleResponse {
  battle: AiArenaBattle;
}

export interface AiArenaDisputeBattleRequest {
  reason: string;
}

export interface AiArenaDisputeBattleResponse {
  success: boolean;
}

export interface AiArenaMatchmakingStatusBody {
  inQueue: boolean;
  /** Present when inQueue is true (from matchmaking-service). */
  waitTimeMs?: number;
  gameId?: string;
  mode?: string;
  joinedAt?: number;
  /** Legacy / docs shape — not returned by current matchmaking-service. */
  position?: number | null;
  estimatedWaitMs?: number | null;
  matchId?: string | null;
}

export interface AiArenaMatchmakingStatusResponse {
  status: AiArenaMatchmakingStatusBody;
}

export interface AiArenaJoinMatchmakingRequest {
  agentId: string;
  gameId: string;
  mode: string;
  eloRange?: number;
  /** Required for WAGER when gateway x402 verification is enabled. */
  paymentTxHash?: string;
}

export interface AiArenaJoinMatchmakingResponse {
  queued: boolean;
  agentId: string;
}

export interface AiArenaLeaveMatchmakingResponse {
  left: boolean;
}

export interface AiArenaDirectChallengeRequest {
  agentId: string;
  opponentId: string;
  gameId: string;
  mode: string;
}

export interface AiArenaDirectChallengeMatch {
  battleId: string;
  agentIds: string[];
  gameId: string;
  mode: string;
  status: string;
}

export interface AiArenaDirectChallengeResponse {
  match: AiArenaDirectChallengeMatch;
}

export interface AiArenaFinancialDepositRequest {
  agentId: string;
  amount: number;
  currency: "ARENA";
  txHash: string;
}

export interface AiArenaAgentWallet {
  id: string;
  agentId: string;
  solanaAddress: string;
  balanceArena: number;
  balanceSol: number;
  isFrozen: boolean;
}

export interface AiArenaAgentWalletResponse {
  wallet: AiArenaAgentWallet;
}

export interface AiArenaFinancialWithdrawalRequest {
  agentId: string;
  amount: number;
  destination: string;
}

export interface AiArenaFinancialWithdrawalResponse {
  result: {
    withdrawalId: string;
    status: string;
    agentId: string;
    amount: number;
    destination: string;
    note?: string;
  };
}

export interface AiArenaFinancialTransaction {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  txHash?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AiArenaFinancialDepositResponse {
  result: {
    success?: boolean;
    newBalance?: number;
    depositId?: string;
    status?: string;
  };
}

export interface AiArenaFinancialTransactionsResponse {
  transactions: AiArenaFinancialTransaction[];
  total?: number;
}

/** GET /v1/agents/:agentId/evolution */
export interface AiArenaAgentEvolutionResponse {
  currentStage: string;
  totalBattles: number;
  eloRating: number;
  eligibleForEvolution: boolean;
}

/** GET /v1/leaderboards/:leaderboardId/rank/:agentId */
export interface AiArenaAgentRankResponse {
  rank: number;
  agentId: string;
  score?: number;
  name?: string;
  clan?: string;
  eloRating?: number;
  wins?: number;
}

export interface AiArenaFinancialTransaction {
  id?: string;
  type?: string;
  amount?: number;
  currency?: string;
  status?: string;
  createdAt?: string;
  txHash?: string;
  note?: string;
}

export interface AiArenaFinancialTransactionsResponse {
  transactions: AiArenaFinancialTransaction[];
  total?: number;
}

export interface AiArenaReplayAction {
  tick?: number;
  agentId?: string;
  action?: Record<string, unknown> | string;
}

export interface AiArenaReplayResponse {
  rootHash?: string;
  battleId: string;
  replay?: {
    actionLog?: AiArenaReplayAction[];
    seed?: string;
    initialState?: unknown;
    finalStateHash?: string;
  };
  storedAt?: string;
}

export type AiArenaTrainingType =
  | "BEHAVIOUR_CLONING"
  | "REINFORCEMENT_LEARNING"
  | "LORA_FINETUNE";

export type AiArenaTrainingJobStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface AiArenaTrainingJob {
  id: string;
  agentId: string;
  type: AiArenaTrainingType | string;
  status: AiArenaTrainingJobStatus | string;
  priority: number;
  config?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
  errorLog?: string | null;
  modelId?: string | null;
  datasetRootHash?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
}

export interface AiArenaCreateTrainingJobRequest {
  agentId: string;
  type?: AiArenaTrainingType;
  priority?: number;
  baseModel?: "Qwen2.5-0.5B-Instruct" | "Qwen3-32B";
  trainingData?: Array<Record<string, unknown>>;
  config?: Record<string, unknown>;
}

export interface AiArenaStartAgentTrainingRequest {
  type?: AiArenaTrainingType;
  priority?: number;
}

export interface AiArenaCreateTrainingJobResponse {
  job: AiArenaTrainingJob;
}

export interface AiArenaTrainingJobsResponse {
  jobs: AiArenaTrainingJob[];
}

export interface AiArenaTrainingJobResponse {
  job: AiArenaTrainingJob;
}

export interface AiArenaCancelTrainingJobResponse {
  cancelled: boolean;
}

export interface AiArenaTrainingEligibilityResponse {
  eligible: boolean;
  reasons: {
    hasRunningJobs: boolean;
    insufficientBattles: boolean;
    totalBattles: number;
    runningJobs: number;
  };
}

export interface AiArenaBattleSocketMessage {
  type: string;
  battleId?: string;
  [key: string]: unknown;
}

// ── Battle Commentary (POST /v1/inference/battle-commentary) ─────────────────

export interface AiArenaBattleCommentaryRequest {
  battleId:        string;
  winnerName:      string;
  winnerArchetype: string;
  winnerClan:      string;
  winnerElo:       number;
  winnerHpPercent: number;
  loserName:       string;
  loserArchetype:  string;
  loserClan:       string;
  loserElo:        number;
  loserHpPercent:  number;
  durationSeconds: number;
  endReason:       string;
  /** When set, backend returns commentary from that fighter's perspective. */
  perspective?:    'WINNER' | 'LOSER';
  playerStats?:    Record<string, AgentMatchStats>;
}

export interface AiArenaBattleCommentaryResponse {
  commentary?:        string;
  winnerCommentary?:  string;
  loserCommentary?:   string;
  teeVerified?:       boolean | null;
}

// ── Agent Memory (POST /v1/memory/:agentId/memory/episode) ───────────────────

export interface AiArenaMemoryEpisodeRequest {
  battleId: string;
  outcome:  'WIN' | 'LOSS';
  content:  string;         // The commentary text
}

export interface AiArenaMemoryEpisodeResponse {
  stored:            boolean;
  memoryId?:         string;
  snapshotRootHash?: string;  // 0G Storage root hash
}

// ── List Memories (GET /v1/memory/:agentId/memory) ────────────────────────────

export interface AiArenaAgentMemory {
  id:         string;
  type:       string;
  content:    string;
  importance: number;
  metadata:   { battleId?: string; outcome?: string; [key: string]: unknown };
  createdAt:  string;
}

export interface AiArenaMemoriesResponse {
  memories: AiArenaAgentMemory[];
  total:    number;
  page:     number;
  limit:    number;
}

// ── End Battle (called by game client after match concludes) ──────────────────

/** Per-agent action stats recorded by Unity during the match. */
export interface AgentMatchStats {
  /** Number of jump inputs triggered by the AI brain. */
  jumps: number;
  /** Frames where the shoot input was active (proxy for shooting aggression). */
  shotsAttempted: number;
  /** Number of times the opponent's HP decreased (bullets that connected). */
  shotsConnected: number;
  /** Number of times this agent's HP decreased (was hit). */
  timesHit: number;
  /** Total horizontal distance covered in world units (rounded to int). */
  distanceCovered: number;
}

export interface AiArenaEndBattleRequest {
  /** Agent ID of the winner. */
  winnerId: string;
  /** Agent ID of the loser. */
  loserId: string;
  /** Number of rounds played. */
  rounds?: number;
  /** Action log from the game client. */
  log?: Array<string | Record<string, unknown>>;
  /** ELO deltas keyed by agentId, computed by the game or gateway. */
  eloChange?: Record<string, number>;
  /**
   * Per-agent action stats keyed by agentId.
   * Recorded by Unity during the match and forwarded here by the React client.
   * Shape: { [agentId]: AgentMatchStats }
   */
  playerStats?: Record<string, AgentMatchStats>;
}

// ── Trait Evolution ───────────────────────────────────────────────────────────

/**
 * POST /v1/agents/:agentId/evolve-traits
 * Sent by React right after endBattle using the agentId-keyed playerStats Unity recorded.
 */
export interface AiArenaEvolveTraitsRequest {
  outcome:         'WIN' | 'LOSS';
  jumps:           number;
  shotsAttempted:  number;
  shotsConnected:  number;
  timesHit:        number;
  distanceCovered: number;
  durationSeconds: number;
}

export interface AiArenaEvolveTraitsResponse {
  agentId: string;
  traits:  Record<string, number>;
  deltas:  Record<string, number>;
}

// ── Training with battle data ─────────────────────────────────────────────────

/**
 * Training data entry — one state-action pair derived from a battle.
 * This is the JSONL format consumed by the 0G LoRA fine-tuning worker.
 */
export interface AiArenaTrainingDataEntry {
  state: {
    hp:              number;  // 0-1
    opponentHp:      number;  // 0-1
    distanceCovered: number;
    durationSeconds: number;
    battlePhase:     'early' | 'mid' | 'late';
  };
  action: {
    type:       'aggressive' | 'defensive' | 'mobile' | 'balanced';
    jumps:      number;
    shotRate:   number;  // shots per second
  };
  outcome: 'WIN' | 'LOSS';
  reward:  number;  // 1.0 = WIN, -0.5 = LOSS
}

export interface AiArenaEndBattleResponse {
  battle: AiArenaBattle;
}
