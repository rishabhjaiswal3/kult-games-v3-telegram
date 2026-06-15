import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Box,
  ArrowUp,
  Swords,
  Globe,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowRight,
  Sparkles,
  Loader2,
  BrainCircuit,
  BriefcaseBusiness,
  Gamepad2,
  Trophy,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { aiArenaGatewayApi } from "@/api/aiArenaGatewayApi";
import { ArenaBattleBoardCard } from "@/components/arena/ArenaBattleBoardCard";
import { ArenaLiveMatchProvider, useArenaLiveMatch } from "@/contexts/ArenaLiveMatchContext";
import { ArenaMatchStatusModal } from "@/components/arena/ArenaMatchStatusModal";
import { ArenaStartMatchmakingModal } from "@/components/arena/ArenaStartMatchmakingModal";
import { ArenaBattleBoardGridSkeleton } from "@/components/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useArenaBattleBoard } from "@/hooks/useArenaBattleBoard";
import { useAiArenaGatewaySession } from "@/hooks/useAiArenaGatewaySession";
import { useMyArenaAgents } from "@/hooks/useMyArenaAgents";
import { getTrackedAiArenaBattleId, saveTrackedAiArenaBattleId } from "@/lib/arenaBattleStorage";
import heroVideo from "@/assets/hero-video.mp4";
import zeroGLogo from "@/assets/0G Logo.png";
import kultLogo from "@/assets/Kult Logo.png";
import agentNexus from "@/assets/hybrid.mp4";
import agentShadow from "@/assets/defender.mp4";
import agentAegis from "@/assets/tactician.mp4";
import agentVoid from "@/assets/support.mp4";
import agentRage from "@/assets/berserker.mp4";
import agentLumen from "@/assets/assassin.gif";
import iconTrain from "@/assets/icon-train.png";
import iconBattle from "@/assets/icon-battle.png";
import iconEarn from "@/assets/icon-earn.png";
import iconOwn from "@/assets/Own.png";
import sceneVideo from "@/assets/Scene 1.mp4";
import type { AiArenaAgent } from "@/types/aiArenaGateway";
import { RANKS } from "@/utils/rankSystem";
const agents = [
  {
    rank: "01",
    name: "HYBRID",
    chain: "Zerog",
    tier: "Legendary",
    lvl: 12,
    power: "14,850",
    img: agentNexus,
    color: "var(--neon)",
  },
  {
    rank: "02",
    name: "DEFENDER",
    chain: "Base",
    tier: "Epic",
    lvl: 11,
    power: "13,420",
    img: agentShadow,
    color: "var(--lime)",
  },
  {
    rank: "03",
    name: "TACTICIAN",
    chain: "Solana",
    tier: "Epic",
    lvl: 12,
    power: "12,980",
    img: agentAegis,
    color: "var(--cyan)",
  },
  {
    rank: "04",
    name: "SUPPORT",
    chain: "Zerog",
    tier: "Epic",
    lvl: 11,
    power: "12,150",
    img: agentVoid,
    color: "var(--neon-2)",
  },
  {
    rank: "05",
    name: "BERSERKER",
    chain: "Base",
    tier: "Legendary",
    lvl: 12,
    power: "11,870",
    img: agentRage,
    color: "var(--amber)",
  },
  {
    rank: "06",
    name: "ASSASSIN",
    chain: "Solana",
    tier: "Epic",
    lvl: 11,
    power: "10,940",
    img: agentLumen,
    color: "var(--magenta)",
  },
];

function ZeroGLogo({ className = "h-4 w-auto" }: { className?: string }) {
  return (
    <img
      src={zeroGLogo}
      alt="0G"
      loading="lazy"
      width={483}
      height={234}
      className={`inline-block object-contain ${className}`}
    />
  );
}

function KultLogo({ className = "h-4 w-auto" }: { className?: string }) {
  return (
    <img
      src={kultLogo}
      alt="Kult Games"
      loading="lazy"
      width={929}
      height={325}
      className={`inline-block object-contain ${className}`}
    />
  );
}

function ChainLogo({ name, className = "h-3.5 w-auto" }: { name: string; className?: string }) {
  if (name.toLowerCase() === "0g" || name.toLowerCase() === "og") {
    return <ZeroGLogo className={className} />;
  }

  return <span>{name}</span>;
}

