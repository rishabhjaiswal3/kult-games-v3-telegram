import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FlagHex } from "./FlagHex";
import { LeaguePanel } from "./LeaguePanel";
import { UPCOMING_MATCHES } from "./leagueData";
import { fifaMakePickBtn, fifaSectionTitle, fifaSubTitle } from "./leagueFifaStyles";

export function LeagueUpcomingCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const amount = card ? card.offsetWidth + 12 : 200;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <LeaguePanel fill={false}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h3 className={fifaSectionTitle}>Upcoming Matches</h3>
          <p className={fifaSubTitle}>Group stage fixtures · make your pick before kickoff</p>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            aria-label="Previous matches"
            onClick={() => scroll(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-white/70 transition hover:border-[#a855f7]/40 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next matches"
            onClick={() => scroll(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-white/70 transition hover:border-[#a855f7]/40 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 scrollbar-none"
      >
        {UPCOMING_MATCHES.map((match) => (
          <article
            key={match.id}
            className="w-[min(100%,200px)] shrink-0 snap-center rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-black/40 p-3 sm:w-[180px]"
          >
            <div className="flex items-center justify-center gap-2">
              <FlagHex code={match.home} size="md" />
              <span className="font-tech text-[9px] font-bold uppercase text-white/30">vs</span>
              <FlagHex code={match.away} size="md" />
            </div>
            <p className="mt-2 text-center font-tech text-[10px] font-bold uppercase text-white/80">
              {match.home} vs {match.away}
            </p>
            <p className="mt-1 text-center font-tech text-[9px] uppercase tracking-wider text-[#c084fc]">
              {match.displayTime}
            </p>
            <p className="mt-0.5 text-center font-tech text-[8px] uppercase tracking-widest text-white/35">
              {match.stage}
            </p>
            <button type="button" className={`mt-3 ${fifaMakePickBtn}`}>
              Make Pick
            </button>
          </article>
        ))}
      </div>
    </LeaguePanel>
  );
}
