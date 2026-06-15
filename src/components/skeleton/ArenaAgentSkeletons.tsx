import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ArenaAgentRowSkeletonProps = {
  className?: string;
};

export function ArenaAgentRowSkeleton({ className }: ArenaAgentRowSkeletonProps) {
  return (
    <li className={cn("flex items-center gap-3 rounded-xl border border-white/[0.06] bg-background/35 px-3 py-2.5", className)} aria-hidden>
      <Skeleton className="h-10 w-10 shrink-0 rounded-xl bg-muted/70" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-32 bg-muted/80" />
        <Skeleton className="h-2.5 w-48 max-w-full bg-muted/55" />
      </div>
    </li>
  );
}

export function ArenaAgentRowItemsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ArenaAgentRowSkeleton key={i} />
      ))}
    </>
  );
}

export function ArenaAgentRowListSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <ul className={cn("space-y-2", className)} aria-busy="true" aria-label="Loading agents">
      {Array.from({ length: count }).map((_, i) => (
        <ArenaAgentRowSkeleton key={i} />
      ))}
    </ul>
  );
}

export function ArenaQueueAgentCardSkeleton() {
  return (
    <li className="rounded-xl border border-white/[0.08] bg-background/45 p-4 sm:p-5" aria-hidden>
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-28 bg-muted/80" />
        <Skeleton className="h-3 w-16 bg-muted/60" />
      </div>
      <Skeleton className="mt-2 h-3 w-36 bg-muted/55" />
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
        <Skeleton className="h-3 w-40 bg-muted/50" />
        <Skeleton className="h-8 w-16 rounded-lg bg-muted/65" />
      </div>
    </li>
  );
}

export function ArenaQueueAgentGridSkeleton({ count = 2 }: { count?: number }) {
  return (
    <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2" aria-busy="true" aria-label="Loading queue status">
      {Array.from({ length: count }).map((_, i) => (
        <ArenaQueueAgentCardSkeleton key={i} />
      ))}
    </ul>
  );
}

export function ProfileAgentCardSkeleton() {
  return (
    <article className="rounded-2xl border border-white/10 bg-background/35 p-4 sm:p-5" aria-hidden>
      {motionSafeRow()}
    </article>
  );
}

function motionSafeRow() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <Skeleton className="h-14 w-14 shrink-0 rounded-xl bg-muted/70" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-32 bg-muted/80" />
          <Skeleton className="h-5 w-16 rounded-full bg-muted/60" />
          <Skeleton className="h-5 w-14 rounded-full bg-muted/55" />
        </div>
        <Skeleton className="h-3 w-48 max-w-full bg-muted/50" />
        <Skeleton className="h-12 w-full bg-muted/40" />
      </div>
    </div>
  );
}

export function ProfileAgentListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading your agents">
      {Array.from({ length: count }).map((_, i) => (
        <ProfileAgentCardSkeleton key={i} />
      ))}
    </div>
  );
}
