import { ChevronRight } from "lucide-react";
import { getLeagueAgent } from "@/constants/leagueAgents";
import { ArenaAgentMedia } from "./ArenaAgentMedia";
import { LeagueStadiumBackground } from "./LeagueStadiumBackground";
import { FEATURED_MATCH } from "./leagueData";

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-red-500/50 bg-red-500/20 px-2 py-0.5 font-tech text-[9px] font-bold uppercase tracking-wider text-red-300">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
      </span>
      Live
    </span>
  );
}

export function LeagueFeaturedBanner() {
  const match = FEATURED_MATCH;
  const userPick = match.userAgentPick;
  const userAgent = getLeagueAgent(userPick.agentName);

  return (
    <section className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-[#a855f7]/40 shadow-[0_0_56px_rgba(168,85,247,0.15)]">
      {/* Video — full width on all breakpoints */}
      <div className="relative aspect-video w-full min-w-0 max-w-full overflow-hidden sm:aspect-auto sm:h-[340px] md:h-[400px]">
        <LeagueStadiumBackground clean />
      </div>

      {/* Content below video — never overlaid */}
      <div className="w-full min-w-0 border-t border-white/10 bg-[#05050a] px-3 py-3 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-tech text-[10px] font-bold uppercase tracking-[0.22em] text-white sm:text-xs">
              Today&apos;s Featured Match
            </p>
            {match.isLive ? <LiveBadge /> : null}
          </div>
          <div className="sm:text-right">
            <p className="font-tech text-[10px] font-bold uppercase tracking-wider text-white sm:text-xs">
              FIFA World Cup 2026™
            </p>
            <p className="font-tech text-[9px] uppercase tracking-widest text-white/55">
              {match.stage} · Matchday {match.matchday}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-white/12 bg-black/40 p-3 sm:mt-4 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#a855f7]/50 bg-black/50 sm:h-16 sm:w-16">
                {userAgent ? (
                  <ArenaAgentMedia src={userAgent.img} alt={userAgent.name} fit="cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-tech text-[9px] uppercase tracking-[0.2em] text-[#c084fc]">
                  Your Agent&apos;s Pick
                </p>
                <p className="font-tech text-sm font-black uppercase text-white sm:text-base">
                  {userPick.agentName}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-white/65">
                  Predicted:{" "}
                  <span className="font-tech font-bold text-white">{userPick.predictedScore}</span>
                  <span className="text-white/40"> · </span>
                  <span className="text-emerald-400">{userPick.predictedWinner}</span>
                </p>
              </div>
            </div>

            <div className="flex w-full min-w-0 flex-col gap-2 sm:w-52 sm:shrink-0">
              <div className="flex justify-between font-tech text-[9px] uppercase tracking-wider text-white/55">
                <span>Confidence</span>
                <span className="font-bold text-[#c084fc]">{userPick.confidence}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#c084fc]"
                  style={{ width: `${userPick.confidence}%` }}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById("league-fight-arena")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                  className="inline-flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-md border border-white/25 bg-white/5 py-2 font-tech text-[9px] font-bold uppercase tracking-wider text-white transition hover:border-[#a855f7]/50 hover:bg-[#a855f7]/25 sm:text-[10px]"
                >
                  Live Stats
                  <ChevronRight className="h-3 w-3 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById("league-prediction-questions")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                  className="min-h-[36px] flex-1 rounded-md border border-[#a855f7]/50 bg-[#a855f7]/25 py-2 font-tech text-[9px] font-bold uppercase tracking-wider text-white transition hover:bg-[#a855f7]/40 sm:text-[10px]"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
