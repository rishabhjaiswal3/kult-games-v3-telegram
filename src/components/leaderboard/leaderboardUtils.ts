import { getLeaderboardPlayerVisual, getArenaAgentPortrait, ARENA_AGENT_ARCHETYPE_CARDS } from "@/constants/arenaAgentArchetypes";
import type { LeaderboardEntry } from "@/types/api";
import type { AiArenaLeaderboardEntry } from "@/types/aiArenaGateway";
import { clanFromArchetype } from "./ClanIcon";

export type LeaderboardTab = "GLOBAL" | "MY RANK";

export type DisplayPlayer = {
  rank: number;
  name: string;
  avatar: string;
  clanName: string;
  clanIconType: string;
  points: string;
  wins?: number;
  winRate?: string;
  battles?: number;
  wallet: string;
  isYou?: boolean;
  showHexagon?: boolean;
  /** Raw ELO value — used to derive rank tier badge. */
  eloRating?: number;
};

function shortenWallet(addr: string) {
  if (!addr || addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function isWalletLikeName(name: string, wallet: string) {
  const n = name.trim().toLowerCase();
  const w = wallet.trim().toLowerCase();
  if (!n || !w) return false;
  if (n === w) return true;
  return shortenWallet(w) === n;
}

export function entryToDisplayPlayer(entry: LeaderboardEntry, opts?: { isYou?: boolean }): DisplayPlayer {
  const visual = getLeaderboardPlayerVisual(entry.wallet_address);
  const clan = clanFromArchetype(visual.archetype);
  const rawName = entry.name?.trim();
  const displayName =
    rawName && !isWalletLikeName(rawName, entry.wallet_address) ? rawName : visual.codename;
  const wins = entry.wins;
  const battles = wins != null ? Math.max(wins, Math.round(wins * 1.42)) : undefined;
  const winRate =
    wins != null && battles
      ? `${Math.min(99, Math.round((wins / battles) * 1000) / 10)}%`
      : undefined;

  return {
    rank: entry.rank,
    name: opts?.isYou ? `${displayName} (YOU)` : displayName,
    avatar: visual.portrait,
    clanName: clan.name,
    clanIconType: clan.type,
    points: Math.round(entry.score).toLocaleString(),
    wins,
    winRate,
    battles,
    wallet: entry.wallet_address,
    isYou: opts?.isYou,
    showHexagon: entry.rank <= 5,
  };
}

/** Maps an actual AI Arena clan string (ZEROG | BASE | SOLANA) to ClanIcon type. */
function clanFromArenaClean(clan?: string | null): { name: string; type: string } {
  const c = (clan ?? "").toUpperCase();
  if (c === "ZEROG") return { name: "ZeroG", type: "zerog" };
  if (c === "BASE")  return { name: "Base",  type: "base"  };
  if (c === "SOLANA") return { name: "Solana", type: "solana" };
  return { name: "ZeroG", type: "zerog" };
}

/**
 * Map a real AI Arena leaderboard entry (enriched with agent data) to DisplayPlayer.
 * Uses actual name, clan, wins, losses, draws from the agent record.
 */
/**
 * Returns the same archetype-specific animated asset that My Agents uses
 * (mp4 for most archetypes, gif for Assassin). Falls back to the jpg pool.
 */
function getLeaderboardAvatarByArchetype(archetype: string, agentId: string): string {
  const normalized = archetype.trim().toUpperCase();
  const card = ARENA_AGENT_ARCHETYPE_CARDS.find((c) => c.archetype === normalized);
  // card.image is the animated asset (mp4/gif) — same as My Agents page
  if (card?.image) return card.image;
  // Fallback: stable jpg from pool (works in <img> tag)
  return getArenaAgentPortrait({ id: agentId, archetype });
}

export function arenaEntryToDisplayPlayer(
  entry: AiArenaLeaderboardEntry,
  opts?: { isYou?: boolean },
): DisplayPlayer {
  const archetype = entry.archetype?.trim().toUpperCase() ?? "HYBRID";
  const portrait = getLeaderboardAvatarByArchetype(archetype, entry.agentId);
  const clan = entry.clan ? clanFromArenaClean(entry.clan) : clanFromArchetype(archetype);
  const name = entry.name?.trim() || `Agent ${entry.agentId.slice(0, 8)}`;

  const wins    = entry.wins    ?? undefined;
  const losses  = entry.losses  ?? undefined;
  const draws   = entry.draws   ?? 0;
  const totalBattles =
    wins != null && losses != null ? wins + losses + draws : undefined;
  const winRate =
    wins != null && totalBattles && totalBattles > 0
      ? `${Math.round((wins / totalBattles) * 100)}%`
      : undefined;

  return {
    rank: entry.rank,
    name: opts?.isYou ? `${name} (YOU)` : name,
    avatar: portrait,
    clanName: clan.name,
    clanIconType: clan.type,
    points: Math.round(entry.eloRating ?? entry.score).toLocaleString(),
    wins,
    winRate,
    battles: totalBattles,
    wallet: entry.agentId,
    isYou: opts?.isYou,
    showHexagon: entry.rank <= 5,
    eloRating: Math.round(entry.eloRating ?? entry.score),
  };
}

export function arenaEntriesToDisplayPlayers(
  entries: AiArenaLeaderboardEntry[],
  myAgentIds?: Set<string>,
): DisplayPlayer[] {
  return entries.map((e) =>
    arenaEntryToDisplayPlayer(e, { isYou: myAgentIds?.has(e.agentId) }),
  );
}

export function entriesToDisplayPlayers(
  entries: LeaderboardEntry[],
  walletAddress?: string | null,
): DisplayPlayer[] {
  return entries.map((e) =>
    entryToDisplayPlayer(e, {
      isYou: Boolean(walletAddress && e.wallet_address.toLowerCase() === walletAddress.toLowerCase()),
    }),
  );
}
