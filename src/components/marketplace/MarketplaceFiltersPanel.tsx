import type { ReactNode } from "react";
import { Filter, Gamepad2, RotateCcw, Search, Tags } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { Game } from "@/types/api";

export const MARKETPLACE_ALL_GAMES = "";

type MarketplaceFiltersPanelProps = {
  itemSearch: string;
  onSearchChange: (value: string) => void;
  itemGame: string;
  onGameChange: (value: string) => void;
  itemCategory: string;
  onCategoryChange: (value: string) => void;
  itemCategories: string[];
  gamesForSelect: Game[];
  gamesLoading: boolean;
  categoriesLoading: boolean;
  onReset: () => void;
  getGameName: (name: Game["name"]) => string;
};

export function MarketplaceFiltersPanel({
  itemSearch,
  onSearchChange,
  itemGame,
  onGameChange,
  itemCategory,
  onCategoryChange,
  itemCategories,
  gamesForSelect,
  gamesLoading,
  categoriesLoading,
  onReset,
  getGameName,
}: MarketplaceFiltersPanelProps) {
  return (
    <aside className="glass-panel relative overflow-hidden rounded-2xl p-4 sm:p-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{ background: "var(--gradient-glow)" }}
      />
      <div className="relative flex h-full flex-col">
        <div className="mb-5 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-neon-cyan/30 bg-neon-cyan/10 shadow-[0_0_20px_hsl(195_100%_60%/0.12)]">
              <Filter className="h-4 w-4 text-neon-cyan" aria-hidden />
            </div>
            <div>
              <p className="font-display text-sm font-black tracking-[0.08em] text-foreground">FILTERS</p>
              {/* <p className="text-[10px] text-muted-foreground">Browse every game or narrow in</p> */}
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-background/40 px-3 py-2 text-[10px] font-display font-semibold tracking-[0.08em] text-muted-foreground transition-all hover:border-neon-cyan/30 hover:text-foreground"
            onClick={onReset}
          >
            <RotateCcw className="h-3 w-3" aria-hidden />
            Reset
          </button>
        </div>

        <div className="space-y-5">
          <FilterBlock icon={Search} label="Search">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neon-cyan/70" />
              <input
                type="text"
                value={itemSearch}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Item name or description..."
                className="h-11 w-full rounded-xl border border-white/10 bg-background/50 pl-10 pr-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-neon-cyan/50 focus:shadow-[0_0_0_3px_hsl(195_100%_60%/0.12)]"
              />
            </div>
          </FilterBlock>

          <FilterBlock icon={Gamepad2} label="Game">
            {gamesLoading ? (
              <div className="grid grid-cols-1 gap-2">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ) : gamesForSelect.length === 0 ? (
              <p className="text-xs text-muted-foreground">No games available.</p>
            ) : (
              <div className="max-h-44 space-y-2 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                <GameChip
                  active={itemGame === MARKETPLACE_ALL_GAMES}
                  onClick={() => onGameChange(MARKETPLACE_ALL_GAMES)}
                  label="All games"
                  hint="Every listing"
                />
                {gamesForSelect.map((g) => {
                  const id = g.identification ?? g.slug ?? "";
                  if (!id) return null;
                  return (
                    <GameChip
                      key={id}
                      active={itemGame === id}
                      onClick={() => onGameChange(id)}
                      label={getGameName(g.name)}
                    />
                  );
                })}
              </div>
            )}
          </FilterBlock>

          <FilterBlock icon={Tags} label="Category">
            {categoriesLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {itemCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => onCategoryChange(cat)}
                    className={cn(
                      "rounded-xl border px-2.5 py-2.5 text-left text-[10px] font-display font-semibold tracking-[0.06em] transition-all",
                      itemCategory === cat
                        ? "border-neon-cyan/50 bg-neon-cyan/15 text-neon-cyan shadow-[0_0_16px_hsl(195_100%_60%/0.15)]"
                        : "border-white/10 bg-background/35 text-muted-foreground hover:border-neon-cyan/30 hover:text-foreground"
                    )}
                  >
                    {cat === "All" ? "ALL" : cat.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </FilterBlock>
        </div>
      </div>
    </aside>
  );
}

function FilterBlock({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Search;
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-neon-purple/80" aria-hidden />
        <label className="font-display text-[9px] tracking-[0.18em] text-muted-foreground">{label.toUpperCase()}</label>
      </div>
      {children}
    </div>
  );
}

function GameChip({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-all",
        active
          ? "border-neon-cyan/50 bg-gradient-to-r from-neon-cyan/15 to-neon-purple/10 text-neon-cyan shadow-[0_0_18px_hsl(195_100%_60%/0.12)]"
          : "border-white/10 bg-background/35 text-foreground/90 hover:border-neon-cyan/25 hover:bg-background/50"
      )}
    >
      <span className="truncate font-display text-[11px] font-bold tracking-[0.04em]">{label}</span>
      {hint ? <span className="shrink-0 text-[9px] text-muted-foreground">{hint}</span> : null}
    </button>
  );
}
