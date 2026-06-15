/**
 * Shared catalog for the Moments feature so the listing page, filter
 * dropdowns, and create flow all agree on labels + backend slugs.
 *
 * Backend slugs match what `gamesApi` / the moments backend stores in
 * `Moment.relatedGames` (see existing payloads, e.g. `"robowars"`).
 */

export type KnownMomentGame = {
  /** Display label shown on cards, filter dropdowns, chip toggles. */
  label: "WARZONE WARRIORS" | "ROBOWARS" | "HIGHWAY HUSTLE";
  /** Lowercase slug persisted on `Moment.relatedGames`. */
  slug: "warzonewarriors" | "robowars" | "highwayhustle";
};

export const KNOWN_MOMENT_GAMES: readonly KnownMomentGame[] = [
  { label: "WARZONE WARRIORS", slug: "warzonewarriors" },
  { label: "ROBOWARS", slug: "robowars" },
  { label: "HIGHWAY HUSTLE", slug: "highwayhustle" },
] as const;

export const KNOWN_MOMENT_GAME_LABELS = KNOWN_MOMENT_GAMES.map(
  (game) => game.label
);

/**
 * Client-side validation for the create flow. The backend enforces these
 * too (see `momentsApi.createFromFile`), but checking up-front prevents a
 * wasted presign + upload round-trip on obviously-invalid files.
 */
export const MOMENT_MEDIA_LIMITS = {
  maxVideoDurationSeconds: 120,
  maxImageSizeBytes: 10 * 1024 * 1024,
  maxVideoSizeBytes: 100 * 1024 * 1024,
  maxFileSizeBytes: 100 * 1024 * 1024,
  acceptedImageTypes: [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "image/svg+xml", "image/bmp", "image/tiff", "image/avif", "image/heic", "image/heif",
  ] as const,
  acceptedVideoTypes: ["video/mp4", "video/webm", "video/quicktime"] as const,
} as const;

/** Client-side image optimization before presigned upload. */
export const MOMENT_IMAGE_COMPRESS = {
  /** Moment cards + social previews — keep under 1000px long edge. */
  maxLongEdgePx: 960,
  /** Smallest long edge tried before giving up on the 500 KB cap. */
  minLongEdgePx: 520,
  /** Aim for this size; good for feeds and share cards. */
  targetMaxBytes: 500 * 1024,
  /** Never upload a compressed moment image above this size. */
  hardMaxBytes: 500 * 1024,
  startQuality: 0.84,
  minQuality: 0.46,
  qualityStep: 0.06,
  dimensionStepRatio: 0.86,
} as const;

/** Human-readable upload hint for the create-moment dialog. */
export function momentImageUploadHint(): string {
  const maxKb = Math.round(MOMENT_IMAGE_COMPRESS.hardMaxBytes / 1024);
  return `Images auto-compressed to ≤${maxKb} KB · max ${MOMENT_IMAGE_COMPRESS.maxLongEdgePx}px long edge · MP4 · WebM · MOV · video ≤ ${MOMENT_MEDIA_LIMITS.maxVideoDurationSeconds}s`;
}

export const MOMENT_ACCEPTED_MIME_TYPES = [
  ...MOMENT_MEDIA_LIMITS.acceptedImageTypes,
  ...MOMENT_MEDIA_LIMITS.acceptedVideoTypes,
] as const;

export const MOMENT_FILE_INPUT_ACCEPT = MOMENT_ACCEPTED_MIME_TYPES.join(",");

export const MOMENTS_QUERY_KEY_ROOT = "moments" as const;

/** Query param on `/moments` — `?create=true` opens the create-moment dialog. */
export const MOMENTS_CREATE_QUERY_PARAM = "create" as const;

/** Completed AI Arena battle — pre-fills trash-talk moment when paired with `?create=true`. */
export const MOMENTS_BATTLE_ID_QUERY_PARAM = "battleId" as const;

/** Optional — disambiguates which of the user's agents fought in the battle. */
export const MOMENTS_MY_AGENT_ID_QUERY_PARAM = "myAgentId" as const;

export const WARZONE_TRASH_TALK_MOMENT_TITLE = "WarzoneWarriors Trash Talk";

/** Moments hub shows 2 rows × 3 columns on large screens. */
export const MOMENTS_HUB_PREVIEW_COUNT = 9;

export function isMomentsCreateQueryOpen(value: string | null): boolean {
  return value === "true" || value === "1";
}

/** `/moments`, `/moments/browse`, and `/moments/:id` share the same dashboard shell + topbar. */
export function isMomentsPath(pathname: string): boolean {
  return pathname === "/moments" || pathname === "/moments/browse" || /^\/moments\/[^/]+$/.test(pathname);
}
