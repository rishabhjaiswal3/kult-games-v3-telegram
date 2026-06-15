import { Swords, Zap } from "lucide-react";
import { getLeagueAgent } from "@/constants/leagueAgents";
import type { LeaguePredictionQuestion } from "./leagueData";
import { ArenaAgentMedia } from "./ArenaAgentMedia";

export function LeagueFightScene({
  leftAgent,
  rightAgent,
  subtitle,
  compact,
}: {
  leftAgent: string;
  rightAgent: string;
  subtitle?: string;
  compact?: boolean;
}) {
  const left = getLeagueAgent(leftAgent);
  const right = getLeagueAgent(rightAgent);

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#a855f7]/35 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.22),transparent_55%),linear-gradient(180deg,rgba(8,10,18,0.96),rgba(4,6,12,0.98))] shadow-[0_0_32px_rgba(168,85,247,0.08)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_65%,rgba(251,191,36,0.14),transparent_48%)]" />
      <div
        className={`relative flex items-end justify-between px-3 sm:px-5 ${
          compact ? "min-h-[140px] sm:min-h-[160px]" : "min-h-[180px] sm:min-h-[220px]"
        }`}
      >
        <div className="relative h-[90%] w-[40%] max-w-[200px]">
          {left ? (
            <ArenaAgentMedia src={left.img} alt={left.name} fit="contain" className="object-bottom" />
          ) : null}
        </div>

        <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1">
          <Zap className="h-7 w-7 text-amber-400 drop-shadow-[0_0_16px_rgba(251,191,36,0.75)] sm:h-9 sm:w-9" />
          <span className="font-tech text-sm font-black uppercase tracking-[0.28em] text-white sm:text-base">
            VS
          </span>
          {subtitle ? (
            <span className="font-tech text-[8px] uppercase tracking-widest text-amber-400/80">
              {subtitle}
            </span>
          ) : null}
        </div>

        <div className="relative h-[90%] w-[40%] max-w-[200px]">
          {right ? (
            <ArenaAgentMedia
              src={right.img}
              alt={right.name}
              fit="contain"
              className="object-bottom -scale-x-100"
            />
          ) : null}
        </div>
      </div>
      <div className="flex justify-between border-t border-white/10 bg-black/30 px-4 py-2 font-tech text-[10px] uppercase tracking-wider">
        <span className="text-white/75">{leftAgent}</span>
        <span className="text-[#c084fc]">Agent duel</span>
        <span className="text-white/75">{rightAgent}</span>
      </div>
    </div>
  );
}

export function LeagueQuestionCard({ question }: { question: LeaguePredictionQuestion }) {
  return (
    <article className="w-[min(100%,300px)] shrink-0 snap-center rounded-xl border border-white/12 bg-[#080b12]/90 p-3 sm:w-[300px]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="rounded border border-[#a855f7]/35 bg-[#a855f7]/12 px-2 py-0.5 font-tech text-[8px] font-bold uppercase tracking-wider text-[#c084fc]">
          {question.category}
        </span>
        <Swords className="h-3.5 w-3.5 text-white/30" />
      </div>
      <p className="font-tech text-sm font-bold leading-snug text-white">{question.question}</p>
      <div className="mt-3 space-y-2">
        {[question.agentA, question.agentB].map((agent, idx) => {
          const data = getLeagueAgent(agent.agentName);
          const accent = data?.accentHex ?? "#a855f7";
          return (
            <div
              key={agent.agentName}
              className="flex items-center gap-2.5 rounded-lg border bg-black/35 p-2.5"
              style={{ borderColor: `${accent}35` }}
            >
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10">
                {data ? (
                  <ArenaAgentMedia
                    src={data.img}
                    alt={data.name}
                    fit="cover"
                    className={idx === 1 ? "-scale-x-100" : undefined}
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-tech text-[10px] font-bold uppercase text-white">{agent.agentName}</p>
                <p className="font-tech text-[11px] font-bold text-white/90">{agent.pick}</p>
              </div>
              <div className="shrink-0 text-right font-tech text-[9px] uppercase tracking-wider">
                <p style={{ color: accent }}>{agent.confidence}%</p>
                <p className="text-[#00f080]">{agent.stake} KP</p>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
