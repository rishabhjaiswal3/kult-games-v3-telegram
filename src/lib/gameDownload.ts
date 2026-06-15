import type { Game } from "@/types/api";

export function isGameDownloadable(game: Game): boolean {
  return game.isDownloadable === true || game.is_downloadable === true;
}

export function gameDownloadUrl(game: Game): string {
  const metadata = game.metadata ?? {};
  const metadataUrl =
    typeof metadata.download_url === "string"
      ? metadata.download_url
      : typeof metadata.downloadUrl === "string"
        ? metadata.downloadUrl
        : "";

  return (metadataUrl || game.url || "").trim();
}

export function hasGameDownloadUrl(game: Game): boolean {
  return Boolean(gameDownloadUrl(game));
}
