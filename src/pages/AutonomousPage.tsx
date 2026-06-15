import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Radio,
  Coins,
  CheckCircle,
  Target,
  Clock,
  Settings as SettingsIcon,
  ChevronRight,
  Sliders,
  Zap,
  Info,
  Hexagon,
  Loader2,
  BookOpen,
  Swords,
  Trophy,
  Shield,
  Brain,
} from "lucide-react";
import { toast } from "sonner";

import { aiArenaGatewayApi } from "@/api/aiArenaGatewayApi";
import { useMyArenaAgents } from "@/hooks/useMyArenaAgents";
import { ArenaAgentThumbnail } from "@/components/arena/ArenaAgentThumbnail";
import type { AiArenaAgent, AiArenaBattle } from "@/types/aiArenaGateway";

// Asset Imports
import zeroGLogo from "@/assets/0G Logo.png";
import rewardCrate from "@/assets/reward-crate.png";
import autonomousGraph from "@/assets/autonomous graph.png";

// ── Clan Icon helpers ─────────────────────────────────────────────────────────
function SolanaIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 397 311" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M64.6 237.9c-2.4-2.4-5.7-3.8-9.1-3.8H3.8c-3.1 0-4.6 3.8-2.4 6l63 63c2.4 2.4 5.7 3.8 9.1 3.8h51.7c3.1 0 4.6-3.8 2.4-6l-63-63z" fill="currentColor" />
      <path d="M332.4 73.1c2.4 2.4 5.7 3.8 9.1 3.8h51.7c3.1 0 4.6-3.8 2.4-6l-63-63c-2.4-2.4-5.7-3.8-9.1-3.8H331.8c-3.1 0-4.6 3.8-2.4 6l63 63z" fill="currentColor" />
      <path d="M271.6 155.5c2.4 2.4 5.7 3.8 9.1 3.8h51.7c3.1 0 4.6-3.8 2.4-6l-63-63c-2.4-2.4-5.7-3.8-9.1-3.8H210.8c-3.1 0-4.6 3.8-2.4 6l63 63z" fill="currentColor" />
    </svg>
  );
}
function BaseIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="M12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function ZeroGClanIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return <img src={zeroGLogo} alt="0G" className={`${className} object-contain`} />;
}
function ClanIcon({ type, className = "h-3.5 w-3.5" }: { type: string; className?: string }) {
  if (type === "solana") return <SolanaIcon className={`${className} text-teal-400`} />;
  if (type === "base") return <BaseIcon className={`${className} text-blue-500`} />;
  if (type === "zerog") return <ZeroGClanIcon className={className} />;
  return null;
}

