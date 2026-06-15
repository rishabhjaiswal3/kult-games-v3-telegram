import { Link } from "react-router-dom";
import { ArrowUpRight, Plus } from "lucide-react";
import { ArenaAgentThumbnail } from "@/components/arena/ArenaAgentThumbnail";
import { Metric } from "@/components/dashboard/Metric";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AiArenaAgent } from "@/types/aiArenaGateway";

type DashboardLiveAgentPanelProps = {
  agent: AiArenaAgent | null;
  agents: AiArenaAgent[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  isLoading: boolean;
  onCreateAgent: () => void;
};

function winRatePct(agent: AiArenaAgent): number {
  const draws = agent.draws ?? 0;
  const total = agent.wins + agent.losses + draws;
  if (total === 0) return 0;
  return Math.round((agent.wins / total) * 1000) / 10;
}

function winRate(agent: AiArenaAgent): string {
  return `${winRatePct(agent)}%`;
}

function formatAgentOption(agent: AiArenaAgent) {
  return `${agent.name} — ${agent.archetype} — ELO ${agent.eloRating.toLocaleString()}`;
}

export function DashboardLiveAgentPanel({
  agent,
  agents,
  selectedAgentId,
  onSelectAgent,
  isLoading,
  onCreateAgent,
}: DashboardLiveAgentPanelProps) {
  if (isLoading) {
    return (
      <section className="arena-panel flex min-h-[200px] items-center justify-center border-white/8 bg-[#04080f]/95 p-8">
        <span className="font-tech text-[10px] uppercase tracking-wider text-white/40">Loading agent…</span>
      </section>
    );
  }

  if (!agent) {
    return (
      <section className="arena-panel flex flex-col items-center justify-center gap-4 border-white/8 bg-[#04080f]/95 p-8 text-center">
        <p className="text-sm text-white/55">No AI agent yet. Create one to enter the arena.</p>
        <button
          type="button"
          onClick={onCreateAgent}
          className="btn-primary inline-flex items-center gap-2 rounded-md px-5 py-2.5 font-tech text-[10px] font-bold uppercase tracking-wider"
        >
          <Plus className="h-4 w-4" />
          Create agent
        </button>
      </section>
    );
  }

  return (
    <section className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#04080f]/60 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 hover:border-[#8b29ff]/40 hover:shadow-[0_8px_40px_rgba(139,41,255,0.15)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_50%,rgba(139,41,255,0.05),transparent_50%),radial-gradient(circle_at_100%_100%,rgba(0,255,128,0.03),transparent_50%)]" />
      <div className="relative z-10 grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="relative h-[280px] overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#180b2b] via-[#0a0f18] to-[#04080f] lg:h-auto lg:border-b-0 lg:border-r">
          <ArenaAgentThumbnail
            agent={agent}
            size="md"
            className="h-full w-full rounded-none border-0 bg-transparent"
          />
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="inline-block rounded border border-[#8b29ff]/50 bg-[#5b1499]/35 px-2 py-0.5 font-tech text-[9px] font-bold uppercase tracking-wider text-[#d773ff] shadow-[0_0_10px_rgba(139,41,255,0.3)]">
                {agent.archetype}
              </span>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80 drop-shadow-sm">{agent.name}</h2>
              <p className="mt-1 text-sm text-white/55">
                {agent.clan} · {agent.evolutionStage}
              </p>
            </div>
            <div className="w-full space-y-3 sm:max-w-[320px] sm:text-right">
              <div>
                <div className="mb-1.5 font-tech text-[9px] uppercase tracking-[0.18em] text-white/40">Your agents</div>
                <Select value={selectedAgentId ?? agent.id} onValueChange={onSelectAgent}>
                  <SelectTrigger className="h-11 rounded-md border-white/10 bg-[#0a0f1b]/70 text-left font-tech text-[11px] uppercase tracking-wide text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] focus:border-[#8b29ff]/40 focus:ring-[#8b29ff]/20 focus:ring-offset-0">
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent className="z-[120] border-white/10 bg-[#070c14] text-white">
                    {agents.map((row) => (
                      <SelectItem
                        key={row.id}
                        value={row.id}
                        className="font-tech text-[11px] uppercase tracking-wide focus:bg-white/10 focus:text-white"
                      >
                        {formatAgentOption(row)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-tech text-[9px] uppercase tracking-wider text-white/45">
                  {agents.length} fighter{agents.length === 1 ? "" : "s"}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 font-tech text-[9px] font-bold uppercase ${
                    agent.status?.toLowerCase() === "inactive"
                      ? "border-amber-500/35 bg-amber-950/50 text-amber-400"
                      : "border-emerald-500/35 bg-emerald-950/50 text-[#00f080]"
                  }`}
                >
                  {agent.status || "Active"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="font-tech text-sm text-white">ELO {agent.eloRating.toLocaleString()}</span>
            <div className="h-1.5 min-w-0 flex-1 rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#7430ff] to-[#b12eff]"
                style={{ width: `${winRatePct(agent)}%` }}
              />
            </div>
            <span className="text-xs text-white/50">Win rate {winRate(agent)}</span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-0 rounded-md border border-white/10 bg-[#0a0f1b]/50 backdrop-blur-sm sm:grid-cols-4 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
            <Metric label="Battles" value={String(agent.wins + agent.losses + (agent.draws ?? 0))} />
            <Metric label="Wins" value={String(agent.wins)} />
            <Metric label="Losses" value={String(agent.losses)} />
            <Metric label="ELO" value={agent.eloRating.toLocaleString()} icon />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link
              to="/my-agents"
              className="btn-primary relative overflow-hidden flex h-10 items-center justify-center gap-2 rounded-md font-tech text-[10px] font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(139,41,255,0.4)] transition-all hover:shadow-[0_0_25px_rgba(139,41,255,0.6)] hover:-translate-y-0.5"
            >
              Manage agents <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              to="/training"
              className="flex h-10 items-center justify-center rounded-md border border-white/10 bg-[#0a0f1b]/60 font-tech text-[10px] font-bold uppercase tracking-wider text-purple-400 backdrop-blur-sm transition-all hover:border-[#c78aff]/40 hover:bg-[#111626]/80 hover:text-[#e4b5ff] hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(154,53,255,0.15)]"
            >
              Train agent
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
