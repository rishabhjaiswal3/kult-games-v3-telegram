import { Skeleton } from "@/components/ui/skeleton";

export function GamePlaySkeleton() {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-black" aria-busy="true" aria-label="Loading game">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="absolute left-0 top-0 z-20">
        <Skeleton className="h-8 w-8 rounded-none rounded-br-[14px] bg-muted/65" />
      </div>
      <Skeleton className="h-full w-full bg-muted/45" />
    </div>
  );
}
