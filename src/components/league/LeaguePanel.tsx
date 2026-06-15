import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LeaguePanelProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  /** Stretch to fill grid cell height */
  fill?: boolean;
};

/** Shared glass card shell for league widgets. */
export function LeaguePanel({ children, className, id, fill = false }: LeaguePanelProps) {
  return (
    <section
      id={id}
      className={cn(
        "card-glass min-w-0 max-w-full rounded-xl border border-white/10 bg-[#05050a]/40 p-3 sm:p-4",
        fill && "h-full min-h-0",
        className,
      )}
    >
      {children}
    </section>
  );
}
