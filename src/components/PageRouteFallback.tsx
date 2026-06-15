import { Skeleton } from "@/components/ui/skeleton";

/** Lightweight shell shown while a lazy route chunk loads. */
export function PageRouteFallback() {
  return (
    <div className="mx-auto w-full max-w-full animate-pulse space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-48 rounded-md bg-white/10" />
      <Skeleton className="h-4 w-full max-w-xl rounded bg-white/8" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[16/9] rounded-lg bg-white/8" />
        ))}
      </div>
    </div>
  );
}
