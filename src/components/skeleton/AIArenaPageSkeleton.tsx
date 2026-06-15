import { Skeleton } from "@/components/ui/skeleton";

function GlassBlock({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-card/40 p-5 backdrop-blur-sm sm:p-6 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

/**
 * Full AI Arena route layout while the first leaderboard (bootstrap) request is in flight.
 */
export function AIArenaPageSkeleton() {
  return (
    <main
      className="relative z-10 mx-auto max-w-full space-y-6 px-4 pb-12 pt-[calc(4rem+env(safe-area-inset-top,0px))] sm:px-6 md:px-8 md:pb-16 lg:space-y-8 lg:pb-20"
      aria-busy="true"
      aria-label="Loading AI Arena"
    >
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
        <GlassBlock className="lg:col-span-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-3 w-24 bg-muted/70" />
            <Skeleton className="h-6 w-28 rounded-full bg-muted/60" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-12 w-3/4 max-w-md bg-muted/80" />
            <Skeleton className="h-14 w-2/3 max-w-sm bg-muted/70" />
            <Skeleton className="h-16 w-full max-w-xl bg-muted/50" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-11 w-44 rounded-lg bg-muted/80" />
            <Skeleton className="h-11 w-40 rounded-lg bg-muted/70" />
          </div>
          <Skeleton className="aspect-video w-full rounded-xl bg-muted/60 lg:aspect-auto lg:min-h-[280px]" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 rounded-xl border border-white/[0.06] bg-muted/20 p-4">
                <Skeleton className="h-10 w-10 shrink-0 rounded-xl bg-muted/80" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-2 w-20 bg-muted/60" />
                  <Skeleton className="h-6 w-16 bg-muted/80" />
                </div>
              </div>
            ))}
          </div>
        </GlassBlock>

        <aside className="flex min-w-0 flex-col gap-6 lg:col-span-4">
          <GlassBlock className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32 bg-muted/80" />
              <Skeleton className="h-5 w-14 rounded bg-muted/60" />
            </div>
            <Skeleton className="h-44 w-full rounded-xl bg-muted/60" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24 bg-muted/70" />
              <Skeleton className="h-4 w-24 bg-muted/70" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full bg-muted/50" />
            <Skeleton className="mx-auto h-3 w-36 bg-muted/60" />
          </GlassBlock>

          <GlassBlock className="space-y-3">
            <Skeleton className="h-4 w-40 bg-muted/80" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-1">
                <Skeleton className="h-8 w-8 rounded-lg bg-muted/70" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-full bg-muted/60" />
                  <Skeleton className="h-2 w-2/3 bg-muted/50" />
                </div>
              </div>
            ))}
          </GlassBlock>
        </aside>
      </div>

      <GlassBlock className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-28 bg-muted/70" />
            <Skeleton className="h-8 w-48 bg-muted/80" />
          </div>
          <Skeleton className="h-9 w-36 rounded-lg bg-muted/70" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-muted/15 px-4 py-3">
              <Skeleton className="h-6 w-6 rounded bg-muted/70" />
              <Skeleton className="h-4 w-32 bg-muted/80" />
              <Skeleton className="ml-auto h-3 w-24 bg-muted/50" />
            </div>
          ))}
        </div>
      </GlassBlock>

      <div className="space-y-4">
        <Skeleton className="h-7 w-40 bg-muted/80" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl border border-white/[0.08] bg-muted/40" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl border border-white/[0.08] bg-muted/35" />
        ))}
      </div>

      <GlassBlock className="space-y-6">
        <div className="space-y-2 border-b border-white/[0.08] pb-6">
          <Skeleton className="h-3 w-28 bg-muted/70" />
          <Skeleton className="h-9 w-56 bg-muted/80" />
          <Skeleton className="h-14 w-full max-w-2xl bg-muted/50" />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-white/[0.08] bg-muted/15 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg bg-muted/60" />
            ))}
          </div>
          <div className="space-y-3 rounded-xl border border-white/[0.08] bg-muted/15 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg bg-muted/55" />
            ))}
          </div>
        </div>
      </GlassBlock>
    </main>
  );
}
