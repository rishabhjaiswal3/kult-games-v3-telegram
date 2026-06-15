import { getLeagueAgent } from "@/constants/leagueAgents";
import { ArenaAgentMedia } from "./ArenaAgentMedia";
import { LeaguePanel } from "./LeaguePanel";
import { RIVALRY } from "./leagueData";

export function LeagueRivalries() {
  const left = getLeagueAgent(RIVALRY.leftAgent);
  const right = getLeagueAgent(RIVALRY.rightAgent);

  return (
    <LeaguePanel fill={false}>
      <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-white">Rivalries</h3>
      <p className="mt-1 font-tech text-[10px] uppercase tracking-widest text-white/35">
        Head to Head
      </p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex flex-col items-center gap-2 text-center min-w-0 flex-1">
          <div className="h-14 w-14 overflow-hidden rounded-xl border border-white/10 bg-black/40 sm:h-16 sm:w-16">
            {left ? <ArenaAgentMedia src={left.img} alt={left.name} fit="cover" /> : null}
          </div>
          <span className="truncate font-tech text-[10px] font-bold uppercase text-white sm:text-xs">
            {RIVALRY.leftAgent}
          </span>
          <span className="font-tech text-xl font-black text-emerald-400 sm:text-2xl">
            {RIVALRY.leftWins}
          </span>
        </div>

        <span className="font-tech text-[10px] uppercase tracking-[0.2em] text-white/30 shrink-0">
          VS
        </span>

        <div className="flex flex-col items-center gap-2 text-center min-w-0 flex-1">
          <div className="h-14 w-14 overflow-hidden rounded-xl border border-white/10 bg-black/40 sm:h-16 sm:w-16">
            {right ? (
              <ArenaAgentMedia src={right.img} alt={right.name} fit="cover" className="-scale-x-100" />
            ) : null}
          </div>
          <span className="truncate font-tech text-[10px] font-bold uppercase text-white sm:text-xs">
            {RIVALRY.rightAgent}
          </span>
          <span className="font-tech text-xl font-black text-blue-400 sm:text-2xl">
            {RIVALRY.rightWins}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-white/8 bg-white/5 px-2 py-2 text-center sm:px-3">
          <p className="font-tech text-[9px] uppercase tracking-wider text-white/40">Reputation</p>
          <p className="font-tech text-sm font-bold text-amber-400">+{RIVALRY.reputationReward}</p>
        </div>
        <div className="rounded-lg border border-white/8 bg-white/5 px-2 py-2 text-center sm:px-3">
          <p className="font-tech text-[9px] uppercase tracking-wider text-white/40">KP Reward</p>
          <p className="font-tech text-sm font-bold text-[#00f080]">+{RIVALRY.kpReward} KP</p>
        </div>
      </div>
    </LeaguePanel>
  );
}
