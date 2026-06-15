import { useQuery } from "@tanstack/react-query";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Box,
  BrainCircuit,
  Crown,
  Gamepad2,
  Joystick,
  Package,
  Radio,
  Sparkles,
  Store,
  Swords,
  TrendingUp,
  Zap,
} from "lucide-react";
import { gamesApi } from "@/api/gamesApi";
import { momentsApi } from "@/api/momentsApi";
import { useAuth } from "@/contexts/AuthContext";
import { getGameDescription, getGameImage, getGameName } from "@/lib/gameDisplay";
import heroVideo from "@/assets/homebkg.MOV";
import zeroGLogo from "@/assets/0G Logo.png";
import kultLogo from "@/assets/Kult Logo.png";
import agentNexus from "@/assets/hybrid.mp4";
import agentShadow from "@/assets/defender.mp4";
import agentAegis from "@/assets/tactician.mp4";
import agentVoid from "@/assets/support.mp4";
import agentRage from "@/assets/berserker.mp4";
import agentLumen from "@/assets/assassin.gif";
const trailerVideo = new URL("../../assets/Trailer.MOV", import.meta.url).href;

const quickLinks = [
  { label: "Games", path: "/games", icon: Gamepad2, color: "#0089ff" },
  { label: "AI Arena", path: "/ai-arena", icon: Sparkles, color: "#9a35ff" },
  { label: "Inventory", path: "/inventory", icon: Package, color: "#ffc000" },
  { label: "Dashboard", path: "/dashboard", icon: Box, color: "#00f080" },
  { label: "Battles", path: "/battles", icon: Swords, color: "#b338ff" },
  { label: "Leaderboard", path: "/leaderboard", icon: Crown, color: "#f59e0b" },
];

const homeArenaSignals = [
  "HYBRID defeated SUPPORT",
  "Revenge initiated by BERSERKER",
  "ASSASSIN learned new dodge logic",
  "Faction war active in 0G Arena",
];

const homeArenaAgents = [
  { name: "HYBRID", img: agentNexus, stat: "14,850 power" },
  { name: "DEFENDER", img: agentShadow, stat: "flank logic" },
  { name: "TACTICIAN", img: agentAegis, stat: "shield online" },
  { name: "SUPPORT", img: agentVoid, stat: "revenge live" },
  { name: "BERSERKER", img: agentRage, stat: "berserk mode" },
  { name: "ASSASSIN", img: agentLumen, stat: "new tactic" },
];


