import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MY_ARENA_AGENTS_QUERY_KEY } from "@/hooks/useMyArenaAgents";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Globe,
  Hexagon,
  Info,
  LineChart,
  Loader2,
  Plus,
  Radio,
  Search,
  Skull,
  Swords,
  TrendingUp,
  UserRound,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { aiArenaGatewayApi } from "@/api/aiArenaGatewayApi";
import { ArenaAgentWalletManagerModal } from "@/components/arena/ArenaAgentWalletManagerModal";
import { AiArenaAgentDetailModal } from "@/components/arena/AiArenaAgentDetailModal";
import { ArenaAgentThumbnail } from "@/components/arena/ArenaAgentThumbnail";
import { ArenaPageLayout } from "@/components/arena/ArenaPageLayout";
import { DashboardSignInGate } from "@/components/dashboard/DashboardSignInGate";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateAgent } from "@/contexts/CreateAgentContext";
import { ClanIcon } from "@/components/arena/ClanIcon";
import { useArenaAgentsList } from "@/hooks/useArenaAgentsList";
import { useMyArenaAgents } from "@/hooks/useMyArenaAgents";
import type { AiArenaAgent, AiArenaAgentMemory, AiArenaBattle } from "@/types/aiArenaGateway";
import tacticianPortrait from "@/assets/tactician.mp4";
import assassinPortrait from "@/assets/assassin.gif";
import berserkerPortrait from "@/assets/berserker.mp4";
import defenderPortrait from "@/assets/defender.mp4";
import hybridPortrait from "@/assets/hybrid.mp4";
import supportPortrait from "@/assets/support.mp4";

const sortOptions = ["Recently Used", "Level", "Win Rate", "Power Score"] as const;

const STAGE_ORDER = [
  "GENESIS",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "DIAMOND",
  "MASTER",
  "LEGENDARY",
] as const;

function clanTypeFromAgent(agent: AiArenaAgent): "zerog" | "solana" | "base" {
  const clan = agent.clan?.toUpperCase();
  if (clan === "SOLANA") return "solana";
  if (clan === "BASE") return "base";
  return "zerog";
}

function clanLabel(clan?: string) {
  const normalized = clan?.trim().toUpperCase();
  if (normalized === "SOLANA") return "Solana";
  if (normalized === "BASE") return "Base";
  if (normalized === "ZEROG" || normalized === "0G") return "ZeroG";
  return clan?.trim() || "AI Arena";
}

function isAgentActive(agent: AiArenaAgent) {
  return agent.status?.toLowerCase() !== "inactive";
}

function agentBattles(agent: AiArenaAgent) {
  return agent.wins + agent.losses + (agent.draws ?? 0);
}

function agentWinRate(agent: AiArenaAgent) {
  const battles = agentBattles(agent);
  if (!battles) return 0;
  return Number(((agent.wins / battles) * 100).toFixed(1));
}

