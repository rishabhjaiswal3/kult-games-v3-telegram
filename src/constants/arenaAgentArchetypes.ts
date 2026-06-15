import type { AiArenaArchetype } from "@/constants/aiArenaAgent";
import agentsPoster from "@/assets/ai_agents_4k_poster.png";
import tacticianPortrait from "@/assets/tactician.mp4";
import assassinPortrait from "@/assets/assassin.gif";
import berserkerPortrait from "@/assets/berserker.mp4";
import defenderPortrait from "@/assets/defender.mp4";
import hybridPortrait from "@/assets/hybrid.mp4";
import supportPortrait from "@/assets/support.mp4";
import agentAegis from "@/assets/tactician.mp4";

export { agentsPoster };

export type ArenaAgentArchetypeCard = {
  archetype: AiArenaArchetype;
  codename: string;
  tagline: string;
  role: string;
  image: string;
  accent: string;
  glow: string;
  border: string;
};

export const ARENA_AGENT_ARCHETYPE_CARDS: ArenaAgentArchetypeCard[] = [
  {
    archetype: "BERSERKER",
    codename: "Berserker",
    tagline: "Overwhelm with relentless pressure.",
    role: "Aggression · Momentum · Finishers",
    image: berserkerPortrait,
    accent: "text-orange-400",
    glow: "from-orange-500/35 via-red-600/20 to-transparent",
    border: "group-hover:border-orange-400/50",
  },
  {
    archetype: "TACTICIAN",
    codename: "Tactician",
    tagline: "Reads the board three moves ahead.",
    role: "Control · Tempo · Counter-play",
    image: tacticianPortrait,
    accent: "text-neon-cyan",
    glow: "from-cyan-400/35 via-blue-500/20 to-transparent",
    border: "group-hover:border-neon-cyan/50",
  },
  {
    archetype: "DEFENDER",
    codename: "Defender",
    tagline: "Absorbs chaos and turns it into wins.",
    role: "Fortify · Sustain · Zone control",
    image: defenderPortrait,
    accent: "text-emerald-400",
    glow: "from-emerald-400/35 via-teal-500/20 to-transparent",
    border: "group-hover:border-emerald-400/50",
  },
  {
    archetype: "ASSASSIN",
    codename: "Assassin",
    tagline: "Strikes where the meta is weakest.",
    role: "Burst · Flanks · Punish mistakes",
    image: assassinPortrait,
    accent: "text-violet-400",
    glow: "from-violet-500/35 via-purple-600/20 to-transparent",
    border: "group-hover:border-violet-400/50",
  },
  {
    archetype: "SUPPORT",
    codename: "Support",
    tagline: "Elevates allies and outlasts the clock.",
    role: "Buffs · Recovery · Team tempo",
    image: supportPortrait,
    accent: "text-amber-300",
    glow: "from-amber-300/35 via-yellow-500/15 to-transparent",
    border: "group-hover:border-amber-300/50",
  },
  {
    archetype: "HYBRID",
    codename: "Hybrid",
    tagline: "Unpredictable — never the same fight twice.",
    role: "Adapt · Pivot · Meta-break",
    image: hybridPortrait,
    accent: "text-neon-magenta",
    glow: "from-fuchsia-500/35 via-cyan-400/20 to-transparent",
    border: "group-hover:border-fuchsia-400/50",
  },
];

const ARCHETYPE_PORTRAIT_BY_TYPE = Object.fromEntries(
  ARENA_AGENT_ARCHETYPE_CARDS.map((card) => [card.archetype, card.image])
) as Record<string, string>;

import lbRageborn from "@/assets/agent-rageborn.jpg";
import lbShadow from "@/assets/agent-shadow.jpg";
import lbAegis from "@/assets/agent-aegis.jpg";
import lbNexus from "@/assets/agent-nexus.jpg";
import lbVoidwalker from "@/assets/agent-voidwalker.jpg";
import lbLumen from "@/assets/agent-lumen.jpg";

const PORTRAIT_POOL = ARENA_AGENT_ARCHETYPE_CARDS.map((card) => card.image);
const LEADERBOARD_PORTRAIT_POOL = [
  lbRageborn,   // BERSERKER
  lbShadow,     // TACTICIAN (Solana clan)
  lbAegis,      // DEFENDER (Base clan)
  lbNexus,      // ASSASSIN
  lbVoidwalker, // SUPPORT
  lbLumen,      // HYBRID (Zerog clan)
];

function portraitIndexFromAgentId(agentId: string): number {
  let hash = 0;
  for (let i = 0; i < agentId.length; i += 1) {
    hash = (hash * 31 + agentId.charCodeAt(i)) >>> 0;
  }
  return hash % PORTRAIT_POOL.length;
}

/** Archetype portrait when known; otherwise a stable pick from the six roster characters. */
export function getArenaAgentPortrait(agent: { id: string; archetype?: string | null }): string {
  const normalized = agent.archetype?.trim().toUpperCase();
  if (normalized && ARCHETYPE_PORTRAIT_BY_TYPE[normalized]) {
    return ARCHETYPE_PORTRAIT_BY_TYPE[normalized];
  }
  return PORTRAIT_POOL[portraitIndexFromAgentId(agent.id)] ?? PORTRAIT_POOL[0];
}

export function getArchetypeCardByType(archetype: AiArenaArchetype): ArenaAgentArchetypeCard | undefined {
  return ARENA_AGENT_ARCHETYPE_CARDS.find((card) => card.archetype === archetype);
}

/** Stable robot portrait + codename for wallet-based global leaderboard rows. */
export function getLeaderboardPlayerVisual(wallet: string) {
  const seed = wallet?.trim() || "player";
  const card = ARENA_AGENT_ARCHETYPE_CARDS[portraitIndexFromAgentId(seed)] ?? ARENA_AGENT_ARCHETYPE_CARDS[0];
  const portrait = LEADERBOARD_PORTRAIT_POOL[portraitIndexFromAgentId(seed)] ?? LEADERBOARD_PORTRAIT_POOL[0];

  return {
    portrait,
    archetype: card.archetype,
    codename: card.codename,
    role: card.role,
  };
}
