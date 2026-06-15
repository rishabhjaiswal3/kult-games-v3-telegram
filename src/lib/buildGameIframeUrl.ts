import type { Game } from "@/types/api";

/**
 * Build iframe URL for embedded games.
 *
 * Kult browser standard (all games):
 *   - jwt: Kult auth token from localStorage
 *   - source: "browser"
 *
 * Highway Hustle Unity builds (from highway-hustle-frontend):
 *   - mode: one-way | two-way | speed-run | time-bomb
 *   - wallet: player wallet for in-game / backend sync
 */
export function buildGameIframeUrl(
  playUrl: string,
  options?: {
    token?: string | null;
    walletAddress?: string | null;
    game?: Game | null;
  },
): string {
  if (!playUrl) return "";

  const token = options?.token ?? null;
  const walletAddress = options?.walletAddress?.trim() || null;
  const highwayMode =
    typeof options?.game?.metadata?.highway_mode === "string"
      ? options.game.metadata.highway_mode
      : null;

  try {
    const url = new URL(playUrl);
    if (highwayMode) url.searchParams.set("mode", highwayMode);
    if (walletAddress) url.searchParams.set("wallet", walletAddress);
    if (token) {
      url.searchParams.set("jwt", token);
      url.searchParams.set("source", "browser");
    }
    return url.toString();
  } catch {
    const parts: string[] = [];
    const base = playUrl.includes("?") ? `${playUrl}&` : `${playUrl}?`;
    if (highwayMode) parts.push(`mode=${encodeURIComponent(highwayMode)}`);
    if (walletAddress) parts.push(`wallet=${encodeURIComponent(walletAddress)}`);
    if (token) {
      parts.push(`jwt=${encodeURIComponent(token)}`);
      parts.push("source=browser");
    }
    return parts.length ? `${base}${parts.join("&")}` : playUrl;
  }
}
