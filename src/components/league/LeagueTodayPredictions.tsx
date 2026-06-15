import { cn } from "@/lib/utils";
import { getLeagueAgent } from "@/constants/leagueAgents";
import { ArenaAgentMedia } from "./ArenaAgentMedia";
import { LeaguePanel } from "./LeaguePanel";
import { TODAY_PREDICTIONS } from "./leagueData";

type LeagueTodayPredictionsProps = {
  className?: string;
};

export function LeagueTodayPredictions({ className }: LeagueTodayPredictionsProps) {
  return (
    <LeaguePanel className={cn("min-w-0 max-w-full overflow-hidden p-2.5 sm:p-3", className)}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-tech text-xs font-bold uppercase tracking-[0.18em] text-white sm:text-sm">
          Today&apos;s Agent Predictions
        </h3>
        <span className="font-tech text-[10px] uppercase tracking-widest text-white/35">
          Matchday 2 · 4 live
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {TODAY_PREDICTIONS.map((prediction) => {
          const agent = getLeagueAgent(prediction.agentName);
          if (!agent) return null;

          return (
            <article
              key={prediction.agentName}
              className="flex overflow-hidden rounded-lg border bg-[#05050a]/60"
              style={{ borderColor: `${agent.accentHex}40` }}
            >
              <div className="relative h-[88px] w-[72px] shrink-0 overflow-hidden bg-black/40 sm:h-[96px] sm:w-[80px]">
                <ArenaAgentMedia src={agent.img} alt={agent.name} fit="cover" className="object-top" />
                <span
                  className="absolute left-1 top-1 rounded border px-1 py-px font-tech text-[7px] font-bold uppercase"
                  style={{
                    borderColor: `${agent.accentHex}66`,
                    color: agent.accentHex,
                    backgroundColor: `${agent.accentHex}22`,
                  }}
                >
                  {agent.tier}
                </span>
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between p-2">
                <div>
                  <p className="font-tech text-[10px] font-black uppercase text-white">{agent.name}</p>
                  <p className="text-[10px] leading-snug text-white/50 line-clamp-2">
                    &ldquo;{prediction.quote}&rdquo;
                  </p>
                </div>
                <div className="mt-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${prediction.confidence}%`,
                          backgroundColor: agent.accentHex,
                        }}
                      />
                    </div>
                    <span
                      className="shrink-0 font-tech text-[9px] font-bold"
                      style={{ color: agent.accentHex }}
                    >
                      {prediction.confidence}%
                    </span>
                  </div>
                  <p className="mt-1 font-tech text-[9px] font-bold uppercase text-white/75">
                    {prediction.pick}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </LeaguePanel>
  );
}