function stageRank(stage?: string) {
  const normalized = stage?.trim().toUpperCase() || "GENESIS";
  const indexed = STAGE_ORDER.indexOf(normalized as (typeof STAGE_ORDER)[number]);
  if (indexed >= 0) return indexed + 1;
  const numeric = Number.parseInt(normalized.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(numeric) ? numeric : 1;
}

function stageLabel(stage?: string) {
  return (stage?.trim() || "GENESIS").replace(/_/g, " ");
}

function progressFromAgent(agent: AiArenaAgent) {
  const battles = agentBattles(agent);
  if (battles > 0) {
    return Math.max(12, Math.min(100, Math.round((agent.wins / battles) * 100)));
  }
  return Math.max(12, Math.min(100, Math.round(agent.eloRating / 25)));
}

function resolveAgentImage(agent: AiArenaAgent, index: number) {
  const archetype = agent.archetype?.toUpperCase();
  if (archetype?.includes("ASSASSIN")) return assassinPortrait;
  if (archetype?.includes("TACTICIAN")) return tacticianPortrait;
  if (archetype?.includes("DEFENDER")) return defenderPortrait;
  if (archetype?.includes("BERSERKER")) return berserkerPortrait;
  if (archetype?.includes("SUPPORT")) return supportPortrait;
  if (archetype?.includes("HYBRID")) return hybridPortrait;

  const byClan = clanTypeFromAgent(agent);
  if (byClan === "solana") return index % 2 === 0 ? tacticianPortrait : supportPortrait;
  if (byClan === "base") return index % 2 === 0 ? defenderPortrait : berserkerPortrait;
  return index % 2 === 0 ? assassinPortrait : hybridPortrait;
}

function sortAgents(agents: AiArenaAgent[], sortBy: string) {
  const sorted = [...agents];

  sorted.sort((left, right) => {
    if (sortBy === "Level") {
      return stageRank(right.evolutionStage) - stageRank(left.evolutionStage);
    }
    if (sortBy === "Win Rate") {
      return agentWinRate(right) - agentWinRate(left);
    }
    if (sortBy === "Power Score") {
      return right.eloRating - left.eloRating;
    }

    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });

  return sorted;
}

function shortBattleId(value: string) {
  return value.length <= 14 ? value : `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function MyAgentBattleMemoryCard({
  memory,
  participants,
}: {
  memory: AiArenaAgentMemory;
  participants: AiArenaAgent[];
}) {
  const battleId = memory.metadata?.battleId;
  const outcome = String(memory.metadata?.outcome ?? memory.type).toUpperCase();
  const isWin = outcome === "WIN";
  const isCancelled = outcome === "CANCELLED";
  return (
    <div className="card-glass rounded-xl border border-primary/20 p-5">
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
              <ArenaAgentThumbnail agent={agent} size="md" className="h-20 w-20 rounded-xl border-2 border-primary/25" />
              <p className="mt-1 max-w-20 truncate font-tech text-[8px] text-white/55">{agent.name}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 font-mono text-[11px] italic leading-relaxed text-white/65">{memory.content}</p>
      <p className="mt-2 font-mono text-[10px] text-white/40">{new Date(memory.createdAt).toLocaleString()}</p>
      {battleId ? (
        <Link
          to={`/arena/game/${battleId}`}
          className="mt-4 inline-flex items-center gap-2 font-tech text-[9px] font-bold uppercase text-primary hover:text-white"
        >
          <Eye className="h-3.5 w-3.5" />
          Open Battle {shortBattleId(battleId)}
        </Link>
      ) : null}
    </div>
  );
}

function BattlesCarouselSection({
  isLoading,
  isError,
  memories,
  battlesById,
  agentsById,
}: {
  isLoading: boolean;
  isError: boolean;
  memories: (AiArenaAgentMemory & { ownerAgentId: string })[];
  battlesById: Map<string, AiArenaBattle>;
  agentsById: Map<string, AiArenaAgent>;
}) {
  const CARDS_PER_PAGE = 3;
  const [battlePage, setBattlePage] = useState(0);
  const totalBattlePages = Math.max(1, Math.ceil(memories.length / CARDS_PER_PAGE));
  const canPrevBattle = battlePage > 0;
  const canNextBattle = battlePage < totalBattlePages - 1;

  return (
    <section className="arena-panel border-white/8 bg-[#04080f]/95 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-4">
        <div>
          <h2 className="font-tech text-lg font-bold uppercase tracking-tight text-white">MY BATTLES</h2>
          <p className="mt-1 text-[10px] text-white/45">Your completed arena battle history.</p>
        </div>
        <div className="flex items-center gap-3">
          {memories.length > CARDS_PER_PAGE && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBattlePage((p) => Math.max(0, p - 1))}
                disabled={!canPrevBattle}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-white transition hover:border-purple-500/60 hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-30"
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
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-white transition hover:border-purple-500/60 hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          <Swords className="h-5 w-5 text-purple-400" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your battles...
        </div>
      ) : isError ? (
        <div className="py-10 text-center text-sm text-amber-100/80">
          Could not load your battles right now.
        </div>
      ) : memories.length === 0 ? (
        <div className="py-10 text-center">
          <Swords className="mx-auto h-7 w-7 text-white/20" />
          <p className="mt-3 text-sm text-white/55">No battle is available yet. Start matchmaking to enter the arena.</p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden">
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
                    return (
                      <MyAgentBattleMemoryCard
                        key={memory.id}
                        memory={memory}
                        participants={participants}
                      />
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
                      ? "w-6 bg-purple-500"
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

const MyAgentsPage = () => {
  const { isAuthenticated } = useAuth();
  const { openCreateAgent } = useCreateAgent();
  const [activeFilterTab, setActiveFilterTab] = useState<string>("ALL AGENTS");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]>("Recently Used");
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletAgentId, setWalletAgentId] = useState<string | null>(null);
  const [detailAgent, setDetailAgent] = useState<AiArenaAgent | null>(null);
  const [confirmRetireId, setConfirmRetireId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const retireMutation = useMutation({
    mutationFn: (agentId: string) => aiArenaGatewayApi.retireAgent(agentId),
    onSuccess: () => {
      toast.success("Agent retired successfully");
      setConfirmRetireId(null);
      void queryClient.invalidateQueries({ queryKey: MY_ARENA_AGENTS_QUERY_KEY });
    },
    onError: () => {
      toast.error("Failed to retire agent. Try again.");
      setConfirmRetireId(null);
    },
  });
  const myAgentsQ = useMyArenaAgents(1, 50);
  const totalAgentsQ = useArenaAgentsList(1, 1);
  const agents = myAgentsQ.data?.agents ?? [];
  type OwnedBattleMemory = AiArenaAgentMemory & { ownerAgentId: string };
  const battlesQ = useQuery({
    queryKey: ["aiArenaGateway", "myAgentsBattleMemories", agents.map((agent) => agent.id).join(",")],
    queryFn: async () => {
      const results = await Promise.all(agents.map((agent) => aiArenaGatewayApi.getAgentMemories(agent.id, 1, 100)));
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
  const battleIds = useMemo(
    () => (battlesQ.data ?? []).map((memory) => memory.metadata?.battleId).filter((id): id is string => Boolean(id)),
    [battlesQ.data]
  );
  const battleDetailsQ = useQuery({
    queryKey: ["aiArenaGateway", "myAgentsMemoryBattles", battleIds.join(",")],
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
    queryKey: ["aiArenaGateway", "myAgentsMemoryParticipants", participantIds.join(",")],
    queryFn: async () =>
      Promise.all(
        participantIds.map(async (agentId) => {
          const ownedAgent = agents.find((agent) => agent.id === agentId);
          if (ownedAgent) return ownedAgent;
          try {
            return await aiArenaGatewayApi.getAgentById(agentId);
          } catch {
            return { id: agentId, name: shortBattleId(agentId), archetype: "HYBRID" } as AiArenaAgent;
          }
        })
      ),
    enabled: participantIds.length > 0,
    staleTime: 60_000,
  });
  const agentsById = useMemo(
    () => new Map([...agents, ...(participantAgentsQ.data ?? [])].map((agent) => [agent.id, agent])),
    [agents, participantAgentsQ.data]
  );

  if (!isAuthenticated) {
    return (
      <DashboardSignInGate
        title="My Agents"
        description="Connect your wallet to view, manage, and train the AI agents linked to your account."
      />
    );
  }

  const activeAgents = agents.filter(isAgentActive);
  const inactiveAgents = agents.filter((agent) => !isAgentActive(agent));
  const totalBattles = agents.reduce((sum, agent) => sum + agentBattles(agent), 0);
  const totalWins = agents.reduce((sum, agent) => sum + agent.wins, 0);
  const overallWinRate = totalBattles > 0 ? Number(((totalWins / totalBattles) * 100).toFixed(1)) : 0;
  const myAgentsTotal = myAgentsQ.data?.total ?? agents.length;
  const arenaAgentsTotal = totalAgentsQ.data?.total ?? null;
  const waitingForArenaSession = !myAgentsQ.data && !myAgentsQ.isLoading && !myAgentsQ.isError;

  const filterTabs = [
    { label: `ALL AGENTS (${agents.length})`, key: "ALL AGENTS" },
    { label: `ACTIVE (${activeAgents.length})`, key: "ACTIVE" },
    { label: `INACTIVE (${inactiveAgents.length})`, key: "INACTIVE" },
    { label: "ARCHIVED (0)", key: "ARCHIVED" },
  ] as const;

  const filteredAgents = sortAgents(
    agents.filter((agent) => {
      const matchesTab =
        activeFilterTab === "ALL AGENTS" ||
        (activeFilterTab === "ACTIVE" && isAgentActive(agent)) ||
        (activeFilterTab === "INACTIVE" && !isAgentActive(agent));
      const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    }),
    sortBy
  );

  const openWalletManager = (agentId: string) => {
    setWalletAgentId(agentId);
    setWalletModalOpen(true);
  };

  return (
    <ArenaPageLayout>
      <div>
        <h1 className="font-tech text-3xl font-bold uppercase tracking-tight text-white">MY AGENTS</h1>
        <p className="mt-1 text-[11px] font-medium text-white/55">Manage, train, and deploy your AI agents.</p>
      </div>

      <div className="relative z-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="arena-panel flex items-center justify-between border-white/8 bg-[#04080f]/90 p-4">
          <div className="space-y-1">
            <span className="font-tech text-[9px] font-bold uppercase tracking-wider text-white/40">YOUR AGENTS</span>
            <span className="font-tech block text-xl font-bold text-white">
              {waitingForArenaSession ? "..." : myAgentsTotal.toLocaleString()}
            </span>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-400">
            <UserRound className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="arena-panel flex items-center justify-between border-white/8 bg-[#04080f]/90 p-4">
          <div className="space-y-1">
            <span className="font-tech text-[9px] font-bold uppercase tracking-wider text-white/40">ARENA TOTAL</span>
            <span className="font-tech block text-xl font-bold text-white">
              {arenaAgentsTotal == null ? "..." : arenaAgentsTotal.toLocaleString()}
            </span>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
            <Globe className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="arena-panel flex items-center justify-between border-white/8 bg-[#04080f]/90 p-4">
          <div className="space-y-1">
            <span className="font-tech text-[9px] font-bold uppercase tracking-wider text-white/40">ACTIVE AGENTS</span>
            <div className="flex items-center gap-1.5">
              <span className="font-tech text-xl font-bold text-white">{activeAgents.length.toLocaleString()}</span>
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            </div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <Radio className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="arena-panel flex items-center justify-between border-white/8 bg-[#04080f]/90 p-4">
          <div className="space-y-1">
            <span className="font-tech text-[9px] font-bold uppercase tracking-wider text-white/40">TOTAL BATTLES</span>
            <span className="font-tech block text-xl font-bold text-white">{totalBattles.toLocaleString()}</span>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400">
            <Swords className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="arena-panel flex items-center justify-between border-white/8 bg-[#04080f]/90 p-4">
          <div className="space-y-1">
            <span className="font-tech text-[9px] font-bold uppercase tracking-wider text-white/40">WIN RATE</span>
            <span className="font-tech block text-xl font-bold text-white">{overallWinRate.toFixed(1)}%</span>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-500/20 bg-sky-500/10 text-sky-400">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      <div className="arena-panel flex flex-wrap items-center justify-between gap-3 border-white/8 bg-[#04080f]/95 p-3">
        <div className="flex flex-wrap items-center gap-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilterTab(tab.key)}
              className={`rounded px-3 py-1.5 font-tech text-[10px] font-bold uppercase tracking-wider transition ${
                activeFilterTab === tab.key
                  ? "bg-[#9a35ff] text-white"
                  : "text-white/40 hover:bg-white/5 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex max-sm:flex-wrap max-sm:w-full items-center gap-2">
          <div className="relative max-sm:w-full">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-[180px] max-sm:w-full rounded border border-white/8 bg-[#03070d]/60 py-1.5 pl-9 pr-4 text-xs font-semibold text-white outline-none transition placeholder:text-white/20 focus:border-purple-500/50"
            />
          </div>
          <div className="relative max-sm:flex-1">
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as (typeof sortOptions)[number])}
              className="cursor-pointer max-sm:w-full appearance-none rounded border border-white/8 bg-[#03070d]/60 py-1.5 pl-3 pr-8 text-xs font-semibold text-white/70 outline-none hover:text-white"
            >
              {sortOptions.map((option) => (
                <option key={option} value={option}>
                  {`Sort by: ${option}`}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
          </div>
          <button
            type="button"
            onClick={() => openCreateAgent()}
            className="flex cursor-pointer items-center justify-center max-sm:flex-1 gap-1.5 rounded bg-[#9a35ff] px-3.5 py-1.5 font-tech text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-purple-600"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>CREATE AGENT</span>
          </button>
        </div>
      </div>

      {myAgentsQ.isError ? (
        <div className="arena-panel border-amber-500/25 bg-amber-500/10 px-4 py-5 text-sm text-amber-100/90">
          Could not load your AI Arena agents right now. Try again after the arena session reconnects.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {myAgentsQ.isLoading || waitingForArenaSession ? (
          <div className="arena-panel col-span-full border-white/8 bg-[#04080f]/95 px-5 py-10 text-center text-sm text-white/55">
            {waitingForArenaSession ? "Connecting to AI Arena…" : "Loading your agents…"}
          </div>
        ) : agents.length === 0 ? (
          <div className="arena-panel col-span-full border-dashed border-white/12 bg-[#04080f]/95 px-5 py-10 text-center">
            <p className="text-sm text-white/60">No AI Arena agents found for this wallet yet.</p>
            <button
              type="button"
              onClick={() => openCreateAgent()}
              className="mt-4 inline-flex items-center gap-1.5 rounded bg-[#9a35ff] px-4 py-2 font-tech text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-purple-600"
            >
              <Plus className="h-3.5 w-3.5" />
              Create your first agent
            </button>
          </div>
        ) : filteredAgents.length > 0 ? (
          filteredAgents.map((agent, index) => {
            const active = isAgentActive(agent);
            const winRate = agentWinRate(agent);
            const battles = agentBattles(agent);
            const draws = agent.draws ?? 0;
            const recordLabel = draws > 0 ? `${agent.wins}W · ${agent.losses}L · ${draws}D` : `${agent.wins}W · ${agent.losses}L`;

            return (
              <div
                key={agent.id}
                className={`arena-panel relative flex flex-col overflow-hidden border-white/8 bg-[#04080f]/95 group ${
                  active ? "ring-1 ring-[#9a35ff]/15" : ""
                }`}
              >
                <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden border-b border-white/6 bg-black/45">
                  {resolveAgentImage(agent, index).endsWith(".mp4") ? (
                    <video
                      src={resolveAgentImage(agent, index)}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <img
                      src={resolveAgentImage(agent, index)}
                      alt={agent.name}
                      className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#04080f] via-[#04080f]/10 to-transparent" />
                  <div className="absolute left-3.5 top-3.5 flex items-center gap-1 rounded border border-white/10 bg-black/40 px-2 py-0.5 font-tech text-[8px] font-black tracking-wide">
                    <span className={`h-1.5 w-1.5 rounded-full ${active ? "animate-pulse bg-emerald-500" : "bg-white/30"}`} />
                    <span className="uppercase text-white/80">{active ? "ACTIVE" : "INACTIVE"}</span>
                  </div>
                  <Link
                    to="/training"
                    className="absolute right-3.5 top-3.5 flex h-5 w-5 items-center justify-center rounded border border-white/10 bg-black/40 text-white/40 transition hover:bg-black/60 hover:text-white"
                    aria-label={`Open training for ${agent.name}`}
                  >
                    <LineChart className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="flex flex-1 flex-col justify-between space-y-4 p-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold leading-none text-white/95">{agent.name}</span>
                        <Hexagon className="h-3 w-3 fill-[#9a35ff] text-[#9a35ff]" />
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-white/40">
                        <ClanIcon type={clanTypeFromAgent(agent)} className="h-3.5 w-3.5" />
                        <span>{clanLabel(agent.clan)} Clan • {agent.archetype}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between text-[9px] font-semibold text-white/50">
                        <span className="font-tech font-bold text-white">{stageLabel(agent.evolutionStage)}</span>
                        <span className="font-tech">{recordLabel}</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-[#9a35ff]" style={{ width: `${progressFromAgent(agent)}%` }} />
                      </div>
                    </div>
                    <div className="space-y-2 rounded border border-white/8 bg-white/[0.025] px-3 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-tech text-[9px] font-bold uppercase tracking-wider text-white/42">Battles</span>
                        <span className="font-tech text-[11px] font-bold text-white/90">{battles}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-tech text-[9px] font-bold uppercase tracking-wider text-white/42">Win Rate</span>
                        <span className="font-tech text-[11px] font-bold text-white/90">{winRate}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-tech text-[9px] font-bold uppercase tracking-wider text-white/42">Power Score</span>
                        <span className="font-tech text-[11px] font-bold text-purple-300">{agent.eloRating.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 border-t border-white/6 pt-2">
                    <button
                      type="button"
                      onClick={() => openWalletManager(agent.id)}
                      className="flex w-full items-center justify-center gap-1.5 rounded border border-cyan-500/20 bg-cyan-500/8 py-2 font-tech text-[9px] font-bold uppercase tracking-wider text-cyan-200 transition hover:border-cyan-400/40 hover:bg-cyan-500/14"
                    >
                      <WalletCards className="h-3.5 w-3.5" />
                      Wallet & Funds
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDetailAgent(agent)}
                        className="flex-1 rounded border border-white/8 bg-[#0a0f1b]/60 py-2 text-center font-tech text-[9px] font-bold uppercase tracking-wider text-purple-400 transition hover:border-purple-500/35 hover:bg-purple-950/10"
                      >
                        VIEW DETAILS
                      </button>
                      {confirmRetireId === agent.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={retireMutation.isPending}
                            onClick={() => retireMutation.mutate(agent.id)}
                            className="flex items-center gap-1 rounded border border-rose-500/40 bg-rose-500/15 px-2 py-2 font-tech text-[8px] font-bold uppercase text-rose-400 transition hover:bg-rose-500/25 disabled:opacity-50"
                          >
                            {retireMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Skull className="h-3 w-3" />}
                            CONFIRM
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRetireId(null)}
                            className="rounded border border-white/8 bg-[#0a0f1b]/60 px-2 py-2 font-tech text-[8px] font-bold uppercase text-white/40 transition hover:text-white"
                          >
                            CANCEL
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmRetireId(agent.id)}
                          className="flex items-center justify-center rounded border border-white/8 bg-[#0a0f1b]/60 p-2 text-white/30 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
                          aria-label={`Retire ${agent.name}`}
                          title="Retire agent"
                        >
                          <Skull className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="arena-panel col-span-full border-white/8 bg-[#04080f]/95 px-5 py-10 text-center text-sm text-white/55">
            No agents match this filter yet.
          </div>
        )}
      </div>

      <BattlesCarouselSection
        isLoading={myAgentsQ.isLoading || waitingForArenaSession || battlesQ.isLoading}
        isError={battlesQ.isError}
        memories={battlesQ.data ?? []}
        battlesById={battlesById}
        agentsById={agentsById}
      />

      <div className="arena-panel flex flex-wrap items-center justify-between gap-3 border-white/8 bg-[#04080f]/95 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-400">
            <Info className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-tech text-[10px] font-bold uppercase tracking-wider text-white">
              Your AI agents are your digital assets.
            </h4>
            <p className="text-[9px] font-semibold leading-none text-white/40">
              Live roster data is now pulled from AI Arena while the page keeps the same layout.
            </p>
          </div>
        </div>
        <Link
          to="/ai-arena"
          className="flex items-center gap-1.5 rounded border border-white/8 bg-[#0a0f1b]/60 px-5 py-2.5 font-tech text-[9px] font-bold uppercase tracking-wider text-purple-400 transition hover:border-purple-500/35 hover:bg-purple-950/10"
        >
          <span>OPEN AI ARENA</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ArenaAgentWalletManagerModal
        open={walletModalOpen}
        onOpenChange={setWalletModalOpen}
        agents={agents}
        agentsLoading={myAgentsQ.isLoading || waitingForArenaSession}
        initialAgentId={walletAgentId}
        onCreateAgent={() => openCreateAgent()}
      />

      <AiArenaAgentDetailModal
        open={!!detailAgent}
        onOpenChange={(open) => { if (!open) setDetailAgent(null); }}
        agent={detailAgent}
      />
    </ArenaPageLayout>
  );
};

export default MyAgentsPage;
