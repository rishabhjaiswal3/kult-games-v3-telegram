/** Routes that use DashboardTopbar instead of AppTopbar and full-bleed main content. */
export const ARENA_LAYOUT_PATHS = [
  "/dashboard",
  "/games",
  "/my-agents",
  "/training",
  "/battles",
  "/inventory",
] as const;

/** Game detail pages use arena shell (not play route). */
export function isGameDetailPath(pathname: string): boolean {
  return /^\/game\/[^/]+$/.test(pathname);
}

export function usesArenaLayout(pathname: string): boolean {
  return (ARENA_LAYOUT_PATHS as readonly string[]).includes(pathname) || isGameDetailPath(pathname);
}
