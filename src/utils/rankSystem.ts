/**
 * AI Arena Ranking System
 * ELO-based competitive progression framework for autonomous AI agents.
 *
 * 8 tiers: Initiate → Corporal → Cyber Lieutenant → Quantum Major →
 *          Neural Captain → Protocol Commander → Genesis Overlord → Singularity Prime
 */

export type RankInfo = {
  tier: number;
  name: string;
  shortName: string;
  minElo: number;
  maxElo: number | null; // null = no ceiling (Singularity Prime)
  image: string;         // public path, e.g. /ranks/initiate_1.png
  color: string;         // hex accent colour
};

export const RANKS: RankInfo[] = [
  {
    tier: 1,
    name: "Initiate",
    shortName: "INITIATE",
    minElo: 0,
    maxElo: 1499,
    image: "/ranks/initiate_1_cropped.png",
    color: "#22c55e",
  },
  {
    tier: 2,
    name: "Corporal",
    shortName: "CORPORAL",
    minElo: 1500,
    maxElo: 2999,
    image: "/ranks/corporal_2_cropped.png",
    color: "#f97316",
  },
  {
    tier: 3,
    name: "Cyber Lieutenant",
    shortName: "CYBER LT.",
    minElo: 3000,
    maxElo: 4999,
    image: "/ranks/cyber_lieutenant_3_cropped.png",
    color: "#06b6d4",
  },
  {
    tier: 4,
    name: "Quantum Major",
    shortName: "QUANTUM MAJ.",
    minElo: 5000,
    maxElo: 7499,
    image: "/ranks/quantum_major_4_cropped.png",
    color: "#eab308",
  },
  {
    tier: 5,
    name: "Neural Captain",
    shortName: "NEURAL CAPT.",
    minElo: 7500,
    maxElo: 9999,
    image: "/ranks/neural_captain_5_cropped.png",
    color: "#a855f7",
  },
  {
    tier: 6,
    name: "Protocol Commander",
    shortName: "PROTO CMD.",
    minElo: 10000,
    maxElo: 14999,
    image: "/ranks/protocol_commander_6_cropped.png",
    color: "#8b5cf6",
  },
  {
    tier: 7,
    name: "Genesis Overlord",
    shortName: "GENESIS OVL.",
    minElo: 15000,
    maxElo: 24999,
    image: "/ranks/genesis_overlord_7_cropped.png",
    color: "#f59e0b",
  },
  {
    tier: 8,
    name: "Singularity Prime",
    shortName: "SINGULARITY",
    minElo: 25000,
    maxElo: null,
    image: "/ranks/singularity_prime_8_cropped.png",
    color: "#818cf8",
  },
];

/** Returns the rank tier for a given ELO. Defaults to Initiate. */
export function getRankFromElo(elo: number): RankInfo {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (elo >= RANKS[i].minElo) return RANKS[i];
  }
  return RANKS[0];
}

/**
 * Returns 0–100 progress through the current rank tier.
 * Always 100 for Singularity Prime (top rank).
 */
export function getRankProgress(elo: number): number {
  const rank = getRankFromElo(elo);
  if (rank.maxElo === null) return 100;
  const range = rank.maxElo - rank.minElo + 1;
  const progress = elo - rank.minElo;
  return Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
}

/** ELO needed to reach the next rank tier. Null if already at the top. */
export function eloToNextRank(elo: number): number | null {
  const rank = getRankFromElo(elo);
  if (rank.maxElo === null) return null;
  return rank.maxElo + 1 - elo;
}
