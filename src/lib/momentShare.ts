import type { Moment } from "@/types/api";
import {
  buildMomentShareImageProxyUrl,
  resolveMomentShareImageUrl,
} from "@/lib/momentShareImage";

const APP_ORIGIN =
  typeof window !== "undefined" ? window.location.origin.replace(/\/+$/, "") : "";

function resolveShareBaseUrl(): string {
  const explicit = (import.meta.env.VITE_SHARE_BASE_URL as string | undefined)?.trim().replace(/\/+$/, "");
  if (explicit) return explicit;

  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/+$/, "");
  if (apiUrl) return apiUrl.replace(/\/api$/i, "");

  return APP_ORIGIN;
}

/**
 * Path to the backend OG preview route.
 * Default `/api/share` matches DigitalOcean setups where the frontend proxies `/api/*` to the backend.
 */
const SHARE_PREVIEW_PATH = (() => {
  const configured = (import.meta.env.VITE_SHARE_PREVIEW_PATH as string | undefined)?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return "/api/share";
})();

export type SharePayload = {
  /** Human-friendly moment page (opens SPA when production-server is deployed). */
  url: string;
  /** Crawlable preview page — always has OG tags + JPEG image on /api/share. */
  previewUrl: string;
  title: string;
  teaser: string;
  hashtags: string[];
  /** Direct image URL for Pinterest `media` param. */
  mediaUrl?: string;
  relatedGames: string[];
};

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function normalizeHashtag(value: string) {
  return value
    .trim()
    .replace(/^#/, "")
    .replace(/[^a-zA-Z0-9_]+/g, "")
    .slice(0, 24);
}

function resolveHostBase(): string {
  return APP_ORIGIN || resolveShareBaseUrl();
}

export function buildMomentShareOgImageUrl(momentId: string): string {
  return buildMomentShareImageProxyUrl(momentId, resolveHostBase());
}

/** Public image URL for Pinterest/WhatsApp — always JPEG proxy (any source format). */
export function resolveShareMediaUrl(moment: Moment): string | undefined {
  return resolveMomentShareImageUrl(moment, resolveHostBase());
}

/**
 * URL placed in social posts — must be crawlable on static-site deployments.
 * Set VITE_SHARE_PLATFORM_URL=moment only after production-server serves OG on /moments/:id.
 */
export function resolvePlatformShareUrl(payload: SharePayload): string {
  const mode = (import.meta.env.VITE_SHARE_PLATFORM_URL as string | undefined)?.trim().toLowerCase();
  if (mode === "moment" || mode === "public") return payload.url;
  return payload.previewUrl;
}

export function buildMomentShareUrl(momentId: string): string {
  return `${resolveHostBase()}/moments/${momentId}`;
}

function buildPreviewUrlOnHost(hostBase: string, momentId: string): string {
  const base = hostBase.replace(/\/+$/, "");
  const path = SHARE_PREVIEW_PATH.startsWith("/") ? SHARE_PREVIEW_PATH : `/${SHARE_PREVIEW_PATH}`;
  return `${base}${path}/moments/${momentId}`;
}

export function buildMomentSharePreviewUrl(momentId: string): string {
  return buildPreviewUrlOnHost(resolveHostBase(), momentId);
}

export function buildRedditSubmitTitle(payload: Pick<SharePayload, "title" | "teaser">): string {
  const REDDIT_TITLE_MAX = 300;
  if (!payload.teaser.trim()) return truncateText(payload.title, REDDIT_TITLE_MAX);
  return truncateText(`${payload.title} — ${payload.teaser}`, REDDIT_TITLE_MAX);
}

export function buildRedditSubmitParams(
  payload: Pick<SharePayload, "title" | "teaser" | "url">,
  titleOverride?: string,
): Record<string, string> {
  const params: Record<string, string> = {
    url: payload.url,
    title: titleOverride
      ? truncateText(titleOverride, 300)
      : buildRedditSubmitTitle(payload),
  };
  if (payload.teaser.trim()) {
    params.text = payload.teaser;
  }
  return params;
}

export function buildMomentSharePayload(moment: Moment): SharePayload {
  const title = moment.title.trim() || "Check out this Kult moment";
  const description = moment.description?.trim() || moment.aiCaption?.trim() || "";
  const teaser = description ? truncateText(description, 120) : "";
  const url = buildMomentShareUrl(moment.momentId);
  const previewUrl = buildMomentSharePreviewUrl(moment.momentId);
  const hashtags = (moment.tags ?? [])
    .map(normalizeHashtag)
    .filter(Boolean)
    .slice(0, 5);
  const game = moment.relatedGames?.[0] ?? "Kult";

  return {
    url,
    previewUrl,
    title,
    teaser,
    hashtags: ["KultGames", "KultMoments", game.replace(/[\s-]+/g, ""), ...hashtags].filter(Boolean),
    mediaUrl: resolveShareMediaUrl(moment),
    relatedGames: moment.relatedGames ?? [],
  };
}
