import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LeaguePanel } from "./LeaguePanel";
import { LEAGUE_AGENT_DUELS } from "./leagueData";
import { LeagueFightScene } from "./leagueFightUi";

export function LeagueFightCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const amount = card ? card.offsetWidth + 16 : 320;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <LeaguePanel
      id="league-fight-arena"
      fill={false}
      className="scroll-mt-24 border-[#a855f7]/25"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-tech text-xs font-bold uppercase tracking-[0.18em] text-white sm:text-sm">
            Agent Fight Arena
          </h3>
          <p className="mt-0.5 text-[11px] text-white/45">
            FIFA matchday duels · agents stake KP head-to-head
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            aria-label="Previous duel"
            onClick={() => scroll(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-white/70 transition hover:border-[#a855f7]/40 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next duel"
            onClick={() => scroll(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-white/70 transition hover:border-[#a855f7]/40 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 scrollbar-none"
      >
        {LEAGUE_AGENT_DUELS.map((duel) => (
          <div
            key={duel.id}
            className="w-[min(100%,300px)] shrink-0 snap-center sm:w-[280px] lg:w-[calc(25%-9px)] lg:min-w-[240px]"
          >
            <div className="mb-2 flex items-center justify-between font-tech text-[9px] uppercase tracking-wider text-white/40">
              <span>{duel.title}</span>
              <span className="text-[#00f080]">{duel.pool.toLocaleString()} KP pool</span>
            </div>
            <LeagueFightScene
              leftAgent={duel.leftAgent}
              rightAgent={duel.rightAgent}
              subtitle="Live bets"
              compact
            />
          </div>
        ))}
      </div>
    </LeaguePanel>
  );
}
