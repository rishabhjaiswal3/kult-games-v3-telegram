import { gamesApi } from "@/api/gamesApi";
import type { Game, GamesResponse, LocalizedString } from "@/types/api";

const CATALOG_PAGE_SIZE = 100;
const MAX_CONTEXT_GAMES = 4;

const KNOWN_KULT_GAMES: Game[] = [
  {
    _id: "known-guesstheai",
    identification: "guesstheai",
    name: { en: "Guess the AI" },
    category: "Puzzle",
    description: {
      en: "A deduction game where players identify AI-generated content across modes like Classic, Card Flip, Duel, Multi-Select, Odd One Out, and Rapid Fire.",
    },
    slogan: "Spot the AI before it fools you.",
    metadata: {
      game_modes: "Classic, Card Flip, Duel, Multi-Select, Odd One Out, Rapid Fire",
      skill_level: "Easy to Expert",
    },
  },
  {
    _id: "known-highwayhustle",
    identification: "highwayhustle",
    name: { en: "Highway Hustle" },
    category: "Racing",
    description: {
      en: "A high-speed racing game focused on reflexes, fast movement, traffic dodging, power-ups, and quick decision-making.",
    },
    slogan: "Race through neon highways.",
    metadata: {
      skill_focus: "reaction time, speed control, obstacle awareness",
    },
  },
  {
    _id: "known-robowars",
    identification: "robowars",
    name: { en: "Robo Wars" },
    category: "Action",
    description: {
      en: "A robot battle arena game centered on combat, mech/robot clashes, upgrades, weapon choices, and tactical play.",
    },
    slogan: "Build bots and battle.",
    metadata: {
      skill_focus: "arena combat, tactical upgrades, PvP decision-making",
    },
  },
  {
    _id: "known-warzonewarriors",
    identification: "warzonewarriors",
    name: { en: "Warzone Warriors" },
    category: "Action",
    description: {
      en: "An action combat game for players who prefer direct battles, survival pressure, and aggressive competitive play.",
    },
    slogan: "Enter the warzone and outlast rivals.",
    metadata: {
      skill_focus: "combat, survival, positioning",
    },
  },
  {
    _id: "known-zerogpool",
    identification: "zerogpool",
    name: { en: "ZeroG Pool" },
    category: "Arcade",
    description: {
      en: "An arcade pool-style game likely focused on aim, angles, precision shots, and quick table control.",
    },
    slogan: "Precision shots in zero gravity.",
    metadata: {
      skill_focus: "aim, angles, precision",
    },
  },
  {
    _id: "known-zerodash",
    identification: "zerodash",
    name: { en: "ZeroDash" },
    category: "Arcade",
    description: {
      en: "A fast arcade dash game likely focused on movement timing, reflexes, obstacle avoidance, and short-session scoring.",
    },
    slogan: "Dash fast, react faster.",
    metadata: {
      skill_focus: "reflexes, movement, obstacle avoidance",
    },
  },
];

const STOP_WORDS = new Set([
  "a",
  "about",
  "all",
  "and",
  "are",
  "based",
  "best",
  "better",
  "compare",
  "details",
  "for",
  "from",
  "game",
  "games",
  "good",
  "i",
  "in",
  "is",
  "me",
  "of",
  "on",
  "or",
  "pick",
  "play",
  "should",
  "show",
  "the",
  "to",
  "vs",
  "which",
  "with",
  "you",
]);

const isLocalizedString = (value: unknown): value is LocalizedString =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const getLocalizedGameText = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (isLocalizedString(value)) {
    const stringValues = Object.values(value).filter((entry): entry is string => typeof entry === "string");
    return (typeof value.en === "string" ? value.en : stringValues.find((entry) => entry !== "en") ?? stringValues[0] ?? "").trim();
  }
  return "";
};

const normalizeWords = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const compact = (value: string) => normalizeWords(value).replace(/\s+/g, "");

const tokenize = (value: string) =>
  normalizeWords(value)
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

const wantsCatalogWideComparison = (query: string) => {
  const normalized = normalizeWords(query);
  const tokens = tokenize(query);

  return (
    tokens.length === 0 ||
    /\b(compare|show|list|suggest|recommend|pick)\s+(all\s+)?games\b/.test(normalized) ||
    /\ball\s+games\b/.test(normalized) ||
    /\bgames\s+for\s+me\b/.test(normalized)
  );
};

const getGameName = (game: Game) =>
  getLocalizedGameText(game.name) || game.identification || game.slug || "Unknown Game";

const getGameId = (game: Game) => game.identification || game.slug || normalizeWords(getGameName(game)).replace(/\s+/g, "-");

const getGameAbout = (game: Game) =>
  getLocalizedGameText(game.about) ||
  getLocalizedGameText(game.description) ||
  getLocalizedGameText(game.metadata?.long_description) ||
  getLocalizedGameText(game.metadata?.game_modes) ||
  getLocalizedGameText(game.metadata?.skill_focus) ||
  "";

