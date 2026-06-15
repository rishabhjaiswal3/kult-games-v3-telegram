import { ChevronDown, RotateCcw, Search } from "lucide-react";
import { MARKETPLACE_ALL_GAMES } from "@/components/marketplace/MarketplaceFiltersPanel";
import type { Game } from "@/types/api";

type InventoryToolbarProps = {
  itemCategories: string[];
  itemCategory: string;
  onCategoryChange: (category: string) => void;
  categoriesLoading: boolean;
  itemSearch: string;
  onSearchChange: (value: string) => void;
  itemGame: string;
  onGameChange: (gameId: string) => void;
  games: Game[];
  gamesLoading: boolean;
  getGameName: (name: Game["name"]) => string;
  onReset: () => void;
};

export function InventoryToolbar({
  itemCategories,
  itemCategory,
  onCategoryChange,
  categoriesLoading,
  itemSearch,
  onSearchChange,
  itemGame,
  onGameChange,
  games,
  gamesLoading,
  getGameName,
  onReset,
}: InventoryToolbarProps) {
  return (
    <div className="arena-panel flex flex-col gap-3 rounded-xl border border-white/10 bg-[#04080f]/80 px-3 py-3 backdrop-blur-lg sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div className="-mx-1 flex min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-x-auto px-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {categoriesLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="h-9 w-16 animate-pulse rounded-md bg-white/5" />
            ))
          : itemCategories.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onCategoryChange(tab)}
                className={`shrink-0 rounded-md px-3 py-2 font-tech text-[10px] font-bold uppercase tracking-wide transition-all sm:px-4 sm:text-[11px] ${
                  itemCategory === tab
                    ? "bg-gradient-to-r from-[#9a35ff] to-[#7430ff] text-white shadow-[0_0_20px_rgba(154,53,255,0.35)]"
                    : "border border-transparent text-white/45 hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/5 hover:text-white"
                }`}
              >
                {tab === "All" ? "All items" : tab}
              </button>
            ))}
      </div>

      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:w-auto sm:shrink-0 sm:flex-wrap">
        <div className="relative min-w-0 flex-1 sm:w-[200px] sm:flex-none">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            type="search"
            placeholder="Search items..."
            value={itemSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full rounded-md border border-white/10 bg-[#03070d] pl-10 pr-3 text-xs font-medium text-white shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] outline-none transition placeholder:text-white/30 focus:border-[#9a35ff]/70 focus:ring-2 focus:ring-[#9a35ff]/30"
          />
        </div>

        <div className="relative min-w-0">
          <select
            value={itemGame}
            onChange={(e) => onGameChange(e.target.value)}
            disabled={gamesLoading}
            className="h-9 w-full min-w-[120px] cursor-pointer appearance-none rounded-md border border-white/10 bg-[#03070d] py-0 pl-3 pr-9 text-xs font-semibold text-white/75 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] outline-none transition hover:text-white focus:border-[#9a35ff]/70 focus:ring-2 focus:ring-[#9a35ff]/30 disabled:opacity-50 sm:w-auto"
          >
            <option value={MARKETPLACE_ALL_GAMES}>All games</option>
            {games.map((g) => {
              const id = g.identification ?? g.slug ?? "";
              if (!id) return null;
              return (
                <option key={id} value={id}>
                  {getGameName(g.name)}
                </option>
              );
            })}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        </div>

        <button
          type="button"
          onClick={onReset}
          className="col-span-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-white/10 bg-[#0a0f1b]/70 px-3 font-tech text-[10px] font-bold uppercase tracking-wide text-white/55 transition hover:border-[#9a35ff]/35 hover:text-white sm:col-span-1"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>
    </div>
  );
}
