import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const CHUNK_RELOAD_KEY = "kult_chunk_reload_attempted";

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("importing a module script failed") ||
    msg.includes("error loading dynamically imported module")
  );
}

/**
 * Wraps React.lazy with a one-time full reload when a route chunk 404s after deploy
 * (common when index.html is cached but old asset hashes were removed).
 */
export function lazyWithRetry<T extends ComponentType<object>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const module = await factory();
      try {
        sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      } catch {
        /* ignore */
      }
      return module;
    } catch (error) {
      if (isChunkLoadError(error)) {
        let alreadyRetried = false;
        try {
          alreadyRetried = sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";
        } catch {
          /* ignore */
        }

        if (!alreadyRetried) {
          try {
            sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
          } catch {
            /* ignore */
          }
          window.location.reload();
          return new Promise<{ default: T }>(() => {});
        }
      }
      throw error;
    }
  });
}
