/** Matches AI Arena gateway `POST /v1/agents` — see `0g-aiarena/docs/FRONTEND.md`. */
export const AI_ARENA_CLAN_OPTIONS = [
  { value: "ZEROG" as const, label: "Zerog", hint: "OG native" },
  { value: "BASE" as const, label: "Base", hint: "Base" },
  { value: "SOLANA" as const, label: "Solana", hint: "Solana" },
];

export const AI_ARENA_ARCHETYPE_OPTIONS = [
  "BERSERKER",
  "TACTICIAN",
  "DEFENDER",
  "ASSASSIN",
  "SUPPORT",
  "HYBRID",
] as const;

export type AiArenaClan = (typeof AI_ARENA_CLAN_OPTIONS)[number]["value"];
export type AiArenaArchetype = (typeof AI_ARENA_ARCHETYPE_OPTIONS)[number];

/** Uniform random archetype (e.g. create-agent modal default). */
export function randomAiArenaArchetype(): AiArenaArchetype {
  const i = Math.floor(Math.random() * AI_ARENA_ARCHETYPE_OPTIONS.length);
  return AI_ARENA_ARCHETYPE_OPTIONS[i] ?? "TACTICIAN";
}
