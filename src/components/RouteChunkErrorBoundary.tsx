import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };

type State = { hasChunkError: boolean };

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("importing a module script failed") ||
    msg.includes("error loading dynamically imported module")
  );
}

/** Catches lazy-route chunk failures and offers a hard refresh. */
export class RouteChunkErrorBoundary extends Component<Props, State> {
  state: State = { hasChunkError: false };

  static getDerivedStateFromError(error: unknown): State | null {
    if (isChunkLoadError(error)) return { hasChunkError: true };
    return null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (isChunkLoadError(error)) {
      console.warn("[RouteChunkErrorBoundary] Stale or missing route chunk", info.componentStack);
    }
  }

  render() {
    if (this.state.hasChunkError) {
      return (
        <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-6 py-16 text-center text-white">
          <p className="text-sm font-semibold text-white/80">This page failed to load after an update.</p>
          <p className="text-xs text-white/45">Refresh to fetch the latest version of the app.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-purple-500/35 bg-purple-500/15 px-5 py-2.5 font-tech text-[11px] font-bold uppercase tracking-wider text-purple-200 transition hover:bg-purple-500/25"
          >
            Refresh page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
