import { Trophy } from "lucide-react";
import { LeaguePanel } from "./LeaguePanel";
import { KP_WEEK_PROGRESS } from "./leagueData";
import { fifaSectionTitle, fifaSubTitle } from "./leagueFifaStyles";

export function LeagueKpProgress() {
  const pct = Math.round((KP_WEEK_PROGRESS.current / KP_WEEK_PROGRESS.target) * 100);

  return (
    <LeaguePanel fill={false} className="border-[#a855f7]/25">
      <h3 className={fifaSectionTitle}>KP Progress</h3>
      <p className={fifaSubTitle}>This week</p>

      <div className="mt-3">
        <div className="flex items-end justify-between gap-2">
          <p className="font-tech text-lg font-black text-[#c084fc] sm:text-xl">
            {KP_WEEK_PROGRESS.current.toLocaleString()}
            <span className="text-sm font-bold text-white/35">
              {" "}
              / {KP_WEEK_PROGRESS.target.toLocaleString()} KP
            </span>
          </p>
          <span className="font-tech text-[10px] font-bold text-white/45">{pct}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#c084fc]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/8 bg-black/30 px-3 py-2">
          <Trophy className="h-4 w-4 shrink-0 text-amber-400" />
          <div>
            <p className="font-tech text-[9px] uppercase tracking-wider text-white/40">Global Rank</p>
            <p className="font-tech text-sm font-black text-white">
              #{KP_WEEK_PROGRESS.globalRank.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </LeaguePanel>
  );
}
