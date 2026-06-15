import { FlagCircle } from "./FlagHex";
import { LeaguePanel } from "./LeaguePanel";
import { RECENT_PICKS } from "./leagueData";
import { fifaSectionTitle, fifaSubTitle } from "./leagueFifaStyles";

const OUTCOME_STYLES = {
  WIN: "border-emerald-500/35 bg-emerald-500/15 text-emerald-400",
  LOSS: "border-red-500/35 bg-red-500/15 text-red-400",
  DRAW: "border-amber-500/35 bg-amber-500/15 text-amber-400",
} as const;

export function LeagueRecentPicks() {
  return (
    <LeaguePanel fill={false}>
      <h3 className={fifaSectionTitle}>My Recent Picks</h3>
      <p className={fifaSubTitle}>Match results & KP earned this week</p>

      <div className="mt-3 overflow-x-auto scrollbar-none">
        <table className="w-full min-w-[520px] text-left">
          <thead>
            <tr className="border-b border-white/8 font-tech text-[9px] uppercase tracking-wider text-white/40">
              <th className="pb-2 pr-3">Match</th>
              <th className="pb-2 pr-3">Your Pick</th>
              <th className="pb-2 pr-3">Agent Confidence</th>
              <th className="pb-2 pr-3">Result</th>
              <th className="pb-2 text-right">KP Earned</th>
            </tr>
          </thead>
          <tbody>
            {RECENT_PICKS.map((row) => (
              <tr key={row.id} className="border-b border-white/5 last:border-0">
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-1.5">
                    <FlagCircle code={row.home} className="h-5 w-5" />
                    <span className="font-tech text-[9px] text-white/35">vs</span>
                    <FlagCircle code={row.away} className="h-5 w-5" />
                    <span className="ml-1 font-tech text-[10px] font-bold uppercase text-white/75">
                      {row.home}/{row.away}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 pr-3 font-tech text-[10px] font-bold text-white/80">
                  {row.pick}
                </td>
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10 sm:w-24">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#c084fc]"
                        style={{ width: `${row.confidence}%` }}
                      />
                    </div>
                    <span className="font-tech text-[9px] font-bold text-[#c084fc]">
                      {row.confidence}%
                    </span>
                  </div>
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`inline-flex rounded border px-2 py-0.5 font-tech text-[9px] font-bold uppercase tracking-wider ${OUTCOME_STYLES[row.outcome]}`}
                  >
                    {row.result} {row.outcome}
                  </span>
                </td>
                <td className="py-2.5 text-right font-tech text-[10px] font-bold text-[#00f080]">
                  {row.kpEarned > 0 ? `+${row.kpEarned} KP` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LeaguePanel>
  );
}