function shortBattleId(value?: string | null) {
  if (!value) return "—";
  if (value.length <= 14) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

const AIArenaPage = () => {
  return (
    <ArenaLiveMatchProvider>
      <AIArenaPageContent />
    </ArenaLiveMatchProvider>
  );
};

export default AIArenaPage;

function AIArenaPageContent() {
  return (
    <div className="min-h-full text-foreground bg-background min-w-0 mx-auto w-full px-4 py-5 sm:px-6 lg:px-8 max-w-full">
      <Hero />
      <StatsBar />
      <FeaturesBlock />
      <HowItWorks />
      <RankProgressionTimeline />
      <TopAgents />
      <LiveBattles />
      <PartnersBlock />
      <ArenaLandingFooter />
    </div>
  );
}

function Logo({
  size = "text-2xl",
  hideAttributionOnMobile = false,
}: {
  size?: string;
  hideAttributionOnMobile?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col leading-none">
      <span className={`font-display ${size} text-gradient glow-text`}>AI ARENA</span>
      <span
        className={`flex-wrap items-center gap-1.5 sm:gap-2 text-[8px] sm:text-[9px] tracking-[0.18em] sm:tracking-[0.3em] text-muted-foreground font-tech mt-1 ${hideAttributionOnMobile ? "hidden md:flex" : "flex"}`}
      >
        PRESENTED BY <KultLogo className="h-3.5 w-auto" />
      </span>
      <span
        className={`flex-wrap items-center gap-1.5 sm:gap-2 text-[8px] sm:text-[9px] tracking-[0.18em] sm:tracking-[0.3em] text-muted-foreground font-tech mt-1 ${hideAttributionOnMobile ? "hidden md:flex" : "flex"}`}
      >
        POWERED BY <ZeroGLogo className="h-3.5 w-auto" />
      </span>
    </div>
  );
}

function HeroCopy({ compact = false }: { compact?: boolean }) {
  const { login, isAuthenticated } = useAuth();

  return (
    <div className={compact ? "mx-auto max-w-sm text-center" : "max-w-xl"}>
      <span className="inline-block px-2.5 py-0.5 text-[8px] sm:text-[9px] tracking-[0.22em] sm:tracking-[0.3em] font-tech border border-primary/40 text-primary rounded-sm mb-3 md:mb-5">
        BUILT FOR WEB3
      </span>
      <h1
        className={`font-tech font-black uppercase leading-[0.95] tracking-tight text-white ${compact ? "text-4xl min-[380px]:text-5xl min-[420px]:text-6xl" : "text-4xl sm:text-5xl lg:text-6xl"}`}
      >
        AI{compact ? " " : <br />}ARENA
      </h1>
      <h2
        className={`font-display mt-3 md:mt-5 text-foreground/90 ${compact ? "text-lg min-[380px]:text-xl leading-tight" : "text-xl sm:text-2xl md:text-3xl"}`}
      >
        Where AI
        <br />
        Agents Battle
        <br />
        For {" "}
        <span className="underline decoration-accent decoration-4 underline-offset-4">
          Supremacy
        </span>
      </h2>
      <p className="mt-4 md:mt-5 text-xs md:text-sm text-muted-foreground max-w-md">
        Collect, train, and battle unique AI Agents.
        <br />
        Own your journey. Rule the Arena.
      </p>
      <div
        className={
          compact
            ? "mt-6 flex flex-col items-center gap-2.5"
            : "mt-8 flex flex-col items-start gap-3"
        }
      >
        {isAuthenticated ? (
          <></>
          // <Link
          //   to="/dashboard"
          //   className={`btn-primary min-w-0 rounded-md font-tech flex items-center justify-center whitespace-nowrap ${
          //     compact
          //       ? "w-[240px] px-4 py-3 text-[10px] tracking-[0.08em] gap-1.5"
          //       : "w-[240px] lg:w-auto px-7 py-3.5 text-xs tracking-[0.2em] gap-3"
          //   }`}
          // >
          //   <span className="leading-tight text-center whitespace-nowrap">OPEN DASHBOARD</span>{" "}
          //   <ArrowUpRight className="w-3.5 h-3.5 shrink-0 md:w-4 md:h-4" />
          // </Link>
        ) : (
          <button
            type="button"
            onClick={login}
            className={`btn-primary min-w-0 rounded-md font-tech flex items-center justify-center whitespace-nowrap ${
              compact
                ? "w-[240px] px-4 py-3 text-[10px] tracking-[0.08em] gap-1.5"
                : "w-[240px] lg:w-auto px-7 py-3.5 text-xs tracking-[0.2em] gap-3"
            }`}
          >
            <span className="leading-tight text-center whitespace-nowrap">CONNECT WALLET</span>{" "}
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0 md:w-4 md:h-4" />
          </button>
        )}
        {/* <Link
          to="/my-agents"
          className={`min-w-0 rounded-md font-tech border border-primary/40 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 hover:border-primary/80 text-white flex items-center justify-center transition shadow-[0_0_15px_rgba(143,39,255,0.15)] hover:shadow-[0_0_25px_rgba(143,39,255,0.35)] whitespace-nowrap ${
            compact
              ? "w-[240px] px-4 py-3 text-[10px] tracking-[0.06em] gap-2"
              : "w-[240px] lg:w-auto px-5 py-3 text-[10.5px] tracking-[0.18em] gap-2"
          }`}
        >
          <Box className="w-3 h-3 shrink-0 md:w-3.5 md:h-3.5 text-accent" />{" "}
          <span className="leading-tight text-center font-bold whitespace-nowrap">MY AGENTS</span>
        </Link> */}
        <ArenaHeroMatchmakingAction compact={compact} />
      </div>
    </div>
  );
}

function ArenaHeroMatchmakingAction({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { isAiArenaReady } = useAiArenaGatewaySession();
  const { setActiveBattleId } = useArenaLiveMatch();
  const myAgentsQ = useMyArenaAgents(1, 50);
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [statusModalAgent, setStatusModalAgent] = useState<AiArenaAgent | null>(null);
  const [trackedBattleId, setTrackedBattleId] = useState(() => getTrackedAiArenaBattleId());
  // Always start null so the first match found in this session always triggers navigation,
  // even if the same battle is still active in Redis after a page refresh.
  const announcedBattleIdRef = useRef<string | null>(null);
  // Captures the gameId the user explicitly selected when they started matchmaking.
  // This is the source of truth for routing — more reliable than polling status.gameId.
  const selectedGameIdRef = useRef<string>("default");

  const agents = myAgentsQ.data?.agents ?? [];

  const queueQ = useQuery({
    queryKey: ["aiArenaGateway", "landingMatchmakingStatus", agents.map((agent) => agent.id).join(",")],
    queryFn: async () =>
      Promise.all(
        agents.map(async (agent) => {
          try {
            const statusRes = await aiArenaGatewayApi.getMatchmakingStatus(agent.id);
            return { agent, status: statusRes.status };
          } catch {
            return { agent, status: null };
          }
        })
      ),
    enabled: isAiArenaReady && agents.length > 0,
    staleTime: 2_000,
    refetchInterval: 2_000,
    retry: 1,
  });

  const queuedAgent = useMemo(
    () => queueQ.data?.find((row) => row.status?.inQueue)?.agent ?? null,
    [queueQ.data]
  );

  const leaveQueueMut = useMutation({
    mutationFn: async (agentId: string) => aiArenaGatewayApi.leaveMatchmakingQueue(agentId),
    onSuccess: async () => {
      toast.success("Left matchmaking queue");
      setStatusModalAgent(null);
      await queueQ.refetch();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not leave queue");
    },
  });

  const buttonLabel = !isAuthenticated
    ? "START MATCHMAKING"
    : agents.length > 0
      ? "START MATCHMAKING"
      : "CREATE AGENT TO MATCH";

  const helperText = !isAuthenticated
    ? "Connect your wallet to unlock AI Arena matchmaking."
    : !isAiArenaReady
      ? "Syncing your AI Arena session..."
      : myAgentsQ.isLoading
        ? "Loading your fighters..."
        : agents.length > 0
          ? "Queue one of your agents into the live arena lobby."
          : "Create an AI Arena agent first, then you can queue it here.";

  const startButtonDisabled =
    isAuthenticated &&
    agents.length > 0 &&
    (!isAiArenaReady || myAgentsQ.isLoading || !!queuedAgent);

  const handleArenaAction = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    if (agents.length === 0) {
      navigate("/my-agents");
      return;
    }
    setStartModalOpen(true);
  };

  const handleMatchFound = (payload: {
    agent: AiArenaAgent;
    opponent: AiArenaAgent;
    battleId: string;
    mode: string;
    gameId: string;
  }) => {
    saveTrackedAiArenaBattleId(payload.battleId);
    setActiveBattleId(payload.battleId);
    setTrackedBattleId(payload.battleId);
    if (announcedBattleIdRef.current !== payload.battleId) {
      announcedBattleIdRef.current = payload.battleId;
      toast.success(`Match found! Entering arena…`);
      setStatusModalAgent(null);

      const base = `myAgentId=${encodeURIComponent(payload.agent.id)}&opponentId=${encodeURIComponent(payload.opponent.id)}&mode=${encodeURIComponent(payload.mode)}`;

      // Priority: ref (current session) → sessionStorage (survives refresh) → payload → default
      let gameId = selectedGameIdRef.current;
      if (!gameId || gameId === "default") {
        try { gameId = sessionStorage.getItem("arena_queued_game_id") || "default"; } catch { gameId = "default"; }
      }
      if (!gameId || gameId === "default") gameId = payload.gameId || "default";

      if (gameId === "robowar") {
        navigate(`/arena/robowar/${payload.battleId}?${base}`);
      } else {
        navigate(`/arena/game/${payload.battleId}?${base}`);
      }
    }
  };

  useEffect(() => {
    if (trackedBattleId) {
      setActiveBattleId(trackedBattleId);
    }
  }, [trackedBattleId, setActiveBattleId]);

  return (
    <>
      <button
        type="button"
        onClick={handleArenaAction}
        disabled={startButtonDisabled}
        className={`min-w-0 rounded-md font-tech border border-accent/45 bg-gradient-to-r from-accent/12 to-primary/12 hover:from-accent/20 hover:to-primary/20 hover:border-accent/75 text-white flex items-center justify-center transition shadow-[0_0_15px_rgba(0,210,255,0.12)] hover:shadow-[0_0_25px_rgba(0,210,255,0.28)] whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60 ${
          compact
            ? "w-[240px] px-4 py-3 text-[10px] tracking-[0.06em] gap-2"
            : "w-[240px] lg:w-auto px-5 py-3 text-[10.5px] tracking-[0.18em] gap-2"
        }`}
      >
        {startButtonDisabled && !queuedAgent ? (
          <Loader2 className="w-3 h-3 shrink-0 md:w-3.5 md:h-3.5 animate-spin text-accent" />
        ) : (
          <Swords className="w-3 h-3 shrink-0 md:w-3.5 md:h-3.5 text-accent" />
        )}
        <span className="leading-tight text-center font-bold whitespace-nowrap">{buttonLabel}</span>
      </button>

      {queuedAgent ? (
        <div
          className={`text-muted-foreground ${compact ? "max-w-[240px] text-center text-[11px]" : "max-w-md text-left text-xs"}`}
        >
          <p>
            {queuedAgent.name} is already live in the arena lobby. Keep this queue running and open
            the live match modal any time.
          </p>
          <button
            type="button"
            onClick={() => setStatusModalAgent(queuedAgent)}
            className="mt-2 inline-flex items-center gap-2 font-tech text-[10px] uppercase tracking-[0.16em] text-accent transition hover:text-accent/80"
          >
            <Eye className="h-3.5 w-3.5" />
            Open live match status
          </button>
        </div>
      ) : (
        <p
          className={`text-muted-foreground ${compact ? "max-w-[240px] text-center text-[11px]" : "max-w-md text-left text-xs"}`}
        >
          {helperText}
        </p>
      )}

      {trackedBattleId ? (
        <Link
          to={`/arena/game/${trackedBattleId}`}
          className={`min-w-0 rounded-md font-tech border border-white/15 bg-white/5 hover:bg-white/10 text-white/85 flex items-center justify-center transition whitespace-nowrap ${
            compact
              ? "w-[240px] px-4 py-2.5 text-[10px] tracking-[0.06em] gap-2"
              : "w-[240px] lg:w-auto px-4 py-2.5 text-[10px] tracking-[0.16em] gap-2"
          }`}
        >
          <Eye className="w-3 h-3 shrink-0 text-accent" />
          <span className="leading-tight text-center font-bold whitespace-nowrap">
            OPEN LAST BATTLE {shortBattleId(trackedBattleId)}
          </span>
        </Link>
      ) : null}

      <ArenaStartMatchmakingModal
        open={startModalOpen}
        onOpenChange={setStartModalOpen}
        agents={agents}
        defaultAgentId={queuedAgent?.id ?? agents[0]?.id ?? null}
        onQueued={async (agentId, gameId) => {
          selectedGameIdRef.current = gameId ?? "default";
          const queued = agents.find((agent) => agent.id === agentId) ?? null;
          if (queued) setStatusModalAgent(queued);
          await queueQ.refetch();
        }}
      />

      <ArenaMatchStatusModal
        open={!!statusModalAgent}
        onOpenChange={(open) => {
          if (!open) setStatusModalAgent(null);
        }}
        agent={statusModalAgent}
        leaving={leaveQueueMut.isPending}
        onLeave={(agentId) => leaveQueueMut.mutate(agentId)}
        onMatchFound={handleMatchFound}
      />
    </>
  );
}

function Hero() {
  return (
    <section className="arena-panel relative overflow-hidden border border-white/8 bg-[#04080f] min-h-[500px]">
      <div className="absolute inset-0 hidden md:block">
        <video
          aria-hidden
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover object-right"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/65" />
      </div>
      {/* original line kept — bg-black was added intentionally by another dev, commented out to fix black rectangle artifact */}
      {/* <div className="relative md:hidden min-h-[640px] h-[185vw] max-h-[880px] bg-black"> */}
      <div className="relative md:hidden min-h-[640px] h-[185vw] max-h-[880px]">
        <video
          aria-hidden
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover object-top"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-x-0 top-0 h-[56%] bg-gradient-to-b from-black via-black/75 to-transparent" />
        <div className="relative z-10 px-4 sm:px-6 pt-5">
          <div className="flex flex-wrap items-center gap-3 text-[9px] font-tech uppercase tracking-[0.2em] text-white/50 mb-8">
            <span className="flex items-center gap-1.5">
              Presented by <KultLogo className="h-3.5 w-auto" />
            </span>
            <span className="flex items-center gap-1.5">
              Powered by <ZeroGLogo className="h-3.5 w-auto" />
            </span>
          </div>
          <HeroCopy compact />
        </div>
      </div>
      <div className="relative mx-auto hidden md:flex md:flex-col px-6 pt-8 pb-32 min-h-[680px] justify-center">
        <div className="flex flex-wrap items-center gap-3 text-[9px] font-tech uppercase tracking-[0.2em] text-white/50 mb-8">
          <span className="flex items-center gap-1.5">
            Presented by <KultLogo className="h-3.5 w-auto" />
          </span>
          <span className="flex items-center gap-1.5">
            Powered by <ZeroGLogo className="h-3.5 w-auto" />
          </span>
        </div>
        <HeroCopy />
      </div>
    </section>
  );
}

function StatsBar() {
  const totalAgentsQ = useQuery({
    queryKey: ["aiArenaGateway", "landingTotalAgents"],
    queryFn: () => aiArenaGatewayApi.listAgents(1, 1),
    staleTime: 60_000,
    retry: 1,
  });

  const totalAgentsDisplay = totalAgentsQ.isLoading
    ? "…"
    : totalAgentsQ.data?.total != null
      ? totalAgentsQ.data.total.toLocaleString()
      : "—";

  const stats = [
    { icon: Box, label: "TOTAL AGENTS", value: totalAgentsDisplay, c: "var(--neon)" },
    { icon: Swords, label: "BATTLES TODAY", value: "24,891", c: "var(--cyan)" },
    { icon: TrendingUp, label: "TOTAL PRIZE POOL", value: "$2,451,891", c: "var(--amber)" },
    { icon: Sparkles, label: "ACTIVE USERS", value: "12,450", c: "var(--lime)" },
  ];
  return (
    <section className="mx-auto px-4 sm:px-6 -mt-4 md:-mt-6 relative z-10 text-center md:text-left">
      <div className="card-glass rounded-xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <div className="flex items-center justify-center md:justify-start gap-3 border-b md:border-b-0 md:border-r border-border/50 pb-4 md:pb-0 md:pr-4 sm:col-span-2 md:col-span-1">
          <div className="w-10 h-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center p-2">
            <ZeroGLogo className="h-6 w-auto" />
          </div>
          <div>
            <div className="text-[10px] tracking-[0.2em] text-muted-foreground font-tech">
              POWERED BY
            </div>
            <ZeroGLogo className="mt-1 h-4 w-auto" />
          </div>
        </div>
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex min-w-0 items-center justify-center md:justify-start gap-3"
          >
            <s.icon
              className="w-5 h-5 sm:w-6 sm:h-6 shrink-0"
              style={{ color: `oklch(from ${s.c} l c h)` }}
            />
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[10px] tracking-[0.14em] sm:tracking-[0.2em] text-muted-foreground font-tech">
                {s.label}
              </div>
              <div className="font-tech text-base sm:text-lg break-words">{s.value}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturesBlock() {
  const features = [
    {
      icon: Box,
      title: "OWN YOUR AI",
      desc: "Each AI Agent is an NFT that you truly own.",
      c: "var(--neon)",
    },
    {
      icon: ArrowUp,
      title: "TRAIN & EVOLVE",
      desc: "Train, upgrade and evolve your agent to unlock their full potential.",
      c: "var(--neon-2)",
    },
    {
      icon: Swords,
      title: "BATTLE & EARN",
      desc: "Compete in battles, climb the ranks and earn massive rewards.",
      c: "var(--amber)",
    },
    {
      icon: Globe,
      title: "BUILT ON",
      partner: "0G",
      desc: "Ultra-fast, scalable infrastructure for the next era of AI gaming.",
      c: "var(--lime)",
    },
  ];
  return (
    <section className="mx-auto px-4 sm:px-6 py-14 sm:py-16 lg:py-20 text-center lg:text-left">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)_minmax(0,1fr)] gap-5 sm:gap-6">
        <div>
          <span className="text-[10px] tracking-[0.24em] sm:tracking-[0.3em] font-tech text-accent">
            BUILT DIFFERENT
          </span>
          <h3 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">
            THE NEXT ERA
            <br />
            OF <span className="text-gradient">AI GAMING</span>
          </h3>
          <p className="text-sm text-muted-foreground mt-4">
            AI Arena is the ultimate battleground for AI Agents across Web3. Powered by{" "}
            <ZeroGLogo className="mx-1 h-4 w-auto align-[-0.2em]" />, owned by you.
          </p>
          <Link to="/" className="btn-primary mt-6 mx-auto lg:mx-0 px-5 py-2.5 rounded-md font-tech text-xs tracking-[0.2em] inline-flex items-center gap-2 w-max">
            LEARN MORE <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="card-glass rounded-xl p-4 sm:p-5 transition text-center md:text-left"
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto md:mx-0"
                style={{
                  background: `oklch(from ${f.c} l c h / 0.15)`,
                  border: `1px solid oklch(from ${f.c} l c h / 0.4)`,
                }}
              >
                <f.icon className="w-6 h-6" style={{ color: `oklch(from ${f.c} l c h)` }} />
              </div>
              <h4
                className="font-tech text-xs sm:text-sm tracking-wider mb-2 flex flex-wrap items-center justify-center md:justify-start gap-2"
                style={{ color: `oklch(from ${f.c} l c h)` }}
              >
                {f.title}
                {"partner" in f && f.partner === "0G" && <ZeroGLogo className="h-4 w-auto" />}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="card-glass rounded-xl p-4 sm:p-5 text-center lg:text-left">
          <div className="text-[10px] tracking-[0.3em] font-tech text-muted-foreground">
            $ARENA TOKEN
          </div>
          <div className="font-display text-2xl text-accent mt-1 glow-text">FUEL THE ARENA</div>
          <p className="text-xs text-muted-foreground mt-3">
            The native token of AI Arena. Use it to play, earn, govern and own the future.
          </p>
          <div className="text-[10px] tracking-[0.3em] font-tech text-muted-foreground mt-5">
            $ARENA PRICE
          </div>
          <div className="flex items-end gap-2 mt-1">
            <span className="font-tech text-3xl">1.00</span>
            <span className="text-xs text-lime-400" style={{ color: "oklch(0.82 0.22 145)" }}>
              +4.35%
            </span>
          </div>
          <div className="mt-3 h-10 relative">
            <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
              <polyline
                points="0,25 15,22 30,24 45,18 60,20 75,12 90,8 100,4"
                fill="none"
                stroke="oklch(0.7 0.28 320)"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <button className="btn-primary w-full mt-4 px-5 py-2.5 rounded-md font-tech text-xs tracking-[0.2em] flex items-center justify-center gap-2">
            VIEW TOKEN <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "CREATE",
      desc: "Create your AI Agent and choose its path.",
      img: agentNexus,
    },
    {
      n: "02",
      title: "TRAIN",
      desc: "Train and evolve your agent to make it stronger.",
      img: iconTrain,
    },
    {
      n: "03",
      title: "BATTLE",
      desc: "Enter the Arena and battle players worldwide.",
      img: iconBattle,
    },
    {
      n: "04",
      title: "EARN",
      desc: "Win battles, earn rewards and climb the leaderboard.",
      img: iconEarn,
    },
    { n: "05", title: "OWN", desc: "Your AI. Your NFT. Your legacy.", img: iconOwn },
  ];
  return (
    <section className="mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
        <div className="h-px flex-1 max-w-20 bg-gradient-to-r from-transparent to-primary" />
        <h3 className="font-display text-2xl sm:text-3xl text-center">HOW IT WORKS</h3>
        <div className="h-px flex-1 max-w-20 bg-gradient-to-l from-transparent to-primary" />
      </div>
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-5 gap-3 items-stretch">
        {steps.map((s, i) => (
          <div key={s.n} className="relative">
            <div className="card-glass rounded-xl overflow-hidden h-full flex flex-col">
              <div className="aspect-square overflow-hidden bg-background/50">
                {s.img.endsWith(".mp4") ? (
                  <video
                    src={s.img}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={s.img}
                    alt={s.title}
                    loading="lazy"
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="p-4 text-center md:text-left">
                <div className="font-display text-xl text-primary glow-text">{s.n}</div>
                <div className="font-tech text-sm mt-2 tracking-wider break-words">{s.title}</div>
                <p className="text-xs text-muted-foreground mt-2">{s.desc}</p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className="hidden md:block absolute top-1/3 -right-2 w-5 h-5 text-primary z-10" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function RankProgressionTimeline() {
  return (
    <section className="mx-auto px-4 sm:px-6 py-12 sm:py-20">
      {/* Header */}
      <div className="text-center mb-10 sm:mb-14">
        <span className="inline-block px-3 py-1 text-[9px] sm:text-[10px] tracking-[0.22em] sm:tracking-[0.3em] font-tech border border-primary/40 text-primary rounded-sm mb-4">
          COMPETITIVE PROGRESSION
        </span>
        <h3 className="font-display text-2xl sm:text-3xl md:text-4xl mt-2">
          HOW A <span className="text-gradient glow-text">LEAGUE</span> WORKS
        </h3>
        <p className="text-sm text-muted-foreground mt-4 max-w-xl mx-auto leading-relaxed">
          Every AI Agent earns ELO through battle victories. Climb from{" "}
          <span className="text-[#22c55e] font-tech text-xs">INITIATE</span> all the way to{" "}
          <span className="text-[#818cf8] font-tech text-xs">SINGULARITY PRIME</span> — the apex of autonomous combat.
        </p>
      </div>

      {/* Connector line (desktop only) */}
      <div className="relative">
        <div className="absolute top-[52px] left-[6%] right-[6%] h-px hidden md:block"
          style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.25) 15%, rgba(139,92,246,0.4) 50%, rgba(129,140,248,0.25) 85%, transparent)" }}
        />

        {/* Rank cards grid */}
        <div className="grid grid-cols-2 min-[500px]:grid-cols-4 md:grid-cols-8 gap-3 sm:gap-4">
          {RANKS.map((rank, i) => (
            <div
              key={rank.tier}
              className="group relative flex flex-col items-center text-center"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Tier node */}
              <div
                className="relative z-10 flex h-[100px] w-[100px] sm:h-[108px] sm:w-[108px] items-center justify-center rounded-full transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-105"
                style={{
                  background: `radial-gradient(circle at 40% 35%, ${rank.color}22, ${rank.color}08 60%, transparent)`,
                  border: `1px solid ${rank.color}35`,
                  boxShadow: `0 0 0 0 ${rank.color}00`,
                }}
              >
                {/* Inner glow ring on hover */}
                <div
                  className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ boxShadow: `0 0 24px 4px ${rank.color}30, inset 0 0 16px 2px ${rank.color}18` }}
                />
                <img
                  src={rank.image}
                  alt={rank.name}
                  className="h-[68px] w-[68px] sm:h-[76px] sm:w-[76px] object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
                  style={{ filter: `drop-shadow(0 0 8px ${rank.color}55)` }}
                />
                {/* Tier number badge */}
                <div
                  className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center font-tech text-[9px] font-bold"
                  style={{ background: rank.color, color: "#000", boxShadow: `0 0 8px ${rank.color}80` }}
                >
                  {rank.tier}
                </div>
              </div>

              {/* Arrow connector (desktop) */}
              {i < RANKS.length - 1 && (
                <div
                  className="absolute top-[50px] -right-2 z-20 hidden md:flex h-5 w-4 items-center justify-center text-white/20 group-hover:text-white/45 transition-colors duration-300"
                  style={{ fontSize: "10px" }}
                >
                  ›
                </div>
              )}

              {/* Name & ELO */}
              <div className="mt-3 space-y-0.5">
                <div
                  className="font-tech text-[9px] sm:text-[10px] font-bold tracking-widest uppercase leading-tight"
                  style={{ color: rank.color, textShadow: `0 0 8px ${rank.color}60` }}
                >
                  {rank.shortName}
                </div>
                <div className="text-[8px] sm:text-[9px] text-white/35 font-mono leading-tight">
                  {rank.minElo === 0 ? "0" : rank.minElo >= 1000 ? `${(rank.minElo / 1000).toFixed(0)}K` : rank.minElo}
                  {rank.maxElo != null
                    ? ` – ${rank.maxElo >= 1000 ? `${(rank.maxElo / 1000).toFixed(0)}K` : rank.maxElo}`
                    : "+"}
                </div>
                <div className="text-[7px] sm:text-[8px] text-white/20 font-tech uppercase tracking-wider">
                  ELO
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info cards row */}
      <div className="mt-10 sm:mt-14 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="card-glass rounded-xl p-4 sm:p-5 text-center sm:text-left">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 mx-auto sm:mx-0"
            style={{ background: "oklch(from var(--neon) l c h / 0.15)", border: "1px solid oklch(from var(--neon) l c h / 0.4)" }}>
            <Swords className="w-5 h-5" style={{ color: "var(--neon)" }} />
          </div>
          <h4 className="font-tech text-xs tracking-wider mb-2" style={{ color: "var(--neon)" }}>
            WIN TO CLIMB
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Each battle win grants ELO points. The stronger your opponent, the more ELO you earn. Losses deduct ELO — protect your rank.
          </p>
        </div>
        <div className="card-glass rounded-xl p-4 sm:p-5 text-center sm:text-left">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 mx-auto sm:mx-0"
            style={{ background: "oklch(from var(--cyan) l c h / 0.15)", border: "1px solid oklch(from var(--cyan) l c h / 0.4)" }}>
            <ArrowUp className="w-5 h-5" style={{ color: "var(--cyan)" }} />
          </div>
          <h4 className="font-tech text-xs tracking-wider mb-2" style={{ color: "var(--cyan)" }}>
            ELO MATCHMAKING
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The arena matches you against agents of similar ELO. Climb through 8 distinct leagues, each with its own badge and prestige.
          </p>
        </div>
        <div className="card-glass rounded-xl p-4 sm:p-5 text-center sm:text-left">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 mx-auto sm:mx-0"
            style={{ background: "oklch(from var(--amber) l c h / 0.15)", border: "1px solid oklch(from var(--amber) l c h / 0.4)" }}>
            <Trophy className="w-5 h-5" style={{ color: "var(--amber)" }} />
          </div>
          <h4 className="font-tech text-xs tracking-wider mb-2" style={{ color: "var(--amber)" }}>
            LEAGUE REWARDS
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Higher leagues unlock greater $ARENA rewards per battle. Reach Singularity Prime and earn the ultimate on-chain legacy.
          </p>
        </div>
      </div>
    </section>
  );
}

function TopAgents() {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    const scroller = ref.current;
    if (!scroller) return;

    const firstCard = scroller.firstElementChild as HTMLElement | null;
    const gap = 16;
    const amount = firstCard ? firstCard.offsetWidth + gap : Math.max(scroller.clientWidth / 5, 260);

    scroller.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  useEffect(() => {
    const scroller = ref.current;
    if (!scroller) return;

    const interval = window.setInterval(() => {
      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
      const firstCard = scroller.firstElementChild as HTMLElement | null;
      const gap = 16;
      const amount = firstCard ? firstCard.offsetWidth + gap : Math.max(scroller.clientWidth / 5, 260);
      const nextLeft = scroller.scrollLeft + amount;

      scroller.scrollTo({
        left: nextLeft >= maxScrollLeft - 8 ? 0 : nextLeft,
        behavior: "smooth",
      });
    }, 3500);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 text-center sm:text-left">
        <h3 className="font-display text-2xl sm:text-3xl">TOP AI AGENTS</h3>
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <Link to="/my-agents" className="text-sm text-accent hover:underline">
            View All
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => scroll(-1)}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:border-primary"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll(1)}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:border-primary"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 scrollbar-none"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {agents.map((a) => (
          <div
            key={a.name}
            className="card-glass group min-w-[86vw] snap-start overflow-hidden rounded-xl cursor-pointer min-[420px]:min-w-[calc((100%-1rem)/2)] md:min-w-[calc((100%-2rem)/3)] lg:min-w-[calc((100%-4rem)/5)]"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              {a.img.endsWith(".mp4") ? (
                <video
                  src={a.img}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              ) : (
                <img
                  src={a.img}
                  alt={a.name}
                  loading="lazy"
                  width={640}
                  height={800}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <div
                className="absolute top-3 left-3 px-2.5 py-1 rounded-md font-tech text-xs"
                style={{
                  background: `oklch(from ${a.color} l c h / 0.2)`,
                  color: `oklch(from ${a.color} l c h)`,
                  border: `1px solid oklch(from ${a.color} l c h / 0.5)`,
                }}
              >
                {a.rank}
              </div>
            </div>
            <div className="p-4 text-center sm:text-left">
              <div className="flex items-start justify-center sm:justify-between gap-2 mb-1">
                <span className="font-tech text-sm min-w-0 break-words">{a.name}</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-sm font-tech"
                  style={{
                    background:
                      a.tier === "Legendary"
                        ? "oklch(0.78 0.18 75 / 0.2)"
                        : "oklch(0.62 0.25 295 / 0.2)",
                    color: a.tier === "Legendary" ? "oklch(0.85 0.18 75)" : "oklch(0.75 0.25 300)",
                  }}
                >
                  {a.tier}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                <ChainLogo name={a.chain} className="h-3.5 w-auto" />
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50 text-xs font-tech">
                <span className="text-muted-foreground">LV. {a.lvl}</span>
                <span className="flex items-center gap-1">
                  <Swords className="w-3 h-3 text-accent" />
                  {a.power}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LiveBattles() {
  const battleBoardQ = useArenaBattleBoard({ maxRankedPairs: 6 });
  const previewItems = battleBoardQ.items.slice(0, 3);

  return (
    <section className="mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 text-center sm:text-left">
        <h3 className="font-display text-2xl sm:text-3xl">LIVE BATTLES</h3>
        <Link to="/battles" className="text-sm text-accent hover:underline">
          View All Battles
        </Link>
      </div>
      {battleBoardQ.isLoading && previewItems.length === 0 ? (
        <ArenaBattleBoardGridSkeleton count={3} />
      ) : previewItems.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {previewItems.map((item) => (
            <ArenaBattleBoardCard
              key={item.id}
              item={item}
              actionLabel={item.kind === "ranked" ? "Watch Live" : "View Battle"}
              actionTo={item.kind === "ranked" ? `/arena/game/${item.id}` : "/battles"}
            />
          ))}
        </div>
      ) : (
        <div className="card-glass rounded-xl px-5 py-8 text-sm text-muted-foreground">
          No live arena battles or open lobbies are available right now.
        </div>
      )}
    </section>
  );
}

function PartnersBlock() {
  const partners = ["0G", "Base", "Solana"];
  return (
    <section className="mx-auto px-4 sm:px-6 py-10 sm:py-12">
      <div className="card-glass rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative grid md:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-5 sm:gap-6">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="text-[10px] tracking-[0.3em] font-tech text-muted-foreground">
              POWERED BY
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center p-2">
              <ZeroGLogo className="h-6 w-auto" />
            </div>
          </div>
          <div className="font-display text-2xl md:text-3xl text-center leading-tight">
            BUILDING THE FUTURE
            <br />
            OF AI GAMING <span className="text-accent">TOGETHER</span>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center md:justify-end">
            {partners.map((p) => (
              <div
                key={p}
                className="px-3 py-2 rounded-md border border-border bg-card/50 font-tech text-xs flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-accent" />
                <ChainLogo name={p} className="h-3.5 w-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ArenaLandingFooter() {
  const platformLinks = [
    { label: "Games", href: "/", icon: Gamepad2 },
    { label: "Inventory", href: "/inventory", icon: BriefcaseBusiness },
    { label: "AI Arena", href: "/ai-arena", icon: BrainCircuit },
    { label: "Moments", href: "/moments", icon: Video },
    { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  ];

  const socials = [
    {
      key: "x",
      label: "X",
      href: "https://x.com/_KultGames",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      key: "discord",
      label: "Discord",
      href: "https://discord.com/invite/Cge7rrCyUB",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.001.024.017.043.037.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      ),
    },
    {
      key: "telegram",
      label: "Telegram",
      href: "https://t.me/KultGamesOfficial",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="arena-panel relative mt-20 mb-6 border border-white/8 bg-[#04080f] overflow-hidden">
      <div className="absolute inset-0 ai-grid-overlay pointer-events-none opacity-[0.09]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(278_100%_74%/0.85)] to-transparent" />
      <div className="pointer-events-none absolute -left-28 top-8 h-56 w-56 rounded-full bg-[hsl(278_100%_60%/0.16)] blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-[hsl(190_100%_55%/0.11)] blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(278_100%_70%/0.12),transparent_34%),linear-gradient(180deg,rgba(7,10,22,0.92),rgba(2,5,12,0.98))]" />

      <div className="container relative mx-auto px-4 sm:px-6">
        <div className="grid gap-8 py-10 lg:grid-cols-[1.15fr_0.85fr_0.7fr] lg:items-center lg:py-12">
          
          {/* Col 1 */}
          <div className="group/brand relative w-full max-w-[390px] overflow-hidden rounded-[1.1rem] border border-[#5a35ff]/38 bg-[linear-gradient(140deg,rgba(31,21,78,0.82),rgba(4,7,18,0.97)_58%)] p-5 shadow-[0_0_34px_rgba(104,62,255,0.16),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-[#8f73ff]/70 hover:shadow-[0_0_48px_rgba(104,62,255,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_6%_0%,rgba(130,91,255,0.28),transparent_32%)] transition duration-300 group-hover/brand:opacity-80" />
            <div className="relative flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
              <div className="flex h-[72px] shrink-0 items-center justify-center gap-5 rounded-lg border border-[hsl(278_100%_70%/0.24)] bg-black/48 px-5 shadow-[0_0_26px_rgba(112,73,255,0.16)] transition duration-300 group-hover/brand:bg-black/65 group-hover/brand:shadow-[0_0_34px_rgba(112,73,255,0.28)]">
                <span className="font-display text-xl text-gradient glow-text whitespace-nowrap transition duration-300 group-hover/brand:scale-105 group-hover/brand:drop-shadow-[0_0_12px_rgba(255,255,255,0.45)]">AI ARENA</span>
              </div>
              <div className="min-w-0">
                <p className="font-tech text-[12px] font-black uppercase leading-[1.5] tracking-[0.22em] text-[#dce5ff] transition duration-300 group-hover/brand:text-white">
                  Presented by Kult Games
                </p>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-white/56 transition duration-300 group-hover/brand:text-white/78">
                  AI Arena is a next-gen AI gaming ecosystem where intelligent agents battle, evolve and dominate.
                </p>
              </div>
            </div>
          </div>

          {/* Col 2 */}
          <nav
            className="group/explore flex flex-col justify-center border-white/8 transition duration-300 hover:border-[#7d5cff]/35 lg:min-h-[168px] lg:border-x lg:px-6"
            aria-label="Footer navigation"
          >
            <p className="mb-5 font-tech text-[12px] font-black uppercase tracking-[0.46em] text-[#a790ff] transition duration-300 group-hover/explore:text-[#d8c7ff] group-hover/explore:drop-shadow-[0_0_10px_rgba(167,144,255,0.55)]">EXPLORE</p>
            <div className="flex flex-wrap gap-3">
              {platformLinks.map((link) => {
                const Icon = link.icon;
                return link.href.startsWith("http") ? (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex h-11 items-center justify-start gap-2.5 rounded-[1.25rem] border border-white/10 bg-black/25 px-4 text-[13px] font-medium text-white/86 shadow-[inset_0_0_0_1px_rgba(130,98,255,0.08)] transition hover:-translate-y-0.5 hover:border-[#7d5cff]/55 hover:bg-[#120d2d] hover:text-white hover:shadow-[0_0_20px_rgba(112,73,255,0.2)]"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[#8b6dff] transition group-hover:scale-110 group-hover:text-[#cbbcff]" />
                    <span className="whitespace-nowrap transition group-hover:text-white">{link.label}</span>
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="group inline-flex h-11 items-center justify-start gap-2.5 rounded-[1.25rem] border border-white/10 bg-black/25 px-4 text-[13px] font-medium text-white/86 shadow-[inset_0_0_0_1px_rgba(130,98,255,0.08)] transition hover:-translate-y-0.5 hover:border-[#7d5cff]/55 hover:bg-[#120d2d] hover:text-white hover:shadow-[0_0_20px_rgba(112,73,255,0.2)]"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[#8b6dff] transition group-hover:scale-110 group-hover:text-[#cbbcff]" />
                    <span className="whitespace-nowrap transition group-hover:text-white">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Col 3 */}
          <div className="group/social flex flex-col justify-center gap-7 lg:min-h-[168px] lg:items-start">
            <div>
              <p className="mb-5 font-tech text-[12px] font-black uppercase tracking-[0.46em] text-[#a790ff] transition duration-300 group-hover/social:text-[#d8c7ff] group-hover/social:drop-shadow-[0_0_10px_rgba(167,144,255,0.55)]">
                FOLLOW
              </p>
              <div className="flex flex-wrap gap-3">
                {socials.map((s) => (
                  <a
                    key={s.key}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-12 w-12 items-center justify-center rounded-full border border-[#6645ff]/48 bg-black/20 text-[#a790ff] transition hover:-translate-y-0.5 hover:border-[#9d86ff] hover:bg-[#140f35] hover:text-white hover:shadow-[0_0_24px_rgba(112,73,255,0.32)]"
                    aria-label={s.label}
                    title={s.label}
                  >
                    <span className="transition-transform group-hover:scale-110">{s.icon}</span>
                  </a>
                ))}
              </div>
            </div>
            
            <div className="group/video relative overflow-hidden rounded-[1.1rem] border border-[#5a35ff]/30 shadow-[0_0_24px_rgba(104,62,255,0.12)] transition duration-300 hover:border-[#8f73ff]/60 hover:shadow-[0_0_36px_rgba(104,62,255,0.25)] hover:-translate-y-1 mt-2 w-full max-w-[250px]">
              <video
                src={sceneVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto object-cover opacity-80 mix-blend-screen transition duration-300 group-hover/video:opacity-100"
              />
            </div>
          </div>
        </div>

        <div className="group/legal flex flex-col items-center justify-between gap-3 border-t border-white/10 py-5 transition duration-300 hover:border-[#7d5cff]/30 sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11px] text-white/42 font-mono">
            <span className="transition group-hover/legal:text-white/68">© 2026 AI Arena</span>
            <span className="text-white/20 transition group-hover/legal:text-[#a790ff]/60">·</span>
            <span className="transition group-hover/legal:text-white/68">Powered by 0G</span>
          </div>
          <span className="text-center text-[9px] font-mono tracking-[0.28em] text-[hsl(278_100%_82%/0.58)] transition group-hover/legal:text-[#d8c7ff]">
            BUILT ON-CHAIN · AI-NATIVE · DECENTRALIZED
          </span>
        </div>
      </div>
    </footer>
  );
}
