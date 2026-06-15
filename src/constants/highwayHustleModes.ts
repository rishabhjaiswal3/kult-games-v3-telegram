import type { Game } from "@/types/api";

/**
 * Highway Hustle Unity builds (same URLs as highway-hustle-frontend `modes[].gameUrl`).
 * Kult GamePlay appends: jwt, source=browser, wallet, mode (see buildGameIframeUrl).
 */
export type HighwayHustleModeId = "one-way" | "two-way" | "speed-run" | "time-bomb";

export type HighwayHustleModeConfig = {
  /** Route id: /game/:identification */
  identification: string;
  mode: HighwayHustleModeId;
  name: string;
  slogan: string;
  description: string;
  difficulty: string;
  /** Direct Unity index.html — iframe target before Kult auth query params */
  playUrl: string;
};

export const HIGHWAY_HUSTLE_MODES: HighwayHustleModeConfig[] = [
  {
    identification: "highwayhustle-oneway",
    mode: "one-way",
    name: "ONE WAY",
    slogan: "Classic endless highway racing.",
    description:
      "Classic endless highway racing. Dodge traffic, chain distance, and climb the One Way leaderboard.",
    difficulty: "Easy",
    playUrl: "https://pub-0025cff360c44334b8cc47c146e9c55c.r2.dev/OneWay/7/index.html",
  },
  {
    identification: "highwayhustle-twoway",
    mode: "two-way",
    name: "TWO WAY",
    slogan: "Dodge oncoming traffic.",
    description:
      "Two-way traffic chaos. Switch lanes fast and survive oncoming waves in medium-difficulty runs.",
    difficulty: "Medium",
    playUrl: "https://pub-0025cff360c44334b8cc47c146e9c55c.r2.dev/TwoWay/3/index.html",
  },
  {
    identification: "highwayhustle-speedrun",
    mode: "speed-run",
    name: "SPEED RUN",
    slogan: "Short burst speed challenges.",
    description:
      "Speed Run mode: short burst races built for acceleration tests and hard-difficulty reflex play.",
    difficulty: "Hard",
    playUrl: "https://pub-0025cff360c44334b8cc47c146e9c55c.r2.dev/SpeedRun/2/index.html",
  },
  {
    identification: "highwayhustle-timebomb",
    mode: "time-bomb",
    name: "TIME BOMB",
    slogan: "Race against the clock.",
    description:
      "Time Bomb mode: beat the clock before detonation. Expert pacing and high-risk scoring.",
    difficulty: "Expert",
    playUrl: "https://pub-0025cff360c44334b8cc47c146e9c55c.r2.dev/TimeBomb/2/index.html",
  },
];

const MODE_BY_IDENTIFICATION = new Map(
  HIGHWAY_HUSTLE_MODES.map((m) => [m.identification, m] as const),
);

const MODE_BY_MODE_ID = new Map(
  HIGHWAY_HUSTLE_MODES.map((m) => [m.mode, m] as const),
);

export const HIGHWAY_HUSTLE_AGGREGATE_ID = "highwayhustle";

const AGGREGATE_IDENTIFIERS = new Set([
  "highwayhustle",
  "highway-hustle",
  "highway_hustle",
]);

export function normalizeHighwayKey(value: string): string {
  return value.toLowerCase().replace(/[\s_-]+/g, "");
}

export function isHighwayHustleAggregate(game: Game): boolean {
  const key = normalizeHighwayKey(
    game.identification ?? game.slug ?? (typeof game.name === "string" ? game.name : game.name?.en ?? ""),
  );
  return AGGREGATE_IDENTIFIERS.has(key) || key === "highwayhustle";
}

export function getHighwayModeConfig(identification: string): HighwayHustleModeConfig | undefined {
  return MODE_BY_IDENTIFICATION.get(identification);
}

export function getHighwayModeByModeId(modeId: string): HighwayHustleModeConfig | undefined {
  return MODE_BY_MODE_ID.get(modeId as HighwayHustleModeId);
}

/** True for aggregate catalog id or a specific mode route id. */
export function isHighwayHustleFamily(idOrGame: string | Game): boolean {
  if (typeof idOrGame === "string") {
    const key = normalizeHighwayKey(idOrGame);
    if (AGGREGATE_IDENTIFIERS.has(key)) return true;
    if (getHighwayModeConfig(idOrGame)) return true;
    return !!getHighwayModeByModeId(idOrGame);
  }
  const id = idOrGame.identification ?? idOrGame.slug ?? "";
  if (isHighwayHustleAggregate(idOrGame)) return true;
  if (getHighwayModeConfig(id)) return true;
  return idOrGame.metadata?.game_family === "highway-hustle";
}

export function getHighwayAggregateRouteId(game?: Game): string {
  if (game?.identification && isHighwayHustleAggregate(game)) {
    return game.identification;
  }
  return HIGHWAY_HUSTLE_AGGREGATE_ID;
}

export function buildHighwayHustleGame(mode: HighwayHustleModeConfig, parent?: Game): Game {
  const parentMeta = parent?.metadata ?? {};
  const parentName = typeof parent?.name === "string" ? parent.name : parent?.name?.en;

  return {
    _id: mode.identification,
    identification: mode.identification,
    slug: mode.identification,
    name: { en: mode.name },
    description: { en: mode.description },
    about: mode.description,
    category: parent?.category ?? "Racing",
    platform: parent?.platform ?? ["Web"],
    rating: parent?.rating,
    image_url: parent?.image_url,
    images: parent?.images,
    thumbnail: parent?.thumbnail ?? null,
    slogan: mode.slogan,
    url: mode.playUrl,
    isDownloadable: false,
    is_downloadable: false,
    is_active: parent?.is_active ?? true,
    play_count: parent?.play_count,
    knowledge_facts: parent?.knowledge_facts,
    metadata: {
      ...parentMeta,
      play_url: mode.playUrl,
      highway_mode: mode.mode,
      highway_difficulty: mode.difficulty,
      session_length: parentMeta.session_length ?? "3–8 min",
      skill_level: mode.difficulty,
      game_family: "highway-hustle",
      ...(parentName ? { parent_title: parentName } : {}),
    },
  };
}

export function buildAllHighwayHustleGames(parent?: Game): Game[] {
  return HIGHWAY_HUSTLE_MODES.map((mode) => buildHighwayHustleGame(mode, parent));
}

/** One Highway Hustle card in the list — hide per-mode duplicate rows. */
export function normalizeHighwayHustleCatalog(games: Game[]): Game[] {
  const out: Game[] = [];
  let hasAggregate = false;

  for (const game of games) {
    const id = game.identification ?? game.slug ?? "";
    if (getHighwayModeConfig(id)) continue;

    if (isHighwayHustleAggregate(game)) {
      if (!hasAggregate) {
        out.push(game);
        hasAggregate = true;
      }
      continue;
    }

    out.push(game);
  }

  return out;
}

export function resolveHighwayHustleGameById(id: string): Game | undefined {
  const mode = getHighwayModeConfig(id);
  if (mode) return buildHighwayHustleGame(mode);
  const normalized = normalizeHighwayKey(id);
  const found = HIGHWAY_HUSTLE_MODES.find((m) => normalizeHighwayKey(m.identification) === normalized);
  return found ? buildHighwayHustleGame(found) : undefined;
}
