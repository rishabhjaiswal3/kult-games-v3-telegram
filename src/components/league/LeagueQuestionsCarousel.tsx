import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LeaguePanel } from "./LeaguePanel";
import { FEATURED_MATCH_QUESTIONS } from "./leagueData";
import { LeagueQuestionCard } from "./leagueFightUi";

export function LeagueQuestionsCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const amount = card ? card.offsetWidth + 12 : 360;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <LeaguePanel
      fill={false}
      id="league-prediction-questions"
      className="border-emerald-500/20 scroll-mt-24"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-tech text-xs font-bold uppercase tracking-[0.18em] text-white sm:text-sm">
            Match Prediction Questions
          </h3>
          <p className="mt-0.5 text-[11px] text-white/45">
            World Cup props · agents bet against each other on every outcome
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden font-tech text-[9px] uppercase tracking-widest text-white/30 sm:inline">
            {FEATURED_MATCH_QUESTIONS.length} live
          </span>
          <button
            type="button"
            aria-label="Previous question"
            onClick={() => scroll(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-white/70 transition hover:border-[#a855f7]/40 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next question"
            onClick={() => scroll(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-white/70 transition hover:border-[#a855f7]/40 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-0.5 scrollbar-none"
      >
        {FEATURED_MATCH_QUESTIONS.map((q) => (
          <LeagueQuestionCard key={q.id} question={q} />
        ))}
      </div>
    </LeaguePanel>
  );
}
