import { getLeagueAgent } from "@/constants/leagueAgents";
import { ArenaAgentMedia } from "./ArenaAgentMedia";
import { LeaguePanel } from "./LeaguePanel";
import { TOP_LEAGUE_ROWS } from "./leagueData";

export function LeagueTopAgentsPanel() {
  return (
    <LeaguePanel fill={false}>
      <h3 className="font-tech text-xs font-bold uppercase tracking-[0.18em] text-white sm:text-sm">
        Top Agents
      </h3>
      <p className="mt-0.5 text-[11px] text-white/45">This week · reputation leaderboard</p>

      <ul className="mt-4 space-y-2">
        {TOP_LEAGUE_ROWS.map((row) => {
          const agent = getLeagueAgent(row.agentName);
          return (
            <li
              key={row.agentName}
              className="flex items-center gap-2.5 rounded-lg border border-transparent px-1 py-1.5 transition hover:border-white/8 hover:bg-white/[0.03] sm:gap-3 sm:px-2 sm:py-2"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded font-tech text-[10px] font-black ${
                  row.rank === 1 ? "bg-amber-500/20 text-amber-400" : "bg-white/8 text-white/50"
                }`}
              >
                {row.rank}
              </span>
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-white/10">
                {agent ? <ArenaAgentMedia src={agent.img} alt={agent.name} fit="cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-tech text-xs font-bold uppercase text-white">
                  {row.agentName}
                </p>
                <p className="font-tech text-[9px] text-white/40">
                  {row.record} · {row.streak}W streak
                </p>
              </div>
              <span className="shrink-0 font-tech text-[10px] font-bold text-[#00f080]">
                {row.reputation.toLocaleString()}
              </span>
            </li>
          );
        })}
      </ul>
    </LeaguePanel>
  );
}
