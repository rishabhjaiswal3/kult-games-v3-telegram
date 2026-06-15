import type { Moment } from "@/types/api";

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv|avi|mkv|m3u8)(?:\?.*)?$/i;

function metadataString(moment: Moment, keys: string[]): string | undefined {
  const meta = moment.assetMetadata as Record<string, unknown> | undefined;
  if (!meta) return undefined;
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function isVideoMoment(moment: Moment): boolean {
  const fileType = metadataString(moment, ["fileType", "mimeType", "contentType", "type"]) ?? "";
  if (fileType.toLowerCase().startsWith("video/")) return true;
  if (fileType.toLowerCase().startsWith("image/")) return false;
  const url = (moment.assetZgUrl ?? moment.assetUrl ?? "").split("?")[0].toLowerCase();
  return VIDEO_EXT.test(url);
}

/** Whether this moment has any image the share JPEG proxy can render. */
export function momentHasShareImage(moment: Moment): boolean {
  if (metadataString(moment, ["ogImageUrl"])) return true;
  if (isVideoMoment(moment)) {
    return Boolean(metadataString(moment, ["thumbnailUrl", "thumbnail", "posterUrl", "poster"]));
  }
  return Boolean(moment.assetUrl?.trim() || moment.assetZgUrl?.trim());
}

export function buildMomentShareImageProxyUrl(momentId: string, hostBase: string): string {
  const base = hostBase.replace(/\/+$/, "");
  return `${base}/api/moments/${momentId}/share-image.jpg`;
}

/** JPEG proxy URL for Pinterest/WhatsApp — works for WebP, PNG, GIF, AVIF, HEIC, etc. */
export function resolveMomentShareImageUrl(moment: Moment, hostBase: string): string | undefined {
  if (!momentHasShareImage(moment)) return undefined;
  return buildMomentShareImageProxyUrl(moment.momentId, hostBase);
}
