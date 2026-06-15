import { Skeleton } from "@/components/ui/skeleton";

export function ArenaLiveDuelFeedSkeleton() {
  return (
    <div className="glass-panel rounded-2xl p-5" aria-busy="true" aria-label="Loading live arena feed">
      {motionSafeRow()}
    </div>
  );
}

function motionSafeRow() {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-4 w-36 bg-muted/80" />
        <Skeleton className="h-6 w-14 rounded bg-muted/60" />
      </div>
      <Skeleton className="mb-4 h-44 w-full rounded-xl bg-muted/60" />
      <div className="mb-2 flex items-center justify-between">
        <Skeleton className="h-4 w-24 bg-muted/75" />
        <Skeleton className="h-3 w-6 bg-muted/50" />
        <Skeleton className="h-4 w-24 bg-muted/75" />
      </div>
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-3 w-14 bg-muted/55" />
        <Skeleton className="h-3 w-14 bg-muted/55" />
      </div>
      <Skeleton className="mb-4 h-1.5 w-full rounded-full bg-muted/50" />
      <Skeleton className="mx-auto h-3 w-40 bg-muted/60" />
    </>
  );
}
