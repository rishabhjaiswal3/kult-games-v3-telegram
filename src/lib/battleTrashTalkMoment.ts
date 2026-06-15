import trashTalkImageUrl from "@/assets/trash-talk.webp";
import { aiArenaGatewayApi } from "@/api/aiArenaGatewayApi";
import {
  MOMENTS_BATTLE_ID_QUERY_PARAM,
  MOMENTS_CREATE_QUERY_PARAM,
  MOMENTS_MY_AGENT_ID_QUERY_PARAM,
  WARZONE_TRASH_TALK_MOMENT_TITLE,
} from "@/constants/moments";
import type { AiArenaAgent, AiArenaBattle } from "@/types/aiArenaGateway";

export type BattleOutcome = "WIN" | "LOSS";

export type BattleTrashTalkDraft = {
  title: string;
  description: string;
  relatedGameSlugs: string[];
  tags: string[];
  imageFile: File;
  previewUrl: string;
  outcome: BattleOutcome;
  /** Battle still in progress — commentary will be filled when the match ends. */
  pendingCommentary?: boolean;
};

export function buildTrashTalkMomentPath(battleId: string, myAgentId: string): string {
  const params = new URLSearchParams({
    [MOMENTS_CREATE_QUERY_PARAM]: "true",
    [MOMENTS_BATTLE_ID_QUERY_PARAM]: battleId,
    [MOMENTS_MY_AGENT_ID_QUERY_PARAM]: myAgentId,
  });
  return `/moments?${params.toString()}`;
}

export class BattleTrashTalkError extends Error {
  constructor(
    message: string,
    readonly code: "battle_incomplete" | "not_participant" | "no_commentary" | "fetch_failed",
  ) {
    super(message);
    this.name = "BattleTrashTalkError";
  }
}

function battleDurationSeconds(battle: AiArenaBattle): number {
  if (battle.startedAt && battle.endedAt) {
    const ms = new Date(battle.endedAt).getTime() - new Date(battle.startedAt).getTime();
    if (Number.isFinite(ms) && ms > 0) return Math.max(1, Math.round(ms / 1000));
  }
  return 60;
}

async function loadTrashTalkImageFile(): Promise<{ file: File; previewUrl: string }> {
  const response = await fetch(trashTalkImageUrl);
  if (!response.ok) throw new BattleTrashTalkError("Could not load trash talk artwork.", "fetch_failed");

  const blob = await response.blob();
  const file = new File([blob], "trash-talk.webp", { type: blob.type || "image/webp" });
  return { file, previewUrl: URL.createObjectURL(file) };
}

async function findStoredCommentary(
  agentId: string,
  battleId: string,
  outcome: BattleOutcome,
): Promise<string | null> {
  const { memories } = await aiArenaGatewayApi.getAgentMemories(agentId, 1, 100);
  const outcomeMemory = memories.find(
    (memory) =>
      memory.metadata?.battleId === battleId &&
      String(memory.metadata?.outcome ?? "").toUpperCase() === outcome,
  );
  if (outcomeMemory?.content?.trim()) return outcomeMemory.content.trim();

  const battleMemory = memories.find((memory) => memory.metadata?.battleId === battleId);
  return battleMemory?.content?.trim() || null;
}

function pickCommentaryFromResponse(
  response: { commentary?: string; winnerCommentary?: string; loserCommentary?: string },
  outcome: BattleOutcome,
): string | null {
  if (outcome === "WIN") {
    return response.winnerCommentary?.trim() || response.commentary?.trim() || null;
  }
  return response.loserCommentary?.trim() || response.commentary?.trim() || null;
}

async function generateCommentaryForOutcome(
  battleId: string,
  battle: AiArenaBattle,
  winnerId: string,
  loserId: string,
  outcome: BattleOutcome,
): Promise<string | null> {
  const [winner, loser] = await Promise.all([
    aiArenaGatewayApi.getAgentById(winnerId),
    aiArenaGatewayApi.getAgentById(loserId),
  ]);

  const response = await aiArenaGatewayApi.generateBattleCommentary({
    battleId,
    winnerName: winner.name,
    winnerArchetype: winner.archetype,
    winnerClan: winner.clan,
    winnerElo: winner.eloRating,
    winnerHpPercent: 100,
    loserName: loser.name,
    loserArchetype: loser.archetype,
    loserClan: loser.clan,
    loserElo: loser.eloRating,
    loserHpPercent: 0,
    durationSeconds: battleDurationSeconds(battle),
    endReason: "death",
    perspective: outcome === "WIN" ? "WINNER" : "LOSER",
  });

  return pickCommentaryFromResponse(response, outcome);
}

