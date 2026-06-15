import { Coins, FileBox, Layers, Package } from "lucide-react";
import { cn } from "@/lib/utils";

type InventoryStatsRailProps = {
  listingsCount: number;
  categoriesCount: number;
  gamesCount: number;
  activeGameLabel: string;
  className?: string;
};

export function InventoryStatsRail({
  listingsCount,
  categoriesCount,
  gamesCount,
  activeGameLabel,
  className,
}: InventoryStatsRailProps) {
  const stats = [
    { label: "Assets", value: String(listingsCount), icon: Package, color: "#9a35ff" },
    { label: "Categories", value: String(categoriesCount), icon: Coins, color: "#ffc000" },
    { label: "Games", value: String(gamesCount), icon: FileBox, color: "#00f080" },
    { label: "Filter", value: activeGameLabel, icon: Layers, color: "#0089ff", truncate: true },
  ] as const;

  return (
    <div
      className={cn(
        "arena-panel grid w-full grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-md sm:grid-cols-4 lg:min-w-0 lg:flex-1",
        className
      )}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex min-w-0 items-center gap-2.5 bg-[#060b16]/60 px-3 py-2.5 transition-colors hover:bg-[#0a1222]/80 sm:px-3.5"
        >
          <div
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.05]"
            style={{ boxShadow: `0 0 20px ${stat.color}40` }}
          >
            <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-tech text-[9px] uppercase tracking-wider text-white/45">{stat.label}</div>
            <div
              className={cn(
                "mt-0.5 font-tech text-sm font-bold leading-none text-white sm:text-base",
                "truncate" in stat && stat.truncate && "truncate"
              )}
              title={"truncate" in stat && stat.truncate ? stat.value : undefined}
            >
              {stat.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