const getSearchDocument = (game: Game) =>
  normalizeWords(
    [
      getGameName(game),
      game.identification,
      game.slug,
      game.category,
      game.slogan,
      getGameAbout(game),
      getLocalizedGameText(game.metadata?.features),
    ]
      .filter(Boolean)
      .join(" "),
  );

const scoreGame = (query: string, game: Game, index: number) => {
  const normalizedQuery = normalizeWords(query);
  const compactQuery = compact(query);
  const name = getGameName(game);
  const id = getGameId(game);
  const compactName = compact(name);
  const compactId = compact(id);
  const searchDocument = getSearchDocument(game);
  const tokens = tokenize(query);

  let score = 0;

  if (compactQuery.includes(compactName) || compactName.includes(compactQuery)) score += 140;
  if (compactQuery.includes(compactId) || compactId.includes(compactQuery)) score += 120;
  if (normalizedQuery.includes(normalizeWords(name))) score += 80;
  if (game.category && normalizedQuery.includes(normalizeWords(game.category))) score += 35;

  for (const token of tokens) {
    if (searchDocument.includes(token)) score += 10;
    if (compactName.includes(token)) score += 18;
    if (compactId.includes(token)) score += 16;
  }

  return score - index * 0.01;
};

export const selectClosestCatalogGames = (query: string, games: Game[], limit = MAX_CONTEXT_GAMES) => {
  const scored = games
    .map((game, index) => ({ game, score: scoreGame(query, game, index) }))
    .sort((a, b) => b.score - a.score);

  const positiveMatches = scored.filter(({ score }) => score > 0).map(({ game }) => game);
  const topRatedFallback = scored.map(({ game }) => game);

  return (positiveMatches.length ? positiveMatches : topRatedFallback).slice(0, limit);
};

const getDedupKey = (game: Game) => compact(getGameId(game) || getGameName(game));

export const mergeWithKnownKultGames = (catalogGames: Game[]) => {
  const merged = [...catalogGames];
  const seen = new Set(catalogGames.flatMap((game) => [getDedupKey(game), compact(getGameName(game))]));

  for (const knownGame of KNOWN_KULT_GAMES) {
    const keys = [getDedupKey(knownGame), compact(getGameName(knownGame))];
    if (keys.some((key) => seen.has(key))) {
      continue;
    }

    merged.push(knownGame);
    keys.forEach((key) => seen.add(key));
  }

  return merged;
};

const mergeGameData = (summary: Game, detail: Game): Game => ({
  ...summary,
  ...detail,
  slogan: detail.slogan ?? summary.slogan,
  description: detail.description ?? summary.description,
  metadata: {
    ...(summary.metadata ?? {}),
    ...(detail.metadata ?? {}),
  },
});

const fetchDetailedGames = async (games: Game[]) =>
  Promise.all(
    games.map(async (game) => {
      try {
        return mergeGameData(game, await gamesApi.getById(getGameId(game)));
      } catch {
        return game;
      }
    }),
  );

const getAccess = (game: Game) => {
  const platforms = Array.isArray(game.platform) ? game.platform.filter(Boolean).join(", ") : "";
  if (platforms) return platforms;
  if (game.isDownloadable || game.is_downloadable) return "downloadable";
  if (game.url) return "web/playable link";
  return "not specified";
};

const formatGameForPrompt = (game: Game) =>
  [
    `Game name: ${getGameName(game)}`,
    `Identification: ${getGameId(game)}`,
    `Category: ${game.category || "not specified"}`,
    `Rating: ${game.rating != null ? game.rating : "not specified"}`,
    `Access: ${getAccess(game)}`,
    `Slogan: ${game.slogan || "not specified"}`,
    `Details: ${getGameAbout(game) || "not specified"}`,
  ].join("\n");

const getGameNamesLine = (games: Game[]) => games.map(getGameName).join(", ");

export const buildCatalogGroundedPrompt = async (query: string) => {
  let catalog: GamesResponse | null = null;

  try {
    catalog = await gamesApi.getAll(1, CATALOG_PAGE_SIZE);
  } catch {
    catalog = null;
  }

  const catalogGames = mergeWithKnownKultGames(catalog?.games ?? []);
  const selectedGames = wantsCatalogWideComparison(query)
    ? catalogGames
    : selectClosestCatalogGames(query, catalogGames);
  if (!selectedGames.length) {
    return query;
  }

  const detailedGames = await fetchDetailedGames(selectedGames);
  const catalogContext = detailedGames.map(formatGameForPrompt).join("\n\n---\n\n");
  const gameNames = getGameNamesLine(detailedGames);

  return `KULT GAME CATALOG CONTEXT FOR THIS CHATBOT ANSWER
Available game count in this context: ${detailedGames.length}
Available game names: ${gameNames}

Instructions for the AI agent:
- Use the catalog context below as the source of truth for this answer.
- If the user asks to compare games generally, compare every game listed in this catalog context.
- Start the answer by naming the exact games being compared: ${gameNames}.
- Do not say "I only have information about one game" when Available game count is greater than 1.
- Do not redirect the user to search or category filters instead of comparing these games.
- Do not say "I don't have the full catalog".
- After the comparison, show related details for each game by exact game name.

Catalog records:

${catalogContext}

User question:
${query}`;
};
