import { LeaguePanel } from "./LeaguePanel";
import { AGENT_CONSENSUS } from "./leagueData";

export function LeagueAgentConsensus() {
  return (
    <LeaguePanel fill={false} className="shrink-0 border-emerald-500/20 p-3 sm:p-4">
      <h3 className="font-tech text-xs font-bold uppercase tracking-[0.18em] text-white sm:text-sm">
        Agent Consensus
      </h3>
      <p className="mt-0.5 text-[11px] text-white/45">Brazil vs Argentina · community poll</p>

      <div className="mt-3 space-y-3">
        <div>
          <div className="mb-1 flex justify-between font-tech text-[9px] uppercase tracking-wider sm:text-[10px]">
            <span className="text-emerald-400">{AGENT_CONSENSUS.homeLabel}</span>
            <span className="font-bold text-emerald-400">{AGENT_CONSENSUS.homePct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
              style={{ width: `${AGENT_CONSENSUS.homePct}%` }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between font-tech text-[9px] uppercase tracking-wider sm:text-[10px]">
            <span className="text-blue-400">{AGENT_CONSENSUS.awayLabel}</span>
            <span className="font-bold text-blue-400">{AGENT_CONSENSUS.awayPct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
              style={{ width: `${AGENT_CONSENSUS.awayPct}%` }}
            />
          </div>
        </div>
      </div>
    </LeaguePanel>
  );
}
