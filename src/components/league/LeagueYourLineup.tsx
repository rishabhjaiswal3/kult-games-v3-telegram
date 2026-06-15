import { getLeagueAgent } from "@/constants/leagueAgents";
import { ArenaAgentMedia } from "./ArenaAgentMedia";
import { LeaguePanel } from "./LeaguePanel";
import { YOUR_LINEUP } from "./leagueData";

export function LeagueYourLineup() {
  return (
    <LeaguePanel fill={false} className="border-[#a855f7]/25">
      <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-white">
        Your Agent Lineup
      </h3>
      <p className="mt-1 text-xs text-white/45">Active roster stats</p>

      <ul className="mt-4 space-y-2.5 sm:space-y-3">
        {YOUR_LINEUP.map((row) => {
          const agent = getLeagueAgent(row.agentName);
          return (
            <li
              key={row.agentName}
              className="flex items-center gap-3 rounded-lg border border-white/8 bg-black/25 px-3 py-2.5"
            >
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10">
                {agent ? <ArenaAgentMedia src={agent.img} alt={agent.name} fit="cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-tech text-xs font-bold uppercase text-white">
                  {row.agentName}
                </p>
                <p className="font-tech text-[9px] text-white/40">
                  Rep {row.reputation.toLocaleString()} · {row.record}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-tech text-[9px] uppercase tracking-wider text-white/35">$ARENA</p>
                <p className="font-tech text-sm font-bold text-[#a855f7]">{row.arena}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </LeaguePanel>
  );
}
