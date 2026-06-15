import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ArenaBattleBoardCardSkeletonProps = {
  className?: string;
};

export function ArenaBattleBoardCardSkeleton({
  className,
}: ArenaBattleBoardCardSkeletonProps) {
  return (
    <div className={cn("card-glass rounded-xl p-4 sm:p-5", className)} aria-hidden>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-2 w-2 rounded-full bg-muted/80" />
          <Skeleton className="h-3 w-16 bg-muted/75" />
        </div>
        <div className="space-y-1 text-right">
          <Skeleton className="ml-auto h-3 w-20 bg-muted/70" />
          <Skeleton className="ml-auto h-2.5 w-16 bg-muted/55" />
        </div>
        <Skeleton className="h-4 w-14 bg-muted/75" />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
        <BattleSideSkeleton />
        <Skeleton className="h-7 w-10 bg-muted/60" />
        <BattleSideSkeleton align="right" />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
        <Skeleton className="h-3 w-20 bg-muted/75" />
        <Skeleton className="h-3 w-24 bg-muted/60" />
      </div>
    </div>
  );
}

function BattleSideSkeleton({ align = "left" }: { align?: "left" | "right" }) {
  return (
    <div className={cn("min-w-0", align === "right" ? "text-right" : "text-left")}>
      <div
        className={cn(
          "flex items-center gap-2",
          align === "right" ? "justify-end" : "justify-start"
        )}
      >
        {align === "right" ? null : (
          <Skeleton className="h-14 w-14 shrink-0 rounded-xl bg-muted/80" />
        )}
        <div className="min-w-0 space-y-1.5">
          <Skeleton className={cn("h-3 w-20 bg-muted/75", align === "right" && "ml-auto")} />
          <Skeleton className={cn("h-2.5 w-16 bg-muted/55", align === "right" && "ml-auto")} />
          <Skeleton className={cn("h-2.5 w-12 bg-muted/50", align === "right" && "ml-auto")} />
        </div>
        {align === "right" ? (
          <Skeleton className="h-14 w-14 shrink-0 rounded-xl bg-muted/80" />
        ) : null}
      </div>
    </div>
  );
}

export function ArenaBattleBoardGridSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-3", className)}
      aria-busy="true"
      aria-label="Loading live arena battles"
    >
      {Array.from({ length: count }).map((_, index) => (
        <ArenaBattleBoardCardSkeleton key={index} />
      ))}
    </div>
  );
}