function fallbackCommentary(
  outcome: BattleOutcome,
  participant: AiArenaAgent,
  opponent: AiArenaAgent,
  durationSeconds: number,
): string {
  if (outcome === "WIN") {
    return `${participant.name} dominated ${opponent.name} in a ${durationSeconds}s Warzone clash — victory secured.`;
  }
  return `${participant.name} fell to ${opponent.name} after a ${durationSeconds}s Warzone clash — the trash talk writes itself.`;
}

function resolveParticipantAgentId(
  battle: AiArenaBattle,
  myAgents: AiArenaAgent[],
  myAgentId?: string | null,
): string | null {
  const battleAgentIds = battle.agentIds ?? [];
  if (myAgentId && battleAgentIds.includes(myAgentId)) return myAgentId;

  const ownedIds = new Set(myAgents.map((agent) => agent.id));
  return battleAgentIds.find((id) => ownedIds.has(id)) ?? null;
}

export async function resolveBattleTrashTalkDraft(input: {
  battleId: string;
  myAgentId?: string | null;
}): Promise<BattleTrashTalkDraft> {
  const battleId = input.battleId.trim();
  if (!battleId) {
    throw new BattleTrashTalkError("Missing battle id.", "fetch_failed");
  }

  let battle: AiArenaBattle;
  try {
    battle = (await aiArenaGatewayApi.getBattle(battleId)).battle;
  } catch {
    throw new BattleTrashTalkError("Could not load this battle.", "fetch_failed");
  }

  const winnerId = battle.result?.winnerId?.trim();
  const loserId = battle.result?.loserId?.trim();
  if (!winnerId || !loserId || battle.status !== "COMPLETED") {
    const { file, previewUrl } = await loadTrashTalkImageFile();
    return {
      title: WARZONE_TRASH_TALK_MOMENT_TITLE,
      description: "",
      relatedGameSlugs: ["warzonewarriors"],
      tags: ["trashtalk", "warzonewarriors"],
      imageFile: file,
      previewUrl,
      outcome: "WIN",
      pendingCommentary: true,
    };
  }

  let myAgents: AiArenaAgent[] = [];
  try {
    myAgents = (await aiArenaGatewayApi.getMyAgentsFromMine(1, 50)).agents ?? [];
  } catch {
    myAgents = [];
  }

  const participantAgentId = resolveParticipantAgentId(battle, myAgents, input.myAgentId);
  if (!participantAgentId) {
    throw new BattleTrashTalkError("You do not have an agent in this battle.", "not_participant");
  }

  const outcome: BattleOutcome = participantAgentId === winnerId ? "WIN" : "LOSS";
  const opponentId = outcome === "WIN" ? loserId : winnerId;

  let commentary =
    (await findStoredCommentary(participantAgentId, battleId, outcome)) ??
    (await generateCommentaryForOutcome(battleId, battle, winnerId, loserId, outcome).catch(() => null));

  if (!commentary) {
    try {
      const [participant, opponent] = await Promise.all([
        aiArenaGatewayApi.getAgentById(participantAgentId),
        aiArenaGatewayApi.getAgentById(opponentId),
      ]);
      commentary = fallbackCommentary(outcome, participant, opponent, battleDurationSeconds(battle));
    } catch {
      throw new BattleTrashTalkError("No commentary is available for this battle yet.", "no_commentary");
    }
  }

  const { file, previewUrl } = await loadTrashTalkImageFile();

  return {
    title: WARZONE_TRASH_TALK_MOMENT_TITLE,
    description: commentary,
    relatedGameSlugs: ["warzonewarriors"],
    tags: outcome === "WIN"
      ? ["trashtalk", "warzonewarriors", "aivictory"]
      : ["trashtalk", "warzonewarriors", "aidefeat"],
    imageFile: file,
    previewUrl,
    outcome,
  };
}
