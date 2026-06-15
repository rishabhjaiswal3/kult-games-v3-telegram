import { type MouseEvent } from "react";
import { ShoppingCart } from "lucide-react";
import { InventoryAssetImage } from "@/components/inventory/InventoryAssetImage";
import { cn } from "@/lib/utils";
import type { MarketplaceListing } from "@/types/api";

type InventoryListingCardProps = {
  item: MarketplaceListing;
  gameName?: string;
  selected?: boolean;
  onSelect?: (item: MarketplaceListing) => void;
  onBuy: (item: MarketplaceListing) => void;
};

function getCategoryBadgeStyle(category: string) {
  const key = category.toLowerCase();
  if (key.includes("legendary") || key.includes("bundle"))
    return "bg-amber-950/90 border-amber-500/45 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]";
  if (key.includes("weapon") || key.includes("skin"))
    return "bg-purple-950/90 border-purple-500/45 text-[#e8d4ff]";
  if (key.includes("boost") || key.includes("module"))
    return "bg-blue-950/90 border-blue-500/45 text-blue-300";
  return "bg-purple-950/90 border-purple-500/45 text-[#d6acff]";
}

export function InventoryListingCard({ item, gameName, selected, onSelect, onBuy }: InventoryListingCardProps) {
  const badgeClass = getCategoryBadgeStyle(item.category);
  const gameBadgeLabel = gameName?.trim() || item.gameIdentification;

  const handleCardClick = () => {
    if (onSelect) onSelect(item);
    else onBuy(item);
  };

  const handleBuy = (e: MouseEvent) => {
    e.stopPropagation();
    onBuy(item);
  };

  return (
    <article
      className={cn(
        "inventory-listing-card group relative flex flex-col overflow-hidden rounded-xl border bg-[#04080f]/90 transition-all duration-300 hover:-translate-y-1",
        selected
          ? "border-[#9a35ff]/80 shadow-[0_0_30px_rgba(154,53,255,0.3)] ring-1 ring-[#9a35ff]/60"
          : "border-white/10 hover:border-[#9a35ff]/50 hover:shadow-[0_15px_40px_rgba(0,0,0,0.6),0_0_25px_rgba(154,53,255,0.15)]"
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(154, 53, 255, 0.08), transparent 55%)",
        }}
        aria-hidden
      />

      {selected ? (
        <span className="absolute left-0 top-0 z-10 h-full w-1 bg-gradient-to-b from-[#9a35ff] via-[#b12eff] to-[#7430ff]" aria-hidden />
      ) : null}

      <button
        type="button"
        onClick={handleCardClick}
        className="relative w-full cursor-pointer overflow-hidden text-left"
      >
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[#04080f]/48" aria-hidden />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(154,53,255,0.12),transparent_62%)]" aria-hidden />
          <InventoryAssetImage
            src={item.assetUrl}
            alt={item.name}
            compact
            className="relative aspect-[4/3] w-full min-h-[112px] max-h-[128px] sm:max-h-[140px] transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#04080f] to-transparent" />
        <span
          className={cn(
            "absolute left-2 top-2 z-[2] rounded-md border px-2 py-0.5 font-tech text-[8px] font-black uppercase tracking-wider backdrop-blur-sm",
            badgeClass
          )}
        >
          {item.category}
        </span>
        <span
          className="absolute right-2 top-2 z-[2] max-w-[42%] truncate rounded border border-cyan-300/30 bg-cyan-950/75 px-1.5 py-px text-right font-tech text-[7px] font-black uppercase tracking-wide text-cyan-200 shadow-[0_0_10px_rgba(103,232,249,0.12)] backdrop-blur-sm transition duration-300 group-hover:border-cyan-200/50 group-hover:bg-cyan-900/85 group-hover:text-white"
          title={gameBadgeLabel}
        >
          {gameBadgeLabel}
        </span>
      </button>

      <div className="relative flex flex-col gap-2 border-t border-white/8 bg-[#060b14]/80 px-3 pb-3 pt-2.5">
        <button
          type="button"
          onClick={handleCardClick}
          className="line-clamp-1 text-left text-xs font-semibold leading-tight text-white transition group-hover:text-[#d6acff]"
          title={item.name}
        >
          {item.name}
        </button>

        {item.shortDescription ? (
          <p className="line-clamp-1 text-[10px] leading-snug text-white/42">{item.shortDescription}</p>
        ) : null}

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div>
            <span className="font-tech text-[8px] uppercase tracking-wider text-white/35">Price</span>
            <p className="font-tech text-base font-bold leading-none text-[#ffc000]">
              {item.price}
              <span className="ml-1 text-[10px] font-semibold text-white/45">{item.currency}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleBuy}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-gradient-to-r from-[#9a35ff] to-[#7430ff] px-3 font-tech text-[9px] font-bold uppercase tracking-wider text-white shadow-[0_0_15px_rgba(154,53,255,0.3)] transition-all hover:scale-105 hover:from-[#a855ff] hover:to-[#884dff] hover:shadow-[0_0_25px_rgba(154,53,255,0.5)]"
            aria-label={`Buy ${item.name}`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Buy
          </button>
        </div>
      </div>
    </article>
  );
}

export function InventoryListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#04080f]/95">
      <div className="aspect-[4/3] max-h-[140px] animate-pulse bg-white/[0.04]" />
      <div className="space-y-2.5 border-t border-white/8 p-3">
        <div className="h-3 w-4/5 animate-pulse rounded bg-white/5" />
        <div className="h-2 w-full animate-pulse rounded bg-white/5" />
        <div className="h-8 w-full animate-pulse rounded-md bg-white/5" />
      </div>
    </div>
  );
}