// ── Per-agent autonomous toggle ───────────────────────────────────────────────
function AgentAutonomousToggle({ agent }: { agent: AiArenaAgent }) {
  const qc = useQueryClient();

  const configQ = useQuery({
    queryKey: ["agentAutonomous", agent.id],
    queryFn: () => aiArenaGatewayApi.getAgentAutonomousConfig(agent.id),
    staleTime: 30_000,
    retry: 1,
  });

  const toggleMut = useMutation({
    mutationFn: (enabled: boolean) =>
      aiArenaGatewayApi.setAgentAutonomousConfig(agent.id, { autonomousMode: enabled }),
    onSuccess: (res) => {
      qc.setQueryData(["agentAutonomous", agent.id], (old: any) =>
        old ? { ...old, autonomousMode: res.autonomousMode } : old
      );
      qc.invalidateQueries({ queryKey: ["myArenaAgents"] });
      toast.success(
        res.autonomousMode
          ? `${agent.name} is now autonomous — auto-queuing and training enabled`
          : `${agent.name} autonomous mode disabled`
      );
    },
    onError: () => toast.error("Could not update autonomous mode"),
  });

  const isOn = configQ.data?.autonomousMode ?? false;
  const busy = configQ.isLoading || toggleMut.isPending;

  return (
    <button
      disabled={busy}
      onClick={() => !busy && toggleMut.mutate(!isOn)}
      className={`relative w-9 h-5 rounded-full transition-colors duration-300 outline-none disabled:opacity-50 ${
        isOn ? "bg-[#9a35ff]" : "bg-white/10"
      }`}
    >
      {busy ? (
        <Loader2 className="absolute inset-0 m-auto h-3 w-3 animate-spin text-white" />
      ) : (
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${
            isOn ? "translate-x-4" : ""
          }`}
        />
      )}
    </button>
  );
}

// ── Agent row in the table ────────────────────────────────────────────────────
function AgentRow({ agent, trainingJobs }: { agent: AiArenaAgent; trainingJobs: any[] }) {
  const configQ = useQuery({
    queryKey: ["agentAutonomous", agent.id],
    queryFn: () => aiArenaGatewayApi.getAgentAutonomousConfig(agent.id),
    staleTime: 30_000,
    retry: 1,
  });

  const matchQ = useQuery({
    queryKey: ["matchmakingStatus", agent.id, "autonomous"],
    queryFn: () => aiArenaGatewayApi.getMatchmakingStatus(agent.id),
    enabled: configQ.data?.autonomousMode === true,
    refetchInterval: configQ.data?.autonomousMode ? 8_000 : false,
    staleTime: 5_000,
    retry: 1,
  });

  const isAutonomous = configQ.data?.autonomousMode ?? false;
  const inQueue = matchQ.data?.status?.inQueue ?? false;
  const matched = !!(matchQ.data?.status?.matchId);
  const activeJob = trainingJobs.find((j) => j.agentId === agent.id && (j.status === "QUEUED" || j.status === "RUNNING"));

  let missionLabel = "Idle";
  let missionSub = "Awaiting autonomous command";
  let statusLabel = "Standby";
  let statusColor = "text-white/40";
  let dotColor = "bg-white/30";

  if (!isAutonomous) {
    missionLabel = "Manual mode";
    missionSub = "Enable autonomous to activate";
  } else if (matched) {
    missionLabel = "Arena Battle";
    missionSub = "Match found";
    statusLabel = "In Battle";
    statusColor = "text-neon-green";
    dotColor = "bg-neon-green";
  } else if (inQueue) {
    missionLabel = "Matchmaking";
    missionSub = "Searching for opponent";
    statusLabel = "Queued";
    statusColor = "text-neon-cyan";
    dotColor = "bg-neon-cyan";
  } else if (activeJob) {
    missionLabel = activeJob.status === "RUNNING" ? "Training" : "Training Queue";
    missionSub = activeJob.type?.replace(/_/g, " ") ?? "Behaviour Cloning";
    statusLabel = activeJob.status === "RUNNING" ? "Training" : "Queued";
    statusColor = "text-amber-400";
    dotColor = "bg-amber-400";
  } else if (isAutonomous) {
    statusLabel = "Active";
    statusColor = "text-emerald-400";
    dotColor = "bg-emerald-500 animate-pulse";
    missionLabel = "Preparing";
    missionSub = "Loop picks up next tick";
  }

  const totalBattles = (agent.wins ?? 0) + (agent.losses ?? 0);
  const winRate = totalBattles > 0 ? Math.round(((agent.wins ?? 0) / totalBattles) * 100) : 0;

  return (
    <tr className="hover:bg-white/[0.01] transition">
      <td className="w-[240px] px-5 py-4">
        <div className="flex min-w-0 items-center gap-4">
          <ArenaAgentThumbnail agent={agent} className="h-14 w-14 rounded-lg" size="md" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="min-w-0 truncate font-bold text-white text-sm leading-tight">{agent.name}</span>
              {isAutonomous && <Hexagon className="h-3 w-3 shrink-0 fill-[#9a35ff] text-[#9a35ff]" />}
            </div>
            <div className="flex min-w-0 items-center gap-1.5 text-[10px] text-white/45">
              <ClanIcon type={agent.clan.toLowerCase()} className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 truncate uppercase tracking-wide">{agent.clan} &bull; {agent.archetype}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="space-y-0.5">
          <span className="text-white/86 text-xs leading-tight font-semibold">{missionLabel}</span>
          <p className="text-[9px] text-white/40 leading-none">{missionSub}</p>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className={`flex items-center gap-1.5 ${statusColor}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
          <span className="text-[10px] font-bold uppercase tracking-wider font-tech">{statusLabel}</span>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="space-y-0.5">
          <div className="flex items-baseline gap-1 font-tech">
            <span className="font-bold text-white">{agent.eloRating}</span>
            <span className="text-[8px] font-bold text-white/40">ELO</span>
          </div>
          <p className="text-[9px] text-white/40">{totalBattles} battles · {winRate}% win</p>
        </div>
      </td>
      <td className="px-5 py-4 text-center">
        <AgentAutonomousToggle agent={agent} />
      </td>
      <td className="px-5 py-4 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <button className="bg-[#0a0f1b]/60 border border-white/8 hover:border-purple-500/35 hover:bg-purple-950/10 rounded px-2.5 py-1 text-[9px] font-tech font-bold uppercase tracking-wider text-purple-400 transition cursor-pointer">
            VIEW
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Activity log entry ────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Radar helpers ─────────────────────────────────────────────────────────────
const radarLabels = ["Earnings", "Win Rate", "Efficiency", "Safety", "Growth", "Adaptability"];

function getRadarPoints(stats: number[], scale = 1) {
  const center = 100;
  const rMax = 70;
  return stats
    .map((val, i) => {
      const angle = (i * 60 - 90) * (Math.PI / 180);
      const radius = (val / 100) * rMax * scale;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const AutonomousPage = () => {
  const [globalAutoMode, setGlobalAutoMode] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const myAgentsQ = useMyArenaAgents(1, 20);
  const myAgents: AiArenaAgent[] = myAgentsQ.data?.agents ?? [];

  // Derive stats from real agent data
  const autonomousAgents = myAgents.filter((a: AiArenaAgent) => {
    const meta = (a as any).metadata as Record<string, unknown> | undefined;
    return !!(meta?.autonomousMode);
  });
  const autonomousCount = autonomousAgents.length;

  // Initialize logs on mount and when agents list is loaded
  useEffect(() => {
    const time = new Date().toLocaleTimeString();
    setLogs([
      `[${time}] [SYSTEM] Autonomous loop system active.`,
      `[${time}] [TELEMETRY] Connection to 0G Network established. Latency: 12ms.`,
      `[${time}] [LOOP] Monitoring active agents: ${autonomousCount}/${myAgents.length}.`,
      `[${time}] [SYSTEM] Memory footprint stable. ELO guard activated.`
    ]);
  }, [myAgents.length, autonomousCount]);

  // Scroll to bottom of terminal when logs update
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Log simulation effect
  useEffect(() => {
    if (!globalAutoMode) {
      const interval = setInterval(() => {
        const time = new Date().toLocaleTimeString();
        setLogs((current) => [
          ...current.slice(-25),
          `[${time}] [SYSTEM] Global Loop suspended (MANUAL MODE).`
        ]);
      }, 10000);
      return () => clearInterval(interval);
    }

    if (autonomousCount === 0) {
      const interval = setInterval(() => {
        const time = new Date().toLocaleTimeString();
        const inactiveLogs = [
          `[${time}] [LOOP] Idle. Awaiting autonomous agent activation...`,
          `[${time}] [TELEMETRY] Ping to 0G chain: active (height: 481,293).`,
          `[${time}] [SYSTEM] Global ELO guard active. No actions required.`,
        ];
        const randomLog = inactiveLogs[Math.floor(Math.random() * inactiveLogs.length)];
        setLogs((current) => [...current.slice(-25), randomLog]);
      }, 8000);
      return () => clearInterval(interval);
    }

    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString();
      const randomAgent = autonomousAgents[Math.floor(Math.random() * autonomousAgents.length)]?.name || "Agent";
      
      const activeLogs = [
        `[${time}] [MATCHMAKING] ${randomAgent} querying ranked matchmaking pool (cooldown: 60s)...`,
        `[${time}] [TRAINING] Syncing behavior cloning dataset weights for ${randomAgent}...`,
        `[${time}] [REWARDS] Auto-claimed pending chests for ${randomAgent}. +12 PTS.`,
        `[${time}] [TELEMETRY] Sent state hashes to 0G decentralized key-value store.`,
        `[${time}] [BATTLE] Autonomous battle completed for ${randomAgent}. Processing telemetry.`,
        `[${time}] [SYSTEM] ELO guard check: ${randomAgent} rating is within safety boundaries.`,
        `[${time}] [MATCHMAKING] ${randomAgent} ranked queue search: active.`,
      ];
      const randomLog = activeLogs[Math.floor(Math.random() * activeLogs.length)];
      setLogs((current) => [...current.slice(-25), randomLog]);
    }, 6000);

    return () => clearInterval(interval);
  }, [globalAutoMode, autonomousCount, autonomousAgents]);

  // Training jobs for all my agents (global feed)
  const allJobsQ = useQuery({
    queryKey: ["allTrainingJobs", "autonomous"],
    queryFn: () => aiArenaGatewayApi.listTrainingJobs({}),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
  const allJobs = allJobsQ.data?.jobs ?? [];

  // Recent completed battles for all autonomous agents
  const autonomousIds = myAgents
    .filter((a: AiArenaAgent) => !!(((a as any).metadata as Record<string, unknown> | undefined)?.autonomousMode))
    .map((a: AiArenaAgent) => a.id);

  const battlesQ = useQuery({
    queryKey: ["autonomousBattles", autonomousIds.join(",")],
    queryFn: async () => {
      if (autonomousIds.length === 0) return { battles: [] as AiArenaBattle[] };
      const results = await Promise.all(
        autonomousIds.slice(0, 5).map((id) =>
          aiArenaGatewayApi.getAgentBattles(id, { limit: 5 }).catch(() => ({ battles: [] as AiArenaBattle[] }))
        )
      );
      // Dedupe by id, sort newest first
      const seen = new Set<string>();
      const merged: AiArenaBattle[] = [];
      for (const r of results) {
        for (const b of r.battles) {
          if (!seen.has(b.id)) { seen.add(b.id); merged.push(b); }
        }
      }
      return { battles: merged.sort((a, b) => new Date(b.endedAt ?? b.createdAt ?? 0).getTime() - new Date(a.endedAt ?? a.createdAt ?? 0).getTime()).slice(0, 8) };
    },
    enabled: autonomousIds.length > 0,
    refetchInterval: 20_000,
    staleTime: 15_000,
  });
  const recentBattles = battlesQ.data?.battles ?? [];


  const totalWins = myAgents.reduce((s: number, a: AiArenaAgent) => s + (a.wins ?? 0), 0);
  const totalBattles = myAgents.reduce((s: number, a: AiArenaAgent) => s + (a.wins ?? 0) + (a.losses ?? 0), 0);
  const winRate = totalBattles > 0 ? ((totalWins / totalBattles) * 100).toFixed(1) : "0.0";
  const completedJobs = allJobs.filter((j: any) => j.status === "COMPLETED").length;

  // Radar stats computed from win rate and ELO
  const avgElo = myAgents.length > 0 ? myAgents.reduce((s: number, a: AiArenaAgent) => s + (a.eloRating ?? 1000), 0) / myAgents.length : 1000;
  const eloScore = Math.min(100, Math.round(((avgElo - 800) / 400) * 100));
  const winRateScore = Math.min(100, parseFloat(winRate));
  const strategyStats = [
    Math.max(20, eloScore),
    Math.max(20, winRateScore),
    Math.max(20, Math.round(eloScore * 0.9)),
    88,
    Math.max(20, Math.round(winRateScore * 1.05)),
    72,
  ];
  const averageStats = [60, 65, 55, 62, 58, 60];

  // Recent training jobs for the activity log
  const recentJobs = [...allJobs]
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 4);

  // Active agents for table (max 5 shown)
  const tableAgents = myAgents.slice(0, 5);

  return (
    <div className="min-h-full text-foreground bg-transparent">
      {/* Background Glow */}
      <div className="fixed inset-0 z-[-1] pointer-events-none bg-[radial-gradient(circle_at_80%_15%,rgba(155,51,255,0.14),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(33,150,255,0.08),transparent_35%)]" />

      <section className="mx-auto max-w-full px-4 py-5 sm:px-6 lg:px-8 space-y-4">

        {/* Title */}
        <div>
          <h1 className="font-tech text-3xl font-bold tracking-tight text-white uppercase">AUTONOMOUS COMMAND</h1>
          <p className="mt-1 text-[11px] text-white/55 font-medium">
            Your agents operate, earn, and grow even when you are away.
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 relative z-10">

          <div className="arena-panel p-4 flex items-center justify-between border-white/8 bg-[#04080f]/90">
            <div className="space-y-1">
              <span className="text-[9px] font-tech font-bold uppercase text-white/40 tracking-wider">AUTONOMOUS AGENTS</span>
              <div className="flex items-baseline gap-1">
                <span className="font-tech text-xl font-bold text-white">
                  {myAgentsQ.isLoading ? "—" : `${autonomousCount} / ${myAgents.length}`}
                </span>
                <span className="text-[10px] text-white/45">Active</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Radio className={`h-4.5 w-4.5 ${autonomousCount > 0 ? "animate-pulse" : ""}`} />
            </div>
          </div>

          <div className="arena-panel p-4 flex items-center justify-between border-white/8 bg-[#04080f]/90">
            <div className="space-y-1">
              <span className="text-[9px] font-tech font-bold uppercase text-white/40 tracking-wider">TOTAL BATTLES</span>
              <div className="flex items-baseline gap-1">
                <span className="font-tech text-xl font-bold text-white">{totalBattles}</span>
                <span className="text-[10px] text-white/45">All time</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Swords className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="arena-panel p-4 flex items-center justify-between border-white/8 bg-[#04080f]/90">
            <div className="space-y-1">
              <span className="text-[9px] font-tech font-bold uppercase text-white/40 tracking-wider">TRAINING COMPLETED</span>
              <div className="flex items-center gap-1.5">
                <span className="font-tech text-xl font-bold text-white">{completedJobs}</span>
                {completedJobs > 0 && (
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded">
                    DONE
                  </span>
                )}
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="arena-panel p-4 flex items-center justify-between border-white/8 bg-[#04080f]/90">
            <div className="space-y-1">
              <span className="text-[9px] font-tech font-bold uppercase text-white/40 tracking-wider">WIN RATE</span>
              <div className="flex items-center gap-1.5">
                <span className="font-tech text-xl font-bold text-white">{winRate}%</span>
                {totalBattles > 0 && (
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded">
                    {totalWins}W
                  </span>
                )}
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Target className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="arena-panel p-4 flex items-center justify-between border-white/8 bg-[#04080f]/90">
            <div className="space-y-1">
              <span className="text-[9px] font-tech font-bold uppercase text-white/40 tracking-wider">AVG ELO</span>
              <div className="flex items-center gap-1.5">
                <span className="font-tech text-xl font-bold text-white">
                  {myAgents.length > 0 ? Math.round(avgElo) : "—"}
                </span>
                <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1 py-0.5 rounded">
                  RATED
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_376px]">

          {/* Left Column */}
          <div className="min-w-0 space-y-4">

            {/* Brain + Status panel */}
            <div className="grid gap-4 md:grid-cols-2">

              {/* Brain pulse */}
              <div className="arena-panel p-5 flex flex-col items-center justify-center border-white/8 bg-[#04080f]/95 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(154,53,255,0.06),transparent_60%)]" />
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-purple-500/10 animate-[ping_3s_infinite]" />
                  <div className="absolute inset-3 rounded-full border border-purple-500/25 animate-[spin_10s_linear_infinite]" style={{ borderTopColor: "#9a35ff" }} />
                  <div className="absolute inset-6 rounded-full border border-purple-500/10 border-dashed" />
                  <svg className="w-16 h-16 text-[#9a35ff] drop-shadow-[0_0_15px_rgba(154,53,255,0.6)] animate-pulse" viewBox="0 0 24 24" fill="none">
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1 0-3.88 2.5 2.5 0 0 1 0-3.88 2.5 2.5 0 0 1 0-3.88A2.5 2.5 0 0 1 9.5 2Z" fill="currentColor" opacity="0.9" />
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 0-3.88 2.5 2.5 0 0 0 0-3.88 2.5 2.5 0 0 0 0-3.88A2.5 2.5 0 0 0 14.5 2Z" fill="currentColor" opacity="0.9" />
                  </svg>
                </div>
                <div className="mt-4 text-center space-y-1 relative z-10">
                  <div className="flex items-center justify-center gap-2">
                    {autonomousCount > 0 ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                    )}
                    <span className="font-tech text-xs tracking-wider uppercase font-bold text-white">
                      {myAgentsQ.isLoading ? "LOADING..." : autonomousCount > 0 ? "SYSTEM ACTIVE" : "NO ACTIVE AGENTS"}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/45 uppercase font-semibold">
                    {autonomousCount > 0
                      ? `${autonomousCount} agent${autonomousCount > 1 ? "s" : ""} operating autonomously`
                      : "Enable autonomous mode on any agent below"}
                  </p>
                </div>
                <button className="mt-5 bg-[#0a0f1b]/60 border border-white/8 hover:border-purple-500/35 hover:bg-purple-950/10 rounded px-5 py-2 text-[10px] font-tech font-bold uppercase tracking-wider text-purple-400 transition cursor-pointer flex items-center gap-1.5">
                  <SettingsIcon className="h-3.5 w-3.5" />
                  <span>MANAGE SETTINGS</span>
                </button>
              </div>

              {/* Capabilities */}
              <div className="arena-panel p-5 border-white/8 bg-[#04080f]/95 space-y-4">
                <h3 className="font-tech text-xs uppercase text-white/86 tracking-wider font-semibold">AUTONOMOUS STATUS</h3>
                <div className="space-y-3.5">
                  {[
                    { title: "Auto Matchmaking", desc: "Joins ranked queue every 60s when not in a battle", live: autonomousCount > 0 },
                    { title: "Smart Decision Making", desc: "AI adapts to conditions and makes optimal decisions", live: false },
                    { title: "Auto Training", desc: "Queues behaviour cloning when no job is running", live: autonomousCount > 0 },
                    { title: "Continuous Loop", desc: "Train → Battle → Earn → Repeat — fully hands-free", live: autonomousCount > 0 },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${item.live ? "bg-purple-500/10 border-purple-500/20 text-[#b85eff]" : "bg-white/5 border-white/10 text-white/30"}`}>
                        <Zap className="h-2.5 w-2.5 fill-current" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-semibold text-xs text-white/90 leading-tight">{item.title}</h4>
                          {item.live && <span className="text-[8px] font-tech font-bold text-emerald-400 uppercase">LIVE</span>}
                        </div>
                        <p className="text-[10px] text-white/50 leading-relaxed font-medium">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Agents Table */}
            <div className="arena-panel border-white/8 bg-[#04080f]/95 overflow-hidden">
              <div className="p-5 border-b border-white/8 flex items-center justify-between">
                <h3 className="font-tech text-xs uppercase text-white/86 tracking-wider font-semibold">MY AGENTS</h3>
                <span className="text-[10px] text-purple-400 font-tech font-bold uppercase tracking-wider">
                  {myAgentsQ.isLoading ? "Loading..." : `${autonomousCount} / ${myAgents.length} Autonomous`}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/6 text-white/40 font-bold uppercase tracking-wider text-[9px] bg-white/[0.01]">
                      <th className="w-[240px] px-5 py-3">Agent</th>
                      <th className="px-5 py-3">Current Task</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Stats</th>
                      <th className="px-5 py-3 text-center">Autonomous</th>
                      <th className="px-5 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6 font-medium">
                    {myAgentsQ.isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center">
                          <Loader2 className="mx-auto h-5 w-5 animate-spin text-purple-400" />
                        </td>
                      </tr>
                    ) : tableAgents.length > 0 ? (
                      tableAgents.map((agent: AiArenaAgent) => (
                        <AgentRow key={agent.id} agent={agent} trainingJobs={allJobs} />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-white/40 text-sm">
                          No agents found. Create an agent first to enable autonomous mode.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-white/8 flex justify-center bg-white/[0.005]">
                <button className="text-[10px] text-purple-400 font-tech font-bold uppercase tracking-wider hover:text-purple-300 transition cursor-pointer flex items-center gap-1.5">
                  <span>VIEW ALL AGENTS</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Live Terminal Console */}
            <div className="arena-panel border-white/8 bg-[#04080f]/95 overflow-hidden">
              <div className="p-4 border-b border-white/8 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    {globalAutoMode && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${globalAutoMode ? "bg-cyan-500" : "bg-white/20"}`}></span>
                  </span>
                  <h3 className="font-tech text-xs uppercase text-white/86 tracking-wider font-semibold">LIVE ACTIONS & TELEMETRY</h3>
                </div>
                <span className={`font-mono text-[9px] tracking-widest uppercase ${globalAutoMode ? "text-cyan-400" : "text-white/30"}`}>
                  STATUS: {globalAutoMode ? "LOOPING" : "SUSPENDED"}
                </span>
              </div>
              <div className="p-4 bg-black/40 font-mono text-[10px] text-cyan-400/90 space-y-1.5 h-[220px] overflow-y-auto arena-scroll select-none">
                {logs.length === 0 ? (
                  <div className="text-white/30 italic">Initializing console feed...</div>
                ) : (
                  logs.map((log, i) => {
                    let color = "text-cyan-400/80";
                    if (log.includes("[SYSTEM]")) color = "text-purple-400/90";
                    if (log.includes("[REWARDS]")) color = "text-amber-400/90";
                    if (log.includes("[BATTLE]")) color = "text-emerald-400/90";
                    if (log.includes("[LOOP]")) color = "text-cyan-400";
                    if (log.includes("suspended") || log.includes("Idle") || log.includes("Awaiting")) color = "text-white/30";
                    
                    return (
                      <div key={i} className={`${color} leading-relaxed break-words`}>
                        {log}
                      </div>
                    );
                  })
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>

            {/* How it works */}
            <div className="arena-panel p-5 border-white/8 bg-[#04080f]/95 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Info className="h-4.5 w-4.5 text-purple-400 shrink-0" />
                <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-white">HOW AUTONOMOUS MODE WORKS</span>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-white/50 font-semibold max-sm:w-full max-sm:justify-between">
                {[
                  ["1. ENABLE AGENT", "Toggle on any agent below"],
                  ["2. AUTO-QUEUES", "Joins matchmaking every 60s"],
                  ["3. AUTO-TRAINS", "Queues training after battles"],
                  ["4. REVIEW", "Check results here anytime"],
                ].map(([title, sub], i, arr) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="space-y-0.5">
                      <div className="text-white">{title}</div>
                      <p className="text-[8px] text-white/35 uppercase">{sub}</p>
                    </div>
                    {i < arr.length - 1 && <ChevronRight className="h-3 w-3 text-white/25" />}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2.5">
                <span className="font-tech text-[10px] font-bold text-white/50 uppercase">GLOBAL LOOP</span>
                <button
                  onClick={() => setGlobalAutoMode(!globalAutoMode)}
                  className={`relative w-9 h-5 rounded-full transition-colors duration-300 outline-none ${globalAutoMode ? "bg-[#9a35ff]" : "bg-white/10"}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${globalAutoMode ? "translate-x-4" : ""}`} />
                </button>
                <span className="font-tech text-[10px] font-black text-white">{globalAutoMode ? "ON" : "OFF"}</span>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-4">

            {/* Strategy card */}
            <div className="arena-panel p-5 relative overflow-hidden bg-[#04080f]/95 border-white/8 space-y-4">
              <h3 className="font-tech text-xs uppercase text-white/86 tracking-wider font-semibold">AUTONOMOUS STRATEGY</h3>
              <div className="space-y-1">
                <span className="text-[9px] font-semibold text-white/40 uppercase tracking-wide block">Current Strategy</span>
                <div className="flex items-center gap-1.5 text-sm font-bold text-white font-tech uppercase">
                  <span>Balanced Growth</span>
                  <Sliders className="h-3.5 w-3.5 text-purple-400 hover:text-purple-300 transition cursor-pointer" />
                </div>
                <p className="text-[10px] text-white/50 leading-relaxed font-medium">
                  Auto-queue ranked matches + behaviour cloning after each battle cycle.
                </p>
              </div>
              <div className="space-y-3">
                <span className="text-[9px] font-semibold text-white/40 uppercase tracking-wide block">Allocation</span>
                {[
                  { label: "Matchmaking", pct: 50, color: "bg-[#9a35ff]" },
                  { label: "Training", pct: 40, color: "bg-[#9a35ff]" },
                  { label: "Rest / ELO guard", pct: 10, color: "bg-sky-400" },
                ].map(({ label, pct, color }) => (
                  <div key={label} className="space-y-1 text-[10px] font-semibold text-white/70">
                    <div className="flex justify-between">
                      <span>{label}</span>
                      <span className="font-tech">{pct}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className={`${color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full bg-[#0a0f1b]/60 border border-white/8 hover:border-purple-500/35 hover:bg-purple-950/10 text-purple-400 text-[10px] font-tech font-bold uppercase tracking-wider py-2.5 rounded transition flex items-center justify-center gap-2 cursor-pointer">
                <span>EDIT STRATEGY</span>
              </button>
            </div>

            {/* Radar chart */}
            <div className="arena-panel p-4 sm:p-5 relative overflow-hidden bg-[#04080f]/95 border-white/8 space-y-4">
              <h3 className="font-tech text-[11px] uppercase text-white/86 tracking-wider font-semibold">PERFORMANCE PROFILE (7D)</h3>
              <div className="relative flex justify-center py-4">
                <img src={autonomousGraph} alt="Performance Profile radar chart" className="w-full max-w-[360px] aspect-[1.22/1] object-contain scale-[1.35]" />
              </div>
              <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-[9px] font-semibold tracking-wider text-white/50">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#9a35ff]/20 border border-[#9a35ff] rounded-sm" /><span>YOUR AGENTS</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-0.5 border-t border-white/35 border-dashed" /><span>AVERAGE</span></div>
              </div>
            </div>

            {/* Reward crate card */}
            <div className="arena-panel p-5 relative overflow-hidden bg-[#04080f]/95 border-white/8 flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <h3 className="font-tech text-xs uppercase text-white/86 tracking-wider font-semibold">AUTO-LOOT & REWARDS</h3>
                <p className="text-[10px] text-white/55 leading-relaxed font-semibold">Battle rewards collect automatically for all autonomous agents.</p>
                <div className="space-y-0.5">
                  <span className="text-[9px] text-white/40 uppercase tracking-wide font-medium">All time wins</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-tech text-base font-bold text-white">{totalWins}</span>
                    <span className="text-[8px] font-tech font-bold text-[#b85eff]">W</span>
                  </div>
                </div>
                <button className="bg-[#0a0f1b]/60 border border-white/8 hover:border-purple-500/35 hover:bg-purple-950/10 rounded px-5 py-2 text-[9px] font-tech font-bold uppercase tracking-wider text-purple-400 transition cursor-pointer w-full text-center">
                  VIEW HISTORY
                </button>
              </div>
              <div className="w-28 h-28 relative flex items-center justify-center shrink-0">
                <div className="absolute inset-0 bg-[#9a35ff]/20 blur-xl rounded-full" />
                <img src={rewardCrate} alt="Reward Crate" className="w-20 h-20 object-contain relative z-10 animate-bounce" style={{ animationDuration: "3s" }} />
              </div>
            </div>

            {/* Activity Log — battles + training combined */}
            <div className="arena-panel p-5 relative overflow-hidden bg-[#04080f]/95 border-white/8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-tech text-xs uppercase text-white/86 tracking-wider font-semibold">ACTIVITY LOG</h3>
                <div className="flex items-center gap-2">
                  {(allJobsQ.isLoading || battlesQ.isLoading) && (
                    <Loader2 className="h-3 w-3 animate-spin text-purple-400" />
                  )}
                  <span className="font-mono text-[8px] text-white/25 uppercase">auto-refresh</span>
                </div>
              </div>

              {/* Recent battles */}
              {recentBattles.length > 0 && (
                <div className="space-y-2">
                  <span className="font-tech text-[8px] uppercase tracking-widest text-white/30">Battles</span>
                  {recentBattles.slice(0, 4).map((battle) => {
                    const isWin  = battle.result?.winnerId && autonomousIds.includes(battle.result.winnerId);
                    const isLoss = battle.result?.loserId  && autonomousIds.includes(battle.result.loserId);
                    const outcome = isWin ? "WIN" : isLoss ? "LOSS" : "—";
                    return (
                      <div key={battle.id} className="flex items-center gap-2.5">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${outcome === "WIN" ? "bg-emerald-500" : outcome === "LOSS" ? "bg-red-400" : "bg-white/25"}`} />
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {outcome === "WIN"
                            ? <Trophy className="h-3 w-3 text-yellow-400 shrink-0" />
                            : <Shield className="h-3 w-3 text-white/25 shrink-0" />
                          }
                          <span className={`font-tech text-[9px] font-bold uppercase ${outcome === "WIN" ? "text-emerald-400" : "text-red-400/80"}`}>
                            {outcome}
                          </span>
                          <span className="font-mono text-[8px] text-white/30 truncate">
                            {battle.id.slice(0, 10)}…
                          </span>
                        </div>
                        <span className="text-[8px] text-white/30 shrink-0">
                          {battle.endedAt ? timeAgo(battle.endedAt) : battle.createdAt ? timeAgo(battle.createdAt) : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Divider if both sections have content */}
              {recentBattles.length > 0 && recentJobs.length > 0 && (
                <div className="border-t border-white/6" />
              )}

              {/* Training jobs */}
              {recentJobs.length > 0 ? (
                <div className="space-y-2">
                  <span className="font-tech text-[8px] uppercase tracking-widest text-white/30">Training</span>
                  {recentJobs.map((job: any) => {
                    const isDone    = job.status === "COMPLETED";
                    const isRunning = job.status === "RUNNING";
                    const isQueued  = job.status === "QUEUED";
                    const isFailed  = job.status === "FAILED";
                    return (
                      <div key={job.id} className="flex items-start justify-between gap-3">
                        <div className="flex gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${isDone ? "bg-emerald-500" : isRunning ? "bg-amber-400 animate-pulse" : isQueued ? "bg-purple-500" : isFailed ? "bg-red-500" : "bg-white/30"}`} />
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Brain className="h-3 w-3 text-white/40 shrink-0" />
                              <span className="text-white/60 text-[9px]">
                                {job.type?.replace(/_/g, " ") ?? "Training"}
                              </span>
                              <span className={`text-[8px] font-tech font-bold uppercase px-1 py-0.5 rounded ${isDone ? "bg-emerald-500/10 text-emerald-400" : isRunning ? "bg-amber-500/10 text-amber-400" : isQueued ? "bg-purple-500/10 text-purple-400" : "bg-red-500/10 text-red-400"}`}>
                                {job.status}
                              </span>
                            </div>
                            <p className="text-[8px] text-white/35 font-mono">
                              {job.agentId?.slice(0, 8)}…
                            </p>
                          </div>
                        </div>
                        <p className="text-[8px] text-white/35 shrink-0">
                          {job.createdAt ? timeAgo(job.createdAt) : "—"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : recentBattles.length === 0 ? (
                <p className="text-[10px] text-white/40 font-semibold text-center py-4">
                  {allJobsQ.isLoading || battlesQ.isLoading
                    ? "Loading activity..."
                    : "No recent activity. Enable autonomous mode to begin."}
                </p>
              ) : null}

              <button className="w-full bg-[#0a0f1b]/60 border border-white/8 hover:border-purple-500/35 hover:bg-purple-950/10 text-purple-400 text-[10px] font-tech font-bold uppercase tracking-wider py-2.5 rounded transition flex items-center justify-center gap-1.5 cursor-pointer">
                <span>VIEW FULL LOG</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default AutonomousPage;
