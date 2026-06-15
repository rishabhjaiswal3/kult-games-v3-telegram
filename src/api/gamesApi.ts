import {
  normalizeHighwayHustleCatalog,
  resolveHighwayHustleGameById,
} from "@/constants/highwayHustleModes";
import apiClient from "@/lib/apiClient";
import { isRecord, pickBoolean, pickLocalizedText, pickNumber, pickString, unwrapApiData } from "@/api/utils";
import type {
  ApiEnvelope,
  Game,
  GameImage,
  GameThumbnail,
  GameThumbnailVariant,
  GamesResponse,
} from "@/types/api";

function normalizeThumbnailVariant(value: unknown): GameThumbnailVariant | null {
  if (!isRecord(value)) return null;

  const base = isRecord(value.en) ? value.en : value;
  const url = pickString(base.url) ?? null;

  return {
    url,
    alt: pickLocalizedText(base.alt) ?? null,
    blurhash: pickString(base.blurhash) ?? null,
    height: pickNumber(base.height) ?? null,
    width: pickNumber(base.width) ?? null,
    mime_type: pickString(base.mime_type) ?? null,
    size_in_kb: pickNumber(base.size_in_kb) ?? null,
    svg_content: pickString(base.svg_content) ?? null,
  };
}

function normalizeThumbnail(value: unknown): GameThumbnail | null {
  if (!isRecord(value)) return null;

  return {
    horizontal: normalizeThumbnailVariant(value.horizontal),
    vertical: normalizeThumbnailVariant(value.vertical),
    square: normalizeThumbnailVariant(value.square),
    ultrawide: normalizeThumbnailVariant(value.ultrawide),
  };
}

function collectImages(raw: Record<string, unknown>, thumbnail: GameThumbnail | null): GameImage[] {
  const urls = new Set<string>();
  const images: GameImage[] = [];

  const addImage = (url: string | null | undefined, variant?: string) => {
    if (!url || urls.has(url)) return;
    urls.add(url);
    images.push({ url, variant });
  };

  if (Array.isArray(raw.images)) {
    for (const image of raw.images) {
      if (!isRecord(image)) continue;
      addImage(pickString(image.url), pickString(image.variant));
    }
  }

  for (const [variant, image] of Object.entries(thumbnail ?? {})) {
    addImage(image?.url ?? null, variant);
  }

  const hero = isRecord(raw.images) ? normalizeThumbnail(raw.images.hero) : null;
  for (const [variant, image] of Object.entries(hero ?? {})) {
    addImage(image?.url ?? null, variant);
  }

  addImage(pickString(raw.image_url));

  return images;
}

function normalizeGame(rawValue: unknown): Game {
  const raw = isRecord(rawValue) ? rawValue : {};
  const thumbnail =
    normalizeThumbnail(raw.thumbnail) ??
    (isRecord(raw.images)
      ? normalizeThumbnail(raw.images.hero ?? raw.images.thumbnail)
      : null);

  const identification = pickString(raw.identification, raw.slug, raw.id, raw._id) ?? "";
  const about = pickLocalizedText(raw.about);
  const description =
    typeof raw.description === "string" || isRecord(raw.description)
      ? (raw.description as Game["description"])
      : about;

  const platform = Array.isArray(raw.platform)
    ? raw.platform.filter((value): value is string => typeof value === "string")
    : typeof raw.platform === "string"
      ? [raw.platform]
      : undefined;

  const metadata = isRecord(raw.metadata) ? raw.metadata : undefined;
  const images = collectImages(raw, thumbnail);
  const isDownloadable = pickBoolean(raw.isDownloadable, raw.is_downloadable) ?? false;

  return {
    _id: pickString(raw._id, raw.id, raw.identification, raw.slug) ?? identification,
    identification,
    slug: pickString(raw.slug, raw.identification) ?? identification,
    name:
      typeof raw.name === "string" || isRecord(raw.name)
        ? (raw.name as Game["name"])
        : identification,
    description,
    about,
    category: pickString(raw.category) ?? "Uncategorized",
    platform,
    rating: pickNumber(raw.rating),
    image_url:
      pickString(raw.image_url) ??
      thumbnail?.horizontal?.url ??
      thumbnail?.vertical?.url ??
      images[0]?.url,
    images,
    thumbnail,
    slogan: pickLocalizedText(raw.slogan),
    url: pickString(raw.url),
    isDownloadable,
    is_downloadable: isDownloadable,
    is_active: typeof raw.is_active === "boolean" ? raw.is_active : undefined,
    play_count: pickNumber(raw.play_count),
    knowledge_facts: Array.isArray(raw.knowledge_facts)
      ? raw.knowledge_facts.filter((value): value is string => typeof value === "string")
      : undefined,
    metadata,
  };
}

function normalizeGamesResponse(payload: unknown, fallbackPage: number, fallbackPageSize: number): GamesResponse {
  const raw = isRecord(payload) ? payload : {};
  const games = Array.isArray(raw.games) ? raw.games.map((game) => normalizeGame(game)) : [];
  const totalCount = pickNumber(raw.totalCount, raw.total, raw.count) ?? games.length;
  const page = pickNumber(raw.page) ?? fallbackPage;
  const pageSize = pickNumber(raw.pageSize, raw.page_size, raw.limit) ?? fallbackPageSize;

  return {
    games,
    totalCount,
    page,
    pageSize,
    totalPages: pickNumber(raw.totalPages) ?? (totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize)),
  };
}

export const gamesApi = {
  getAll: async (page = 1, limit = 20, search?: string): Promise<GamesResponse> => {
    const { data } = await apiClient.get<ApiEnvelope<unknown>>("/games/all", {
      params: { page, page_size: limit, search },
    });
    const response = normalizeGamesResponse(unwrapApiData(data), page, limit);
    const games = normalizeHighwayHustleCatalog(response.games);
    return {
      ...response,
      games,
      totalCount: games.length,
    };
  },

  getCategories: async (): Promise<string[]> => {
    const { data } = await apiClient.get<ApiEnvelope<unknown>>("/games/categories");
    const payload = unwrapApiData(data);
    if (Array.isArray(payload)) {
      return payload.filter((value): value is string => typeof value === "string");
    }
    if (!isRecord(payload) || !Array.isArray(payload.categories)) {
      return [];
    }
    return payload.categories.filter((value): value is string => typeof value === "string");
  },

  getById: async (id: string): Promise<Game> => {
    const localHighway = resolveHighwayHustleGameById(id);
    if (localHighway) return localHighway;

    const { data } = await apiClient.get<ApiEnvelope<unknown>>(`/games/${id}`);
    const payload = unwrapApiData(data);
    const normalized =
      isRecord(payload) && payload.game !== undefined
        ? normalizeGame(payload.game)
        : normalizeGame(payload);

    return normalized;
  },
};
