import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Eye,
  Hexagon,
  Loader2,
  Radio,
  Shield,
  Swords,
  Trophy,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArenaPageLayout } from "@/components/arena/ArenaPageLayout";
import { ArenaAgentThumbnail } from "@/components/arena/ArenaAgentThumbnail";
import { ArenaBattleBoardCard } from "@/components/arena/ArenaBattleBoardCard";
import { ArenaMatchStatusModal } from "@/components/arena/ArenaMatchStatusModal";
import { ArenaStartMatchmakingModal } from "@/components/arena/ArenaStartMatchmakingModal";
import { ArenaBattleBoardGridSkeleton } from "@/components/skeleton/ArenaBattleBoardSkeleton";
import { aiArenaGatewayApi } from "@/api/aiArenaGatewayApi";
import {
  AI_ARENA_DEFAULT_GAME_ID,
  AI_ARENA_GAME_IDS,
  AI_ARENA_MATCH_MODES,
} from "@/constants/aiArenaMatchmaking";
import { useAuth } from "@/contexts/AuthContext";
import { useAiArenaGatewaySession } from "@/hooks/useAiArenaGatewaySession";
import { formatArenaWaitTime, useArenaBattleBoard } from "@/hooks/useArenaBattleBoard";
import { useMyArenaAgents } from "@/hooks/useMyArenaAgents";
import { getTrackedAiArenaBattleId } from "@/lib/arenaBattleStorage";
import agentShadow from "@/assets/agent-shadow.jpg";
import battleStep1 from "@/assets/step1.mp4";
import battleStep2 from "@/assets/step2.mp4";
import battleStep3 from "@/assets/step3.mp4";
import battleStep4 from "@/assets/step4.mp4";
import battleStep5 from "@/assets/step5.mp4";
import heroTrio from "@/assets/hero-trio.png";
import { getRankFromElo } from "@/utils/rankSystem";
import warzoneVideo from "@/assets/IMG_9260.MOV";
import type {
  AiArenaAgent,
  AiArenaAgentMemory,
  AiArenaBattle,
  AiArenaBattleSocketMessage,
  AiArenaMatchmakingStatusBody,
} from "@/types/aiArenaGateway";

export type GameMode = {
  title: string;
  tag: string;
  body: string;
  image?: string;
  video?: string;
  tone: string;
};

const gameModes: GameMode[] = [
  {
    title: "WARZONE WARRIORS",
    tag: "2D SHOOTER",
    body: "Fast-paced 2D arcade shooter. Team up, deploy, and dominate the battlefield.",
    image: heroTrio,
    video: warzoneVideo,
    tone: "from-[#101824]/30 via-[#0b0f16]/55 to-[#070910]/95",
  },
  {
    title: "ROBOWARS",
    tag: "VEHICLE ARENA",
    body: "Build. Upgrade. Destroy. Fight in intense robotic vehicle battles.",
    video: battleStep5,
    tone: "from-[#201007]/30 via-[#100b0c]/55 to-[#070910]/95",
  },
  {
    title: "HIGHWAY HUSTLE",
    tag: "RACING",
    body: "High-speed chases on neon-lit highways. Dodge, boost, and outrun your rivals.",
    video: battleStep3,
    tone: "from-[#071820]/30 via-[#0b1016]/55 to-[#070910]/95",
  },
];

const activeBattles = [
  {
    game: "WARZONE WARRIORS",
    title: "TEAM DEATHMATCH",
    map: "Dusty Outpost",
    left: "Alpha Squad",
    right: "Omega Force",
    leftScore: "18",
    rightScore: "12",
    status: "LIVE",
    time: "08:45",
    image: heroTrio,
    color: "#7b3cff",
  },
  {
    game: "ROBOWARS",
    title: "ARENA BRAWL",
    map: "Steel Pit",
    left: "Iron Titans",
    right: "Cyber Claws",
    leftScore: "3",
    rightScore: "3",
    status: "LIVE",
    time: "09:30",
    video: battleStep1,
    color: "#b037ff",
  },
  {
    game: "WARZONE WARRIORS",
    title: "CAPTURE THE FLAG",
    map: "Jungle Ruins",
    left: "Berserker",
    right: "Assassin",
    leftScore: "2",
    rightScore: "1",
    status: "LIVE",
    time: "06:12",
    image: agentShadow,
    color: "#8bc900",
  },
  {
    game: "ROBOWARS",
    title: "MECH MAYHEM",
    map: "Scrap Yard",
    left: "Dark Bots",
    right: "Hybrid",
    leftScore: "5",
    rightScore: "2",
    status: "STARTING SOON",
    time: "01:20",
    video: battleStep2,
    color: "#ffc000",
  },
  {
    game: "WARZONE WARRIORS",
    title: "DOMINATION",
    map: "Desert Storm",
    left: "Desert Foxes",
    right: "Sand Vipers",
    leftScore: "45",
    rightScore: "30",
    status: "STARTING SOON",
    time: "02:15",
    image: heroTrio,
    color: "#ffc000",
  },
  {
    game: "ROBOWARS",
    title: "CIRCUIT BREAKER",
    map: "Neon Factory",
    left: "Volt Runners",
    right: "Spark Plugs",
    leftScore: "1",
    rightScore: "0",
    status: "LIVE",
    time: "04:45",
    video: battleStep3,
    color: "#00f080",
  },
  {
    game: "WARZONE WARRIORS",
    title: "FREE FOR ALL",
    map: "Neon City",
    left: "Neon Wraiths",
    right: "Cyber Punks",
    leftScore: "10",
    rightScore: "10",
    status: "LIVE",
    time: "12:00",
    image: agentShadow,
    color: "#ff3c7b",
  },
  {
    game: "ROBOWARS",
    title: "SCRAP YARD SCRAMBLE",
    map: "Junkyard",
    left: "Scrap Titans",
    right: "Rust Buckets",
    leftScore: "7",
    rightScore: "6",
    status: "LIVE",
    time: "15:30",
    video: battleStep4,
    color: "#ff5050",
  },
];

type MatchStatusRow = {
  agent: AiArenaAgent;
  status: AiArenaMatchmakingStatusBody | null;
};

function SectionTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`mt-7 font-tech text-sm uppercase tracking-[0.08em] ${className}`}>{children}</h2>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function shortId(value?: string | null) {
  if (!value) return "—";
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function normalizeSocketMessage(raw: string): AiArenaBattleSocketMessage {
  try {
    const data = JSON.parse(raw) as AiArenaBattleSocketMessage;
    if (data && typeof data === "object") return data;
  } catch {
    /* ignore parse failure */
  }
  return { type: "RAW", raw };
}

function fallbackArenaAgent(agentId: string) {
  return {
    id: agentId,
    name: `Agent ${agentId.slice(0, 6)}`,
    clan: "AI Arena",
    archetype: "Unknown",
    eloRating: 0,
    wins: 0,
    losses: 0,
    evolutionStage: "GENESIS",
  } satisfies AiArenaAgent;
}

function battleTone(status?: string | null) {
  switch (status) {
    case "COMPLETED":
      return "text-emerald-400";
    case "IN_PROGRESS":
      return "text-cyan-300";
    case "DISPUTED":
      return "text-amber-300";
    case "CANCELLED":
      return "text-rose-300";
    default:
      return "text-purple-300";
  }
}

function statusLabel(status?: string | null) {
  return status ? status.replace(/_/g, " ") : "Pending";
}

function modeLabel(mode?: string | null) {
  return mode ? mode.replace(/_/g, " ") : "Arena battle";
}

function StatsRail({ myAgents }: { myAgents: AiArenaAgent[] }) {
  const totalBattles = myAgents.reduce((sum, a) => sum + a.wins + a.losses + (a.draws ?? 0), 0);
  const totalWins    = myAgents.reduce((sum, a) => sum + a.wins, 0);
  const winRate      = totalBattles > 0 ? `${((totalWins / totalBattles) * 100).toFixed(1)}%` : "—";

  const stats = [
    { label: "TOTAL BATTLES", value: totalBattles.toLocaleString(), icon: Swords,   color: "#0089ff" },
    { label: "WINS",          value: totalWins.toLocaleString(),    icon: Trophy,    color: "#ffc000" },
    { label: "WIN RATE",      value: winRate,                       icon: Crosshair, color: "#b338ff" },
    { label: "TOTAL REWARDS", value: "—", suffix: "$ARENA",         icon: Hexagon,   color: "#ffc000" },
  ];
  return (
    <div className="arena-panel grid grid-cols-2 divide-x divide-white/8 overflow-hidden md:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-4 p-4">
          <div className="grid h-11 w-11 place-items-center rounded-md bg-white/[0.04]">
            <stat.icon className="h-6 w-6" style={{ color: stat.color }} />
          </div>
          <div>
            <div className="font-tech text-[9px] text-white/48">{stat.label}</div>
            <div className="mt-1 text-2xl font-semibold">
              {stat.value} {stat.suffix && <span className="text-xs text-white/45">{stat.suffix}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RankCard({ firstAgent }: { firstAgent: AiArenaAgent | null }) {
  const rankQ = useQuery({
    queryKey: ["aiArenaGateway", "battlesPageRank", firstAgent?.id],
    queryFn:  () => aiArenaGatewayApi.getLeaderboardRankForAgent(firstAgent!.id, "global"),
    enabled:  !!firstAgent?.id,
    staleTime: 60_000,
    retry: false,
  });

  const elo        = firstAgent?.eloRating ?? 0;
  const leagueInfo = elo > 0 ? getRankFromElo(elo) : null;
  const rank       = rankQ.data?.rank;

  return (
    <div className="arena-panel relative min-h-[94px] overflow-hidden p-4 flex items-center justify-between gap-3">
      <div>
        <div className="font-tech text-[9px] text-white/50">ARENA RANK</div>
        <div className="mt-2 text-xl font-bold">
          {firstAgent ? (rank != null ? `#${rank.toLocaleString()}` : "UNRANKED") : "—"}
        </div>
        {leagueInfo && firstAgent ? (
          <div className="mt-0.5 font-tech text-[9px] uppercase tracking-wider" style={{ color: leagueInfo.color }}>
            {leagueInfo.name}
          </div>
        ) : null}
      </div>
      {leagueInfo && firstAgent ? (
        <img
          src={leagueInfo.image}
          alt={leagueInfo.name}
          title={leagueInfo.name}
          className="h-[90px] w-[90px] object-contain shrink-0"
        />
      ) : null}
    </div>
  );
}

function GameModeCard({ mode }: { mode: GameMode }) {
  return (
    <article className="arena-panel relative h-[260px] overflow-hidden">
      {mode.video ? (
        <video src={mode.video} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover opacity-78" />
      ) : (
        <img src={mode.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-78" />
      )}
      <div className={`absolute inset-0 bg-gradient-to-r ${mode.tone}`} />
      <div className="relative z-10 h-full p-5">
        <div>
          <h3 className="font-tech text-4xl font-black italic tracking-[-0.04em] text-white drop-shadow">
            {mode.title}
          </h3>
          <span className="mt-4 inline-flex rounded border border-[#9f2dff]/70 bg-[#5b1499]/35 px-2 py-1 font-tech text-[9px] text-[#d773ff]">
            {mode.tag}
          </span>
          <p className="mt-2 max-w-[250px] text-xs leading-relaxed text-white/72">{mode.body}</p>
        </div>
      </div>
    </article>
  );
}

function GameCarouselSection() {
  return (
    <section className="mt-7">
      <h2 className="font-tech text-sm uppercase tracking-[0.08em]">CHOOSE YOUR GAME</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {gameModes.map((mode) => (
          <GameModeCard key={mode.title} mode={mode} />
        ))}
      </div>
    </section>
  );
}

function Team({ name, color, right = false }: { name: string; color: string; right?: boolean }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${right ? "justify-end text-right" : ""}`}>
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded" style={{ background: `${color}24`, color }}>
        <Shield className="h-4 w-4" />
      </span>
      <span className="truncate text-white/70">{name}</span>
    </div>
  );
}

function BattleCard({ battle }: { battle: (typeof activeBattles)[number] }) {
  return (
    <article className="arena-panel flex h-full flex-col overflow-hidden">
      <div className="relative h-[118px] shrink-0">
        {battle.video ? (
          <video src={battle.video} autoPlay loop muted playsInline className="h-full w-full object-cover opacity-75" />
        ) : (
          <img src={battle.image} alt="" className="h-full w-full object-cover opacity-75" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050913] via-black/25 to-transparent" />
        <span className="absolute left-3 top-3 rounded border border-[#a231ff] bg-[#5b1499]/60 px-2 py-1 font-tech text-[9px] text-[#d773ff]">
          {battle.game}
        </span>
      </div>
      <div className="p-3">
        <h3 className="font-tech text-sm">{battle.title}</h3>
        <p className="mt-1 text-xs text-white/70">{battle.map}</p>
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
          <Team color={battle.color} name={battle.left} />
          <span className="text-white/56">VS</span>
          <Team color="#79d814" name={battle.right} right />
        </div>
        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center text-2xl font-semibold">
          <span>{battle.leftScore}</span>
          <span className="font-tech text-sm text-[#ffb44c]">VS</span>
          <span className="text-right">{battle.rightScore}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px]">
          <span className={battle.status === "LIVE" ? "text-red-500" : "text-[#ffc000]"}>● {battle.status}</span>
          <span className="text-white/72">{battle.time}</span>
        </div>
        <div className="mt-auto pt-3">
          <button type="button" className="h-9 w-full rounded border border-[#9b32ff]/70 bg-[#230b35]/75 font-tech text-[10px]">
            {battle.status === "LIVE" ? "WATCH NOW" : "JOIN BATTLE"}
          </button>
        </div>
      </div>
    </article>
  );
}

function Rewards() {
  const rewards = [
    ["WIN REWARD", "100 $ARENA", "#b338ff"],
    ["KILL BONUS", "25 $ARENA", "#0089ff"],
    ["VICTORY STREAK", "50 $ARENA", "#ffc000"],
    ["TOP PERFORMER", "75 $ARENA", "#00f080"],
  ] as const;
  return (
    <aside className="arena-panel h-fit p-4">
      <div className="space-y-4">
        {rewards.map(([label, value, color]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-3 text-white/72">
              <span className="grid h-8 w-8 place-items-center rounded" style={{ background: `${color}1f`, color }}>
                <Hexagon className="h-5 w-5" />
              </span>
              {label}
            </span>
            <span className="font-semibold text-[#00f080]">{value}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-7 flex h-10 w-full items-center justify-center gap-3 rounded border border-[#9b32ff]/70 bg-[#230b35]/65 font-tech text-[10px]"
      >
        VIEW ALL REWARDS <ArrowUpRight className="h-4 w-4" />
      </button>
    </aside>
  );
}

function MyBattlesCarouselSection({
  agents,
  loading,
}: {
  agents: AiArenaAgent[];
  loading: boolean;
}) {
  type OwnedBattleMemory = AiArenaAgentMemory & { ownerAgentId: string };
  const memoriesQ = useQuery({
    queryKey: ["aiArenaGateway", "battlesPageBattleMemories", agents.map((a) => a.id).join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        agents.map((agent) => aiArenaGatewayApi.getAgentMemories(agent.id, 1, 100))
      );
      const uniqueMemories = new Map<string, OwnedBattleMemory>();
      results.forEach((result, index) => {
        const ownerAgentId = agents[index]?.id;
        if (!ownerAgentId) return;
        result.memories.forEach((memory) => {
          const key = memory.metadata?.battleId ?? memory.id;
          if (!uniqueMemories.has(key)) uniqueMemories.set(key, { ...memory, ownerAgentId });
        });
      });
      return Array.from(uniqueMemories.values()).sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
    },
    enabled: agents.length > 0,
    staleTime: 30_000,
  });
  const memories = memoriesQ.data ?? [];

  const battleIds = useMemo(
    () => memories.map((m) => m.metadata?.battleId).filter((id): id is string => Boolean(id)),
    [memories]
  );
  const battleDetailsQ = useQuery({
    queryKey: ["aiArenaGateway", "battlesPageMemoryBattles", battleIds.join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        battleIds.map(async (battleId) => {
          try {
            return (await aiArenaGatewayApi.getBattle(battleId)).battle;
          } catch {
            return null;
          }
        })
      );
      return results.filter((battle): battle is AiArenaBattle => Boolean(battle));
    },
    enabled: battleIds.length > 0,
    staleTime: 60_000,
  });
  const battlesById = useMemo(
    () => new Map((battleDetailsQ.data ?? []).map((battle) => [battle.id, battle])),
    [battleDetailsQ.data]
  );
  const participantIds = useMemo(
    () => Array.from(new Set((battleDetailsQ.data ?? []).flatMap((battle) => battle.agentIds ?? []))),
    [battleDetailsQ.data]
  );
  const participantAgentsQ = useQuery({
    queryKey: ["aiArenaGateway", "battlesPageMemoryParticipants", participantIds.join(",")],
    queryFn: async () =>
      Promise.all(
        participantIds.map(async (agentId) => {
          const ownedAgent = agents.find((a) => a.id === agentId);
          if (ownedAgent) return ownedAgent;
          try {
            return await aiArenaGatewayApi.getAgentById(agentId);
          } catch {
            return fallbackArenaAgent(agentId);
          }
        })
      ),
    enabled: participantIds.length > 0,
    staleTime: 60_000,
  });
  const agentsById = useMemo(
    () => new Map([...agents, ...(participantAgentsQ.data ?? [])].map((a) => [a.id, a])),
    [agents, participantAgentsQ.data]
  );

  const CARDS_PER_PAGE = 3;
  const [battlePage, setBattlePage] = useState(0);
  const totalBattlePages = Math.max(1, Math.ceil(memories.length / CARDS_PER_PAGE));
  const canPrevBattle = battlePage > 0;
  const canNextBattle = battlePage < totalBattlePages - 1;

  return (
    <section className="mt-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-tech text-sm uppercase tracking-[0.08em]">MY BATTLES</h2>
          <p className="mt-1 text-[10px] text-white/45">Your completed arena battle history.</p>
        </div>
        {memories.length > CARDS_PER_PAGE && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBattlePage((p) => Math.max(0, p - 1))}
              disabled={!canPrevBattle}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-white transition hover:border-primary/60 hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[3ch] text-center font-tech text-[10px] text-white/45">
              {battlePage + 1}/{totalBattlePages}
            </span>
            <button
              type="button"
              onClick={() => setBattlePage((p) => Math.min(totalBattlePages - 1, p + 1))}
              disabled={!canNextBattle}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-white transition hover:border-primary/60 hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {loading || memoriesQ.isLoading ? (
        <div className="arena-panel flex items-center gap-2 px-5 py-8 text-sm text-white/55">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your battles...
        </div>
      ) : memoriesQ.isError || memories.length === 0 ? (
        <div className="arena-panel px-5 py-8 text-center">
          <Swords className="mx-auto h-7 w-7 text-white/20" />
          <p className="mt-3 text-sm text-white/55">No completed or cancelled battles yet. Start matchmaking to enter the arena.</p>
        </div>
      ) : (
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${battlePage * 100}%)` }}
          >
            {Array.from({ length: totalBattlePages }, (_, pageIdx) => (
              <div
                key={pageIdx}
                className="grid w-full flex-shrink-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
              >
                {memories
                  .slice(pageIdx * CARDS_PER_PAGE, pageIdx * CARDS_PER_PAGE + CARDS_PER_PAGE)
                  .map((memory) => {
                    const battleId = memory.metadata?.battleId;
                    const battle = battleId ? battlesById.get(battleId) : undefined;
                    const participants = (battle?.agentIds ?? [memory.ownerAgentId])
                      .map((agentId) => agentsById.get(agentId))
                      .filter((agent): agent is AiArenaAgent => Boolean(agent));
                    const outcome = String(memory.metadata?.outcome ?? memory.type).toUpperCase();
                    const isWin = outcome === "WIN";
                    const isCancelled = outcome === "CANCELLED";

                    return (
                      <div key={memory.id} className="card-glass rounded-xl border border-primary/20 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <span className={`rounded-full border px-2.5 py-1 font-tech text-[9px] uppercase ${
                            isCancelled
                              ? "border-white/20 bg-white/5 text-white/55"
                              : isWin
                              ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-300"
                              : "border-rose-400/35 bg-rose-500/10 text-rose-300"
                          }`}>
                            {isCancelled ? "Cancelled" : isWin ? "Win" : "Loss"}
                          </span>
                          <span className="font-tech text-[9px] uppercase text-accent">Battle Memory</span>
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                          {participants.map((agent, index) => (
                            <div key={agent.id} className="flex items-center gap-3">
                              {index > 0 ? <span className="font-display text-sm font-bold text-primary">VS</span> : null}
                              <div className="text-center">
                                <ArenaAgentThumbnail
                                  agent={agent}
                                  size="md"
                                  className="h-20 w-20 rounded-xl border-2 border-primary/25"
                                />
                                <p className="mt-1 max-w-20 truncate font-tech text-[8px] text-white/55">{agent.name}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="mt-4 font-mono text-[11px] italic leading-relaxed text-white/65">{memory.content}</p>
                        <p className="mt-2 font-mono text-[10px] text-white/40">
                          {new Date(memory.createdAt).toLocaleString()}
                        </p>
                        {battleId ? (
                          <Link
                            to={`/arena/game/${battleId}`}
                            className="mt-4 inline-flex items-center gap-2 font-tech text-[9px] font-bold uppercase text-primary hover:text-white"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Open Battle {shortId(battleId)}
                          </Link>
                        ) : null}
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
          {totalBattlePages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-2">
              {Array.from({ length: totalBattlePages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setBattlePage(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === battlePage
                      ? "w-6 bg-primary"
                      : "w-1.5 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function performerWinRate(agent: AiArenaAgent) {
  const totalBattles = agent.wins + agent.losses + (agent.draws ?? 0);
  if (totalBattles <= 0) return "—";
  return `${((agent.wins / totalBattles) * 100).toFixed(1)}%`;
}

function performerBattleCount(agent: AiArenaAgent) {
  return (agent.wins + agent.losses + (agent.draws ?? 0)).toLocaleString();
}

function PerformerCard({ agent }: { agent: AiArenaAgent }) {
  return (
    <article className="arena-panel flex items-center gap-3 p-3">
      <ArenaAgentThumbnail agent={agent} className="h-[86px] w-[70px] rounded object-cover object-top" size="md" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-tech text-xs">{agent.name}</h3>
        <p className="mt-1 text-[11px] text-white/55">
          {agent.clan} · {agent.archetype}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-[10px] text-white/45">Win Rate</div>
            <div className="text-lg font-semibold">{performerWinRate(agent)}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/45">Battles</div>
            <div className="text-lg font-semibold">{performerBattleCount(agent)}</div>
          </div>
        </div>
      </div>
    </article>
  );
}

function QueueStatusCard({
  row,
  onView,
  onLeave,
  leaving,
}: {
  row: MatchStatusRow;
  onView: (agentId: string) => void;
  onLeave: (agentId: string) => void;
  leaving: boolean;
}) {
  const waitLabel = formatArenaWaitTime(row.status?.waitTimeMs ?? row.status?.estimatedWaitMs);

  return (
    <div className="rounded-xl border border-white/8 bg-black/20 p-3">
      <div className="flex items-center gap-3">
        <ArenaAgentThumbnail agent={row.agent} className="h-14 w-14 rounded-xl" size="md" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-tech text-xs text-white">{row.agent.name}</div>
          <div className="mt-1 text-[10px] text-white/45">
            {row.agent.archetype} · {row.agent.clan} · ELO {row.agent.eloRating}
          </div>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[10px] text-cyan-200">
            <Radio className="h-3 w-3" /> Waiting {waitLabel}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onView(row.agent.id)}
          className="rounded border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 font-tech text-[9px] uppercase tracking-[0.16em] text-cyan-200 transition hover:border-cyan-400/55"
        >
          Open status
        </button>
        <button
          type="button"
          onClick={() => onLeave(row.agent.id)}
          disabled={leaving}
          className="rounded border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 font-tech text-[9px] uppercase tracking-[0.16em] text-rose-200 transition hover:border-rose-400/55 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {leaving ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" /> : "Leave queue"}
        </button>
      </div>
    </div>
  );
}

function BattleParticipant({
  agent,
  align = "left",
}: {
  agent: AiArenaAgent;
  align?: "left" | "right";
}) {
  const isRight = align === "right";
  return (
    <div className={`flex min-w-0 items-center gap-3 ${isRight ? "justify-end text-right" : ""}`}>
      {isRight ? null : <ArenaAgentThumbnail agent={agent} className="h-16 w-16 rounded-xl" size="md" />}
      <div className="min-w-0">
        <div className="truncate font-tech text-sm text-white">{agent.name}</div>
        <div className="truncate text-[10px] text-white/45">
          {agent.archetype} · {agent.clan}
        </div>
        <div className="mt-1 text-xs text-cyan-200">ELO {agent.eloRating}</div>
      </div>
      {isRight ? <ArenaAgentThumbnail agent={agent} className="h-16 w-16 rounded-xl" size="md" /> : null}
    </div>
  );
}

function BattleDetailPanel({
  battle,
  participants,
  disputeReason,
  setDisputeReason,
  disputing,
  onDispute,
  wsStatus,
  wsMessages,
}: {
  battle: AiArenaBattle;
  participants: AiArenaAgent[];
  disputeReason: string;
  setDisputeReason: (value: string) => void;
  disputing: boolean;
  onDispute: () => void;
  wsStatus: "idle" | "connecting" | "open" | "closed" | "error";
  wsMessages: Array<{ id: string; text: string; ts: string }>;
}) {
  const left = participants[0] ?? fallbackArenaAgent(battle.agentIds?.[0] ?? "left");
  const right = participants[1] ?? fallbackArenaAgent(battle.agentIds?.[1] ?? "right");

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-tech text-[10px] uppercase tracking-[0.18em] text-white/38">Tracked battle</div>
            <h3 className="mt-1 text-lg font-bold text-white">{shortId(battle.id)}</h3>
          </div>
          <div className={`font-tech text-[10px] uppercase tracking-[0.18em] ${battleTone(battle.status)}`}>
            {statusLabel(battle.status)}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-xl border border-white/8 bg-[#04080f]/80 p-4">
          <BattleParticipant agent={left} />
          <span className="font-tech text-2xl text-white/40">VS</span>
          <BattleParticipant agent={right} align="right" />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <MetaStat label="Mode" value={modeLabel(battle.mode)} />
          <MetaStat label="Game" value={battle.gameId ?? AI_ARENA_DEFAULT_GAME_ID} />
          <MetaStat label="Created" value={formatDateTime(battle.createdAt)} />
          <MetaStat label="Ended" value={formatDateTime(battle.endedAt ?? battle.startedAt)} />
        </div>

        {battle.result?.winnerId ? (
          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100/90">
            Winner {shortId(battle.result.winnerId)} · Rounds {battle.result.rounds}
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="font-tech text-[10px] uppercase tracking-[0.18em] text-white/38">Live battle socket</div>
            <div
              className={`font-tech text-[10px] uppercase tracking-[0.16em] ${
                wsStatus === "open"
                  ? "text-emerald-300"
                  : wsStatus === "connecting"
                    ? "text-cyan-300"
                    : wsStatus === "error"
                      ? "text-rose-300"
                      : "text-white/45"
              }`}
            >
              {wsStatus}
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {wsMessages.length > 0 ? (
              wsMessages.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-white/8 bg-[#03070d]/70 px-3 py-2 text-[11px] text-white/65">
                  <div className="font-tech text-[9px] uppercase tracking-[0.14em] text-white/35">{entry.ts}</div>
                  <div className="mt-1 break-words font-mono text-[10px] text-cyan-100/80">{entry.text}</div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-white/8 bg-[#03070d]/60 px-3 py-4 text-[11px] text-white/45">
                Waiting for live battle updates.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
          <div className="font-tech text-[10px] uppercase tracking-[0.18em] text-white/38">Dispute result</div>
          <textarea
            value={disputeReason}
            onChange={(event) => setDisputeReason(event.target.value)}
            placeholder="Describe what went wrong in this battle."
            className="arena-input mt-3 min-h-[100px] resize-y"
          />
          <button
            type="button"
            onClick={onDispute}
            disabled={disputing || !disputeReason.trim()}
            className="mt-3 inline-flex items-center gap-2 rounded border border-amber-500/30 bg-amber-500/10 px-4 py-2 font-tech text-[10px] uppercase tracking-[0.16em] text-amber-200 transition hover:border-amber-400/55 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {disputing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5" />}
            Submit dispute
          </button>
        </div>
      </div>
    </div>
  );
}

function MetaStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="font-tech text-[9px] uppercase tracking-[0.16em] text-white/35">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function BattleInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="space-y-2">
      <span className="font-tech text-[9px] uppercase tracking-[0.16em] text-white/35">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="arena-input" />
    </label>
  );
}

const BattlesPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const { isAiArenaReady } = useAiArenaGatewaySession();
  const myAgentsQ = useMyArenaAgents(1, 50);
  const myAgents = myAgentsQ.data?.agents ?? [];
  const myAgentIds = useMemo(() => new Set(myAgents.map((agent) => agent.id)), [myAgents]);
  const trackedBattleId = getTrackedAiArenaBattleId();

  const [startModalOpen, setStartModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusAgentId, setStatusAgentId] = useState<string | null>(null);
  const [challengeAgentId, setChallengeAgentId] = useState<string | null>(null);
  const [manualBattleAgentId, setManualBattleAgentId] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState<(typeof AI_ARENA_MATCH_MODES)[number]["value"]>("RANKED");
  const [manualGameId, setManualGameId] = useState(AI_ARENA_DEFAULT_GAME_ID);
  const [manualWagerAmount, setManualWagerAmount] = useState("");
  const [manualOpponentId, setManualOpponentId] = useState("");
  const [battleLookupInput, setBattleLookupInput] = useState("");
  const [selectedBattleId, setSelectedBattleId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [joiningLobbyId, setJoiningLobbyId] = useState<string | null>(null);
  const [leavingAgentId, setLeavingAgentId] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<"idle" | "connecting" | "open" | "closed" | "error">("idle");
  const [wsMessages, setWsMessages] = useState<Array<{ id: string; text: string; ts: string }>>([]);

  const myStatusesQ = useQuery({
    queryKey: ["aiArenaGateway", "battlePageStatuses", myAgents.map((agent) => agent.id).join(",")],
    queryFn: async () => {
      const rows = await Promise.all(
        myAgents.map(async (agent) => {
          try {
            const result = await aiArenaGatewayApi.getMatchmakingStatus(agent.id);
            return { agent, status: result.status } satisfies MatchStatusRow;
          } catch {
            return { agent, status: null } satisfies MatchStatusRow;
          }
        })
      );
      return rows;
    },
    enabled: isAuthenticated && isAiArenaReady && myAgents.length > 0,
    staleTime: 2_000,
    refetchInterval: 2_000,
    retry: 1,
  });

  const myBattlesQ = useQuery({
    queryKey: ["aiArenaGateway", "battlesPageHistory", myAgents.map((agent) => agent.id).join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        myAgents.flatMap((agent) =>
          ["COMPLETED", "CANCELLED"].map((status) =>
            aiArenaGatewayApi.getAgentBattles(agent.id, { status, limit: 100 })
          )
        )
      );
      const uniqueBattles = new Map<string, AiArenaBattle>();
      results.forEach((result) => {
        result.battles.forEach((battle) => uniqueBattles.set(battle.id, battle));
      });
      return Array.from(uniqueBattles.values()).sort((left, right) => {
        const leftTime = new Date(left.endedAt ?? left.startedAt ?? left.createdAt ?? 0).getTime();
        const rightTime = new Date(right.endedAt ?? right.startedAt ?? right.createdAt ?? 0).getTime();
        return rightTime - leftTime;
      });
    },
    enabled: isAuthenticated && isAiArenaReady && myAgents.length > 0,
    staleTime: 30_000,
  });

  const battleBoardQ = useArenaBattleBoard({ maxRankedPairs: 8 });

  const myQueueRows = useMemo(
    () => (myStatusesQ.data ?? []).filter((row) => Boolean(row.status?.inQueue)),
    [myStatusesQ.data]
  );
  const topPerformerAgents = useMemo(
    () =>
      [...myAgents]
        .sort((left, right) => {
          if (right.wins !== left.wins) return right.wins - left.wins;
          return right.eloRating - left.eloRating;
        })
        .slice(0, 5),
    [myAgents]
  );
  const queuedAgentIds = useMemo(() => new Set(myQueueRows.map((row) => row.agent.id)), [myQueueRows]);
  const availableBattleAgents = useMemo(
    () => myAgents.filter((agent) => !queuedAgentIds.has(agent.id)),
    [myAgents, queuedAgentIds]
  );
  const battleBoardItems = useMemo(() => battleBoardQ.items.slice(0, 8), [battleBoardQ.items]);
  const selectedStatusAgent =
    myAgents.find((agent) => agent.id === statusAgentId) ?? myQueueRows.find((row) => row.agent.id === statusAgentId)?.agent ?? null;

  useEffect(() => {
    setChallengeAgentId((current) => {
      if (current && availableBattleAgents.some((agent) => agent.id === current)) return current;
      return availableBattleAgents[0]?.id ?? null;
    });
    setManualBattleAgentId((current) => {
      if (current && availableBattleAgents.some((agent) => agent.id === current)) return current;
      return availableBattleAgents[0]?.id ?? null;
    });
  }, [availableBattleAgents]);

  const battleQ = useQuery({
    queryKey: ["aiArenaGateway", "battlePageBattle", selectedBattleId],
    queryFn: () => aiArenaGatewayApi.getBattle(selectedBattleId!),
    enabled: isAuthenticated && isAiArenaReady && !!selectedBattleId,
    staleTime: 5_000,
    retry: 1,
  });

  const battleParticipantsQ = useQuery({
    queryKey: ["aiArenaGateway", "battlePageParticipants", selectedBattleId, battleQ.data?.battle?.agentIds?.join(",")],
    queryFn: async () => {
      const ids = battleQ.data?.battle?.agentIds ?? [];
      const agents = await Promise.all(
        ids.map(async (agentId) => {
          try {
            return await aiArenaGatewayApi.getAgentById(agentId);
          } catch {
            return fallbackArenaAgent(agentId);
          }
        })
      );
      return agents;
    },
    enabled: isAuthenticated && isAiArenaReady && !!selectedBattleId && (battleQ.data?.battle?.agentIds?.length ?? 0) > 0,
    staleTime: 20_000,
    retry: 1,
  });

  useEffect(() => {
    if (!selectedBattleId) {
      setWsStatus("idle");
      setWsMessages([]);
      return;
    }

    const ws = new WebSocket(aiArenaGatewayApi.getBattleWebSocketUrl(selectedBattleId));
    setWsStatus("connecting");
    setWsMessages([]);

    ws.onopen = () => {
      setWsStatus("open");
      setWsMessages((current) => [
        {
          id: `open-${Date.now()}`,
          text: "Socket connected",
          ts: new Date().toLocaleTimeString(),
        },
        ...current,
      ].slice(0, 6));
    };

    ws.onmessage = (event) => {
      const payload = normalizeSocketMessage(String(event.data ?? ""));
      setWsMessages((current) => [
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          text: JSON.stringify(payload),
          ts: new Date().toLocaleTimeString(),
        },
        ...current,
      ].slice(0, 6));
      void queryClient.invalidateQueries({ queryKey: ["aiArenaGateway", "battlePageBattle", selectedBattleId] });
    };

    ws.onerror = () => {
      setWsStatus("error");
    };

    ws.onclose = () => {
      setWsStatus((current) => (current === "error" ? "error" : "closed"));
    };

    return () => {
      ws.close();
    };
  }, [queryClient, selectedBattleId]);

  const invalidateBattleOps = async () => {
    await queryClient.invalidateQueries({ queryKey: ["aiArenaGateway", "battlePageStatuses"], exact: false });
    await queryClient.invalidateQueries({ queryKey: ["aiArenaGateway", "openLobbies"], exact: false });
    await queryClient.invalidateQueries({ queryKey: ["aiArenaGateway", "matchStatusModal"], exact: false });
  };

  const directChallengeMut = useMutation({
    mutationFn: async (opponentId: string) => {
      const nextAgentId = challengeAgentId ?? availableBattleAgents[0]?.id;
      if (!nextAgentId) throw new Error("Pick an available agent before joining a lobby.");
      return aiArenaGatewayApi.directMatchmakingChallenge({
        agentId: nextAgentId,
        opponentId,
        gameId: manualGameId,
        mode: manualMode,
      });
    },
    onMutate: (opponentId) => {
      setJoiningLobbyId(opponentId);
    },
    onSuccess: async (result) => {
      const battleId = result.match.battleId;
      setSelectedBattleId(battleId);
      setBattleLookupInput(battleId);
      toast.success("Battle starting — watch the live state below.");
      // Open status modal for the joiner's agent so they see the faceoff too.
      // The matchmaking-service writes a match:found Redis key for both agents;
      // the modal's polling will pick it up and transition to "Match found".
      if (challengeAgentId) {
        setStatusAgentId(challengeAgentId);
        setStatusModalOpen(true);
      }
      await invalidateBattleOps();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not join that arena lobby.");
    },
    onSettled: () => {
      setJoiningLobbyId(null);
    },
  });

  const leaveQueueMut = useMutation({
    mutationFn: async (agentId: string) => aiArenaGatewayApi.leaveMatchmakingQueue(agentId),
    onMutate: (agentId) => {
      setLeavingAgentId(agentId);
    },
    onSuccess: async () => {
      toast.success("Agent removed from the queue.");
      await invalidateBattleOps();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not leave matchmaking.");
    },
    onSettled: () => {
      setLeavingAgentId(null);
    },
  });

  const createBattleMut = useMutation({
    mutationFn: async () => {
      if (!manualBattleAgentId) throw new Error("Select your fighter first.");
      if (!manualOpponentId.trim()) throw new Error("Enter an opponent ID.");
      return aiArenaGatewayApi.createBattle({
        agentId: manualBattleAgentId,
        opponentId: manualOpponentId.trim(),
        mode: manualMode,
        gameId: manualGameId,
        wagerAmount: manualMode === "WAGER" && manualWagerAmount.trim() ? Number(manualWagerAmount) : undefined,
      });
    },
    onSuccess: (result) => {
      const battleId = result.battle.id;
      setSelectedBattleId(battleId);
      setBattleLookupInput(battleId);
      toast.success("Battle created successfully.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not create battle.");
    },
  });

  const disputeMut = useMutation({
    mutationFn: async () => {
      if (!selectedBattleId) throw new Error("Load a battle before disputing it.");
      if (!disputeReason.trim()) throw new Error("Add a dispute reason first.");
      return aiArenaGatewayApi.disputeBattle(selectedBattleId, { reason: disputeReason.trim() });
    },
    onSuccess: async () => {
      toast.success("Battle dispute submitted.");
      setDisputeReason("");
      await queryClient.invalidateQueries({ queryKey: ["aiArenaGateway", "battlePageBattle", selectedBattleId], exact: false });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not submit dispute.");
    },
  });

  const handleLookupBattle = () => {
    const nextId = battleLookupInput.trim();
    if (!nextId) {
      toast.error("Paste a battle ID to inspect it.");
      return;
    }
    setSelectedBattleId(nextId);
  };

  const canUseBattleOps = isAuthenticated && isAiArenaReady;

  return (
    <ArenaPageLayout>
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">BATTLE ARENA</h1>
        <p className="mt-2 text-sm text-white/68">Compete in epic battles across different games and modes.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_270px]">
        <StatsRail myAgents={myAgents} />
        <RankCard firstAgent={myAgents[0] ?? null} />
      </div>

      <GameCarouselSection />

      <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="arena-panel border-white/8 bg-[#04080f]/95 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <SectionTitle className="!mt-0">ALL ARENA BATTLES</SectionTitle>
                <p className="mt-2 max-w-2xl text-sm text-white/55">
                  Live open lobbies and ranked arena snapshots stay on the main board, so battles live on the left while your rewards and
                  roster stay pinned on the right.
                </p>
              </div>
              {canUseBattleOps ? (
                <label className="min-w-[230px] space-y-2">
                  <span className="font-tech text-[9px] uppercase tracking-[0.16em] text-white/35">Join with</span>
                  <select
                    value={challengeAgentId ?? ""}
                    onChange={(event) => setChallengeAgentId(event.target.value || null)}
                    className="arena-select"
                  >
                    {availableBattleAgents.length > 0 ? (
                      availableBattleAgents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} — ELO {agent.eloRating}
                        </option>
                      ))
                    ) : (
                      <option value="">No free agents available</option>
                    )}
                  </select>
                </label>
              ) : (
                <button
                  type="button"
                  onClick={login}
                  className="inline-flex items-center gap-2 rounded border border-purple-500/30 bg-purple-500/10 px-3 py-2 font-tech text-[10px] uppercase tracking-[0.16em] text-purple-200 transition hover:border-purple-400/55"
                >
                  Connect to join
                </button>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MetaStat label="Public lobbies" value={String(battleBoardQ.openLobbyItems.length)} />
              <MetaStat label="Rank snapshots" value={String(battleBoardQ.rankedBattleItems.length)} />
              <MetaStat label="Your queued battles" value={String(myQueueRows.length)} />
            </div>

            <div className="mt-5">
              {battleBoardQ.isLoading && battleBoardItems.length === 0 ? (
                <ArenaBattleBoardGridSkeleton count={6} className="xl:grid-cols-2" />
              ) : battleBoardItems.length > 0 ? (
                <div className="grid gap-3 xl:grid-cols-2">
                  {battleBoardItems.map((item) => {
                    const isOwnQueuedLobby =
                      item.kind === "open-lobby" && myAgentIds.has(item.agent.id) && queuedAgentIds.has(item.agent.id);

                    return (
                      <ArenaBattleBoardCard
                        key={item.id}
                        item={item}
                        actionLabel={
                          item.kind === "open-lobby"
                            ? isOwnQueuedLobby
                              ? "Open status"
                              : canUseBattleOps
                                ? "Join in arena"
                                : "Connect to join"
                            : ""
                        }
                        onAction={
                          item.kind === "open-lobby"
                            ? isOwnQueuedLobby
                              ? () => {
                                  setStatusAgentId(item.agent.id);
                                  setStatusModalOpen(true);
                                }
                              : canUseBattleOps
                                ? () => directChallengeMut.mutate(item.agent.id)
                                : login
                            : undefined
                        }
                        actionDisabled={
                          item.kind === "open-lobby" && !isOwnQueuedLobby && canUseBattleOps
                            ? !challengeAgentId || directChallengeMut.isPending
                            : false
                        }
                        actionLoading={
                          item.kind === "open-lobby" && !isOwnQueuedLobby && directChallengeMut.isPending && joiningLobbyId === item.agent.id
                        }
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/8 bg-[#03070d]/60 px-4 py-6 text-sm text-white/50">
                  No live arena battles or open lobbies are available right now.
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
            <div className="arena-panel relative overflow-hidden border border-cyan-500/14 bg-[linear-gradient(180deg,rgba(4,8,15,0.98),rgba(3,7,13,0.94))] p-4 sm:p-5">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,255,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.08),transparent_34%)]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" />
              <div className="relative flex flex-wrap items-start justify-between gap-4 border-b border-white/8 pb-5">
                <div className="flex max-w-2xl items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 shadow-[0_0_24px_rgba(34,211,238,0.12)]">
                    <Activity className="h-5 w-5 text-cyan-200" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/18 bg-cyan-400/10 px-2.5 py-1 font-tech text-[9px] uppercase tracking-[0.18em] text-cyan-100/90">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]" />
                      Live control deck
                    </div>
                    <h3 className="mt-3 font-tech text-xs font-semibold uppercase tracking-[0.18em] text-white/90">My battles</h3>
                    <p className="mt-2 text-sm leading-6 text-white/58">
                      Track your queued fighters, reopen live match status in one click, and clear a slot instantly when you want that agent
                      back in rotation.
                    </p>
                  </div>
                </div>
                {canUseBattleOps ? (
                  <button
                    type="button"
                    onClick={() => setStartModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/28 bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(12,18,28,0.55))] px-3.5 py-2.5 font-tech text-[10px] uppercase tracking-[0.16em] text-cyan-100 transition hover:border-cyan-300/55 hover:text-white"
                  >
                    <Swords className="h-3.5 w-3.5" />
                    Start matching
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={login}
                    className="inline-flex items-center gap-2 rounded-xl border border-purple-500/28 bg-[linear-gradient(135deg,rgba(139,92,246,0.18),rgba(12,18,28,0.55))] px-3.5 py-2.5 font-tech text-[10px] uppercase tracking-[0.16em] text-purple-100 transition hover:border-purple-300/55 hover:text-white"
                  >
                    Connect to manage
                  </button>
                )}
              </div>

              {canUseBattleOps ? (
                <>
                  <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
                    <MetaStat label="Your agents" value={String(myAgents.length)} />
                    <MetaStat label="Queued now" value={String(myQueueRows.length)} />
                  </div>

                  <div className="mt-5 rounded-2xl border border-cyan-500/12 bg-[linear-gradient(180deg,rgba(7,16,24,0.88),rgba(3,8,14,0.72))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-tech text-[10px] uppercase tracking-[0.16em] text-cyan-100/82">My live queue</div>
                        <p className="mt-1 text-sm text-white/50">Queued matchups that are still waiting for the arena to lock an opponent.</p>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/14 bg-cyan-400/8 px-3 py-1.5 text-[10px] text-cyan-100/80">
                        <Radio className="h-3.5 w-3.5" />
                        {myQueueRows.length} live
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                    {myStatusesQ.isLoading ? (
                      <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-black/20 px-4 py-5 text-sm text-white/55">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking live matchmaking status…
                      </div>
                    ) : myQueueRows.length > 0 ? (
                      <div className="grid gap-3">
                        {myQueueRows.map((row) => (
                          <QueueStatusCard
                            key={row.agent.id}
                            row={row}
                            leaving={leaveQueueMut.isPending && leavingAgentId === row.agent.id}
                            onView={(agentId) => {
                              setStatusAgentId(agentId);
                              setStatusModalOpen(true);
                            }}
                            onLeave={(agentId) => leaveQueueMut.mutate(agentId)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-white/8 bg-black/15 px-4 py-5 text-sm text-white/50">
                        None of your agents are queued right now.
                      </div>
                    )}
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-purple-500/12 bg-[linear-gradient(180deg,rgba(19,10,28,0.72),rgba(9,10,18,0.66))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-tech text-[10px] uppercase tracking-[0.16em] text-purple-100/82">Join public battles</div>
                        <p className="mt-2 text-sm text-white/55">
                      Pick your challenger in the battle board header, then use any open lobby card on the left to jump straight into that fight.
                        </p>
                      </div>
                      <div className="rounded-full border border-purple-400/16 bg-purple-400/8 px-3 py-1.5 text-[10px] text-purple-100/80">
                        Quick join flow
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <MetaStat label="Free fighters" value={String(availableBattleAgents.length)} />
                      <MetaStat label="Open lobbies" value={String(battleBoardQ.openLobbyItems.length)} />
                      <MetaStat label="Arena board" value={`${battleBoardItems.length} live cards`} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-xl border border-white/8 bg-black/20 px-4 py-6 text-sm text-white/55">
                  Sign in and wait for the AI Arena session to finish loading before using live battle operations.
                </div>
              )}
            </div>

            <div className="arena-panel relative overflow-hidden border border-amber-500/12 bg-[linear-gradient(180deg,rgba(5,8,14,0.98),rgba(3,7,13,0.95))] p-4 sm:p-5">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.08),transparent_32%)]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent" />
              <div className="relative border-b border-white/8 pb-5">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-amber-400/24 bg-amber-400/10 shadow-[0_0_24px_rgba(251,191,36,0.1)]">
                    <Shield className="h-5 w-5 text-amber-100" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-amber-400/18 bg-amber-400/10 px-2.5 py-1 font-tech text-[9px] uppercase tracking-[0.18em] text-amber-50/90">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.9)]" />
                      Direct battle tools
                    </div>
                    <h3 className="mt-3 font-tech text-xs font-semibold uppercase tracking-[0.18em] text-white/90">Battle console</h3>
                    <p className="mt-2 text-sm leading-6 text-white/58">
                      Launch direct fights, inspect any battle by ID, watch socket traffic, and raise disputes from a single command surface.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[10px] text-white/65">Create direct battle</span>
                      <span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[10px] text-white/65">Inspect by battle ID</span>
                      <span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[10px] text-white/65">Live socket stream</span>
                    </div>
                  </div>
                </div>
              </div>

              {canUseBattleOps ? (
                <>
                  <div className="mt-5 rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-tech text-[10px] uppercase tracking-[0.16em] text-white/75">Direct battle setup</div>
                        <p className="mt-1 text-sm text-white/50">Pick your agent, set the mode, and lock a target before you create the match.</p>
                      </div>
                      <div className="rounded-full border border-cyan-400/14 bg-cyan-400/8 px-3 py-1.5 text-[10px] text-cyan-100/82">
                        Arena-ready
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="font-tech text-[9px] uppercase tracking-[0.16em] text-white/35">Your fighter</span>
                      <select
                        value={manualBattleAgentId ?? ""}
                        onChange={(event) => setManualBattleAgentId(event.target.value || null)}
                        className="arena-select"
                      >
                        {availableBattleAgents.length > 0 ? (
                          availableBattleAgents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name} — ELO {agent.eloRating}
                            </option>
                          ))
                        ) : (
                          <option value="">No free agents available</option>
                        )}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="font-tech text-[9px] uppercase tracking-[0.16em] text-white/35">Mode</span>
                      <select
                        value={manualMode}
                        onChange={(event) => setManualMode(event.target.value as (typeof AI_ARENA_MATCH_MODES)[number]["value"])}
                        className="arena-select"
                      >
                        {AI_ARENA_MATCH_MODES.map((mode) => (
                          <option key={mode.value} value={mode.value}>
                            {mode.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="font-tech text-[9px] uppercase tracking-[0.16em] text-white/35">Game</span>
                      <select value={manualGameId} onChange={(event) => setManualGameId(event.target.value)} className="arena-select">
                        {AI_ARENA_GAME_IDS.map((game) => (
                          <option key={game.value} value={game.value}>
                            {game.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="font-tech text-[9px] uppercase tracking-[0.16em] text-white/35">Opponent ID</span>
                      <BattleInput
                        label=""
                        value={manualOpponentId}
                        onChange={setManualOpponentId}
                        placeholder="Agent ID to fight"
                      />
                    </label>
                    </div>

                    {manualMode === "WAGER" ? (
                      <div className="mt-3 max-w-xs">
                        <BattleInput
                          label="Wager amount"
                          value={manualWagerAmount}
                          onChange={setManualWagerAmount}
                          placeholder="Optional stake"
                        />
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => createBattleMut.mutate()}
                        disabled={createBattleMut.isPending || !manualBattleAgentId}
                        className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/28 bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(11,19,30,0.72))] px-[18px] py-2.5 font-tech text-[10px] uppercase tracking-[0.16em] text-cyan-100 transition hover:border-cyan-300/55 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {createBattleMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Swords className="h-3.5 w-3.5" />}
                        Create battle
                      </button>
                      <span className="text-xs text-white/45">Direct creation hides queued agents to avoid queue conflicts.</span>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(6,12,20,0.76),rgba(3,7,13,0.7))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-tech text-[10px] uppercase tracking-[0.16em] text-white/75">Battle lookup</div>
                        <p className="mt-1 text-sm text-white/50">Open any battle by ID to inspect live state, socket events, and dispute controls.</p>
                      </div>
                      <div className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-[10px] text-white/60">
                        Socket {wsStatus}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input
                        value={battleLookupInput}
                        onChange={(event) => setBattleLookupInput(event.target.value)}
                        placeholder="Paste battle id"
                        className="arena-input flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleLookupBattle}
                        className="rounded border border-white/10 bg-white/5 px-3 py-2 font-tech text-[10px] uppercase tracking-[0.16em] text-white/75 transition hover:border-cyan-400/45 hover:text-cyan-200"
                      >
                        Load
                      </button>
                    </div>

                    {battleQ.isLoading ? (
                      <div className="mt-4 flex items-center gap-2 text-sm text-white/55">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading battle snapshot…
                      </div>
                    ) : battleQ.isError ? (
                      <div className="mt-4 rounded-lg border border-rose-500/20 bg-rose-950/10 px-4 py-3 text-sm text-rose-100/90">
                        Could not load that battle. Check the battle ID and try again.
                      </div>
                    ) : battleQ.data?.battle ? (
                      <div className="mt-4">
                        <BattleDetailPanel
                          battle={battleQ.data.battle}
                          participants={battleParticipantsQ.data ?? []}
                          disputeReason={disputeReason}
                          setDisputeReason={setDisputeReason}
                          disputing={disputeMut.isPending}
                          onDispute={() => disputeMut.mutate()}
                          wsStatus={wsStatus}
                          wsMessages={wsMessages}
                        />
                      </div>
                    ) : (
                      <div className="mt-4 rounded-lg border border-dashed border-white/8 bg-[#03070d]/60 px-4 py-6 text-sm text-white/50">
                        Load a battle ID to inspect its live state, connect the socket stream, or dispute the result.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-xl border border-white/8 bg-black/20 px-4 py-6 text-sm text-white/55">
                  Connect your wallet to create direct battles, challenge open lobbies, and inspect live battle state.
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-6 self-start xl:sticky xl:top-24">
          <div>
            <div className="mb-3">
              <SectionTitle className="!mt-0">BATTLE REWARDS</SectionTitle>
            </div>
            <Rewards />
          </div>
          <div>
            <SectionTitle className="mt-0">YOUR TOP PERFORMERS</SectionTitle>
            <div className="mt-3 grid gap-3">
              {myAgentsQ.isLoading ? (
                <div className="arena-panel flex items-center gap-2 p-4 text-sm text-white/55">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading your AI Arena agents…
                </div>
              ) : topPerformerAgents.length > 0 ? (
                topPerformerAgents.map((agent) => <PerformerCard key={agent.id} agent={agent} />)
              ) : (
                <div className="arena-panel p-4 text-sm text-white/50">
                  {isAuthenticated
                    ? "Your AI Arena agents will appear here once you have fighters in the roster."
                    : "Connect your wallet to load your top AI Arena agents."}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <MyBattlesCarouselSection
        agents={myAgents}
        loading={myAgentsQ.isLoading}
      />

      <ArenaStartMatchmakingModal
        open={startModalOpen}
        onOpenChange={setStartModalOpen}
        agents={myAgents}
        defaultAgentId={challengeAgentId}
        onQueued={async (agentId) => {
          setStatusAgentId(agentId);
          setStatusModalOpen(true);
          await invalidateBattleOps();
        }}
      />

      <ArenaMatchStatusModal
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        agent={selectedStatusAgent}
        leaving={leaveQueueMut.isPending}
        onLeave={(agentId) => leaveQueueMut.mutate(agentId)}
        onMatchFound={({ battleId, agent, opponent, mode }) => {
          setStatusModalOpen(false);
          navigate(
            `/arena/game/${battleId}?myAgentId=${encodeURIComponent(agent.id)}&opponentId=${encodeURIComponent(opponent.id)}&mode=${encodeURIComponent(mode)}`
          );
        }}
      />
    </ArenaPageLayout>
  );
};

export default BattlesPage;
