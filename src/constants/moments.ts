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

export const MOMENT_ACCEPTED_MIME_TYPES = [
  ...MOMENT_MEDIA_LIMITS.acceptedImageTypes,
  ...MOMENT_MEDIA_LIMITS.acceptedVideoTypes,
] as const;

export const MOMENT_FILE_INPUT_ACCEPT = MOMENT_ACCEPTED_MIME_TYPES.join(",");

export const MOMENTS_QUERY_KEY_ROOT = "moments" as const;