export function HomePage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const featuredScrollerRef = useRef<HTMLDivElement | null>(null);

  const { data: gamesData, isLoading } = useQuery({
    queryKey: ["games", "all", "home"],
    queryFn: () => gamesApi.getAll(1, 8),
    staleTime: 5 * 60_000,
  });

  const featuredGames = gamesData?.games?.slice(0, 6) ?? [];

  useEffect(() => {
    const scroller = featuredScrollerRef.current;
    if (!scroller || featuredGames.length <= 1) return;

    const interval = window.setInterval(() => {
      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
      const nextLeft = scroller.scrollLeft + scroller.clientWidth * 0.9;

      scroller.scrollTo({
        left: nextLeft >= maxScrollLeft - 8 ? 0 : nextLeft,
        behavior: "smooth",
      });
    }, 3500);

    return () => window.clearInterval(interval);
  }, [featuredGames.length]);

  const handleExploreGames = () => {
    if (isAuthenticated) {
      navigate("/games");
      return;
    }
    navigate("/?login=1");
  };

  return (
    <div className="space-y-6 pb-10">
      <section className="arena-panel relative min-h-[430px] overflow-hidden border-white/8 bg-[#04080f] sm:min-h-[520px] lg:min-h-[560px] xl:min-h-[660px] 2xl:min-h-[780px]">
        <video
          src={heroVideo}
          aria-hidden
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover object-[88%_center] sm:object-[72%_center] scale-[1.15] sm:scale-100 opacity-100 saturate-125 contrast-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050913]/95 via-[#050913]/38 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050913]/25 to-transparent" />
        <div className="relative z-10 flex min-h-[430px] flex-col justify-start gap-8 p-5 sm:min-h-[520px] sm:p-8 lg:min-h-[560px] xl:min-h-[660px] 2xl:min-h-[780px]">
          <div className="flex flex-wrap items-center gap-3 text-[9px] font-tech uppercase tracking-[0.2em] text-white/50">
            <span className="flex items-center gap-1.5">
              Presented by <img src={kultLogo} alt="Kult" className="h-3.5 w-auto object-contain" />
            </span>
            <span className="flex items-center gap-1.5">
              Powered by <img src={zeroGLogo} alt="0G" className="h-3.5 w-auto object-contain" />
            </span>
          </div>
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex rounded border border-[#9f2dff]/50 bg-[#5b1499]/35 px-2 py-0.5 font-tech text-[9px] font-bold uppercase tracking-wider text-[#d773ff]">
              Kult Games
            </span>
            <h1 className="font-tech text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl">
              YOUR
              <br />
              AGENTS
              <br />
              NEVER{" "}
              <br />
              SLEEP
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-white/60">
              One browser for games, agents, rivalries,
              <br />
              and live battles that never stop.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExploreGames}
                className="btn-primary inline-flex items-center gap-2 rounded-md px-6 py-2.5 font-tech text-[10px] font-bold uppercase tracking-wider"
              >
                Explore games
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={isAuthenticated ? () => navigate("/dashboard") : login}
                className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-[#0a0f1b]/60 px-6 py-2.5 font-tech text-[10px] font-bold uppercase tracking-wider text-white/75 transition hover:border-purple-500/35 hover:text-white"
              >
                {isAuthenticated ? "Open dashboard" : "Connect wallet"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="arena-panel home-stats-panel grid grid-cols-2 divide-x divide-white/8 overflow-hidden md:grid-cols-4">
        {[
          { label: "Live games", value: String(gamesData?.games?.length ?? "—"), icon: Joystick, color: "#11a7ff", path: "/games" },
          { label: "AI Arena", value: "Live", icon: BrainCircuit, color: "#a855ff", path: "/ai-arena" },
          { label: "Marketplace", value: "Open", icon: Store, color: "#ffc42e", path: "/inventory" },
          { label: "Battles", value: "24/7", icon: Swords, color: "#00f080", path: "/battles" },
        ].map((stat) => (
          <Link
            key={stat.label}
            to={stat.path}
            className="home-stat-tile relative z-10 flex items-center gap-5 p-5 sm:p-6"
            style={{ "--stat-color": stat.color } as CSSProperties}
          >
            <div
              className="home-stat-icon grid h-14 w-14 place-items-center rounded-lg"
            >
              <stat.icon className="h-7 w-7" />
            </div>
            <div>
              <div className="font-tech text-xs font-semibold text-white/72 sm:text-sm">{stat.label}</div>
              <div className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{stat.value}</div>
            </div>
          </Link>
        ))}
      </div>

      <section className="arena-panel group relative overflow-hidden border-white/8 bg-[#03070d]/95">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(154,53,255,0.24),transparent_36%),radial-gradient(circle_at_82%_12%,rgba(0,137,255,0.16),transparent_34%)]" />
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#c084fc]/70 to-transparent" />
        <div className="relative grid gap-5 p-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:p-5">
          <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black shadow-[0_24px_70px_rgba(0,0,0,0.42),0_0_44px_rgba(154,53,255,0.18)]">
            <video
              src={trailerVideo}
              autoPlay
              controls
              muted
              preload="auto"
              playsInline
              className="aspect-video h-full w-full bg-black object-cover"
            />
            <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10" />
          </div>
          <div className="flex flex-col justify-center gap-4 px-1 py-1 lg:px-2">
            <div className="space-y-3">
              <span className="inline-flex w-fit rounded border border-[#9f2dff]/50 bg-[#5b1499]/35 px-2 py-0.5 font-tech text-[9px] font-bold uppercase tracking-wider text-[#d773ff]">
                Official trailer
              </span>
              <h2 className="font-tech text-2xl font-black uppercase leading-tight text-white sm:text-3xl">
                Watch the next wave of KULT games
              </h2>
              <p className="text-sm leading-relaxed text-white/58">
                A quick look at the arena, battles, agents, and the high-energy worlds coming together inside KULT.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Arena", "#9a35ff"],
                ["Agents", "#00f080"],
                ["Battles", "#ffc000"],
              ].map(([label, color]) => (
                <div key={label} className="rounded-md border border-white/8 bg-white/[0.035] p-3">
                  <div className="mb-2 h-1 w-7 rounded-full" style={{ backgroundColor: color }} />
                  <div className="font-tech text-[9px] font-bold uppercase tracking-wider text-white/72">{label}</div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigate("/games")}
              className="inline-flex w-fit items-center gap-2 rounded-md border border-[#9b32ff]/60 bg-[#230b35]/75 px-5 py-2.5 font-tech text-[10px] font-bold uppercase tracking-wider text-white transition hover:border-[#c084fc] hover:bg-[#35104f]"
            >
              Browse games
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <HomeAIArenaSection />
      <HomeMomentsSection />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">Featured games</h2>
          <Link
            to="/games"
            className="font-tech text-[10px] font-bold uppercase tracking-wider text-purple-400 hover:text-purple-300"
          >
            View all →
          </Link>
        </div>
        <div
          ref={featuredScrollerRef}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto overflow-y-visible pb-3 scrollbar-none"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="arena-panel aspect-[16/10] min-w-[82vw] animate-pulse snap-start border-white/8 bg-white/5 sm:min-w-[360px] lg:min-w-[calc((100%-2.5rem)/3)]"
                />
              ))
            : featuredGames.map((game) => {
                const id = game.identification ?? game.slug ?? game._id;
                const image = getGameImage(game);
                return (
                  <Link
                    key={game._id ?? id}
                    to={`/game/${id}`}
                    className="group flex min-w-[82vw] snap-start flex-col overflow-hidden rounded-lg border border-white/8 bg-[#04080f]/95 transition hover:border-[#9a35ff]/35 sm:min-w-[360px] lg:min-w-[calc((100%-2.5rem)/3)]"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-[#0a0f18]">
                      {image ? (
                        <img
                          src={image}
                          alt={getGameName(game.name)}
                          className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#04080f] to-transparent" />
                    </div>
                    <div className="p-3">
                      <p className="truncate text-xs font-semibold text-white/90 group-hover:text-[#c78aff]">
                        {getGameName(game.name)}
                      </p>
                      <p className="mt-1 line-clamp-1 text-[10px] text-white/40">
                        {getGameDescription(game.description) || game.category}
                      </p>
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-tech text-xs font-semibold uppercase tracking-wider text-white/86">Jump in</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="arena-panel group relative flex items-center justify-between overflow-hidden border-white/8 bg-[#04080f]/95 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[var(--quick-link-color)] hover:shadow-[0_0_34px_var(--quick-link-glow)]"
              style={
                {
                  "--quick-link-color": link.color,
                  "--quick-link-glow": `${link.color}33`,
                } as CSSProperties
              }
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_50%,var(--quick-link-glow),transparent_46%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="flex items-center gap-3">
                <div
                  className="relative z-10 grid h-10 w-10 place-items-center rounded-md bg-white/[0.04] transition duration-300 group-hover:bg-[var(--quick-link-glow)] group-hover:shadow-[0_0_22px_var(--quick-link-glow)]"
                  style={{ color: link.color }}
                >
                  <link.icon className="h-5 w-5" />
                </div>
                <span className="relative z-10 font-tech text-sm font-bold uppercase tracking-wide text-white transition duration-300 group-hover:text-[var(--quick-link-color)]">
                  {link.label}
                </span>
              </div>
              <ArrowUpRight className="relative z-10 h-4 w-4 text-white/30 transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--quick-link-color)]" />
            </Link>
          ))}
        </div>
      </div>

      <div className="arena-panel flex flex-wrap items-center justify-between gap-4 border-white/8 bg-[#04080f]/95 p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-tech text-sm font-bold uppercase text-white">Ready for the arena?</h3>
            <p className="text-xs text-white/45">Train agents, earn rewards, and compete globally.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/ai-arena")}
          className="footer-arena-cta footer-arena-cta--compact group"
        >
          <span className="footer-arena-cta__shine" aria-hidden />
          <span className="footer-arena-cta__scan" aria-hidden />
          <span className="footer-arena-cta__label">ENTER AI ARENA</span>
          <ArrowUpRight className="footer-arena-cta__icon" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function HomeAIArenaSection() {
  const [activeAgentIndex, setActiveAgentIndex] = useState(0);
  const activeAgent = homeArenaAgents[activeAgentIndex];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveAgentIndex((index) => (index + 1) % homeArenaAgents.length);
    }, 2800);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="arena-panel relative overflow-hidden border-white/8 bg-[#03070d]/95 p-4 sm:p-5 lg:p-6">
      <div className="pointer-events-none absolute inset-0 arena-rain opacity-35" />
      <div className="pointer-events-none absolute inset-0 hero-hologram-overlay opacity-50" />
      <div className="relative grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-stretch">
        <div className="flex flex-col justify-between gap-5">
          <div>
            <div className="mb-3 flex items-center gap-2 font-tech text-[10px] uppercase tracking-[0.22em] text-[#9a35ff]">
              <Sparkles className="h-4 w-4" />
              AI Arena
            </div>
            <h2 className="font-tech text-2xl font-black uppercase leading-tight text-white sm:text-3xl">
              Train intelligence. Rule the arena.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/58">
              Create agents that remember fights, learn tactics, trigger rivalries, and battle while the whole ecosystem watches.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["384", "Live battles"],
              ["12.4K", "Agents awake"],
              ["72", "Rivalries"],
              ["9", "Tournaments"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-md border border-white/8 bg-white/[0.035] p-3">
                <div className="font-tech text-xl font-bold text-white">{value}</div>
                <div className="mt-1 font-tech text-[9px] uppercase tracking-wider text-white/42">{label}</div>
              </div>
            ))}
          </div>

          <Link
            to="/ai-arena"
            className="btn-primary inline-flex w-fit items-center gap-2 rounded-md px-5 py-2.5 font-tech text-[10px] font-bold uppercase tracking-wider"
          >
            Enter AI Arena
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]">
          <Link
            to="/ai-arena"
            className="group relative min-h-[360px] overflow-hidden rounded-lg border border-white/8 bg-black/40 sm:min-h-[420px] md:min-h-full"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(154,53,255,0.24),transparent_44%)]" />
            {activeAgent.img.endsWith(".mp4") ? (
              <video
                key={activeAgent.name}
                src={activeAgent.img}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-contain p-3 transition duration-500 group-hover:scale-[1.025]"
              />
            ) : (
              <img
                key={activeAgent.name}
                src={activeAgent.img}
                alt={activeAgent.name}
                className="absolute inset-0 h-full w-full object-contain p-3 transition duration-500 group-hover:scale-[1.025]"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/12 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <div className="font-tech text-lg font-bold uppercase text-white">{activeAgent.name}</div>
              <div className="mt-1 text-sm text-white/60">{activeAgent.stat}</div>
              <div className="mt-3 flex gap-1.5">
                {homeArenaAgents.map((agent, index) => (
                  <span
                    key={agent.name}
                    className={`h-1.5 rounded-full transition-all ${
                      index === activeAgentIndex ? "w-7 bg-[#9a35ff]" : "w-1.5 bg-white/25"
                    }`}
                  />
                ))}
              </div>
            </div>
          </Link>

          <div className="rounded-lg border border-white/8 bg-black/35 p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-tech text-[10px] uppercase tracking-[0.2em] text-white/60">Live system feed</span>
              <span className="flex items-center gap-1 rounded border border-red-500/30 bg-red-500/12 px-2 py-0.5 font-tech text-[9px] text-red-300">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-red-500" />
                Live
              </span>
            </div>
            <div className="space-y-2">
              {homeArenaSignals.map((signal, i) => (
                <div key={signal} className="flex items-center gap-3 rounded border border-white/6 bg-white/[0.025] px-3 py-2">
                  <Radio className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                  <span className="min-w-0 flex-1 truncate text-xs text-white/72">{signal}</span>
                  <span className="text-[10px] text-white/34">{i + 1}m</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeMomentsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["moments", "home", 3],
    queryFn: () => momentsApi.list({ perPage: 3 }),
    staleTime: 3 * 60_000,
  });

  const moments = data?.moments?.slice(0, 3) ?? [];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">Moments</h2>
          <p className="mt-1 text-xs text-white/42">Rivalries, betrayals, AI commentary, and learning clips from the arena.</p>
        </div>
        <Link
          to="/moments"
          className="font-tech text-[10px] font-bold uppercase tracking-wider text-purple-400 hover:text-purple-300"
        >
          View moments →
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-lg border border-white/8 bg-[#04080f]/95"
              >
                <div className="aspect-[16/9] bg-white/5" />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-white/10" />
                  <div className="h-2.5 w-1/2 rounded bg-white/6" />
                </div>
              </div>
            ))
          : moments.map((moment) => (
              <Link
                key={moment.momentId}
                to={`/moments/${moment.momentId}`}
                className="group overflow-hidden rounded-lg border border-white/8 bg-[#04080f]/95 transition hover:-translate-y-0.5 hover:border-[#9a35ff]/35"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-[#0a0f18]">
                  {moment.assetUrl && (
                    (moment.assetMetadata as { mediaType?: string } | undefined)?.mediaType === "video" ? (
                      <video
                        src={moment.assetUrl}
                        muted
                        loop
                        playsInline
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <img
                        src={moment.assetUrl}
                        alt={moment.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    )
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#04080f] via-transparent to-transparent" />
                  <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded border border-white/10 bg-black/45 px-2 py-1 font-tech text-[9px] uppercase tracking-wider text-white/72">
                    <Zap className="h-3 w-3 text-[#ffc000]" />
                    AI Moment
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-white/90 group-hover:text-[#c78aff]">{moment.title}</p>
                  <p className="mt-1 line-clamp-1 text-[10px] text-white/42">
                    {moment.aiCaption ?? moment.description ?? ""}
                  </p>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}
