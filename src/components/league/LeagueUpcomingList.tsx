import { FlagCircle } from "./FlagHex";
import { LeaguePanel } from "./LeaguePanel";
import { UPCOMING_MATCHES } from "./leagueData";

export function LeagueUpcomingList() {
  return (
    <LeaguePanel fill={false} className="flex flex-col p-3 sm:p-4">
      <h3 className="font-tech text-xs font-bold uppercase tracking-wider text-white sm:text-sm">
        Upcoming Matches
      </h3>
      <p className="mt-0.5 text-[11px] text-white/45">Schedule & countdowns</p>

      <ul className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5 scrollbar-none">
        {UPCOMING_MATCHES.map((match) => (
          <li
            key={match.id}
            className="rounded-lg border border-white/8 bg-black/25 px-2.5 py-2 transition hover:border-[#a855f7]/25 sm:px-3 sm:py-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <FlagCircle code={match.home} className="h-6 w-6" />
                <span className="font-tech text-[9px] font-bold uppercase text-white/35">vs</span>
                <FlagCircle code={match.away} className="h-6 w-6" />
                <span className="ml-0.5 truncate font-tech text-[10px] font-bold uppercase text-white/80 sm:text-xs">
                  {match.home} / {match.away}
                </span>
              </div>
              <span className="shrink-0 font-mono text-[9px] tabular-nums text-[#a855f7] sm:text-[10px]">
                {match.countdown}
              </span>
            </div>
            <p className="mt-1 font-tech text-[9px] uppercase tracking-widest text-white/40">
              {match.time}
            </p>
          </li>
        ))}
      </ul>
    </LeaguePanel>
  );
}
