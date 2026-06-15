import {
  ArrowLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Download,
  Gamepad2,
  Play,
  Shield,
  ShoppingBag,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArenaPageLayout } from "@/components/arena/ArenaPageLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { gamesApi } from "@/api/gamesApi";
import { useAuth } from "@/contexts/AuthContext";
import { isGameDownloadable, gameDownloadUrl } from "@/lib/gameDownload";
import { triggerBrowserDownload } from "@/lib/triggerBrowserDownload";
import { getGameDescription, getGameImage, getGameName } from "@/lib/gameDisplay";
import type { Game } from "@/types/api";
import type { LucideIcon } from "lucide-react";

const GAME_FALLBACK_INTROS: Record<string, string> = {
  "highway-hustle":
    "Highway Hustle drops you into a neon-soaked expressway where reaction time is everything. Race through traffic, collect power-ups, and chain multipliers to dominate the on-chain leaderboard.",
  "robo-wars":
    "Robo Wars is a real-time PvP battle arena where you assemble a custom combat robot and clash with opponents worldwide. Upgrade your chassis, swap weapon modules, and unleash special abilities.",
};

type FactItem = {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
};

function buildFacts(game: Game): FactItem[] {
  const meta = game.metadata ?? {};
  const facts: FactItem[] = [];
  if (game.rating != null) {
    facts.push({ label: "Rating", value: String(game.rating), icon: Star, color: "#ffc000" });
  }
  const session = meta.session_length as string | undefined;
  if (session) facts.push({ label: "Session", value: session, icon: Clock, color: "#0089ff" });
  const players = meta.players as string | undefined;
  if (players) facts.push({ label: "Players", value: players, icon: Users, color: "#00f080" });
  facts.push({
    label: "Chain",
    value: (meta.chain as string) ?? "0G Chain",
    icon: Shield,
    color: "#b338ff",
  });
  return facts;
}

function GameDetailSkeleton() {
  return (
    <ArenaPageLayout>
      <Skeleton className="h-9 w-28 rounded" />
      <Skeleton className="min-h-[220px] w-full rounded-lg" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="min-h-[280px] w-full" />
      </div>
    </ArenaPageLayout>
  );
}

const GameDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [galleryIndex, setGalleryIndex] = useState(0);

  const { data: game, isLoading, isError } = useQuery({
    queryKey: ["game", id],
    queryFn: () => gamesApi.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });

  const image = game ? getGameImage(game) : "";
  const galleryImages: string[] = game
    ? [...(game.images ?? []).map((img) => img.url).filter(Boolean), ...(image ? [image] : [])]
        .filter((url, i, arr) => url && arr.indexOf(url) === i)
        .slice(0, 8)
    : [];

  useEffect(() => {
    setGalleryIndex(0);
  }, [id]);

  useEffect(() => {
    if (galleryImages.length <= 1) return;
    const timer = window.setInterval(() => {
      setGalleryIndex((prev) => (prev + 1) % galleryImages.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [galleryImages.length]);

  if (isLoading) return <GameDetailSkeleton />;

  if (isError || !game) {
    return (
      <ArenaPageLayout>
        <div className="arena-panel border-white/8 px-8 py-14 text-center">
          <Gamepad2 className="mx-auto mb-4 h-10 w-10 text-white/30" />
          <h1 className="font-tech text-xl font-bold uppercase text-white">Game not found</h1>
          <p className="mt-2 text-xs text-white/45">This title isn&apos;t in the catalog right now.</p>
          <button
            type="button"
            onClick={() => navigate("/games")}
            className="btn-primary mt-6 inline-flex items-center gap-2 rounded-md px-5 py-2.5 font-tech text-[10px] font-bold uppercase tracking-wider"
          >
            Browse games
          </button>
        </div>
      </ArenaPageLayout>
    );
  }

  const title = getGameName(game.name);
  const meta = game.metadata ?? {};
  const about =
    (meta.long_description as string) ??
    game.about ??
    getGameDescription(game.description) ??
    game.slogan ??
    GAME_FALLBACK_INTROS[id ?? ""] ??
    "";
  const features: string[] = (meta.features as string[]) ?? [];
  const showcaseSrc = galleryImages[galleryIndex] ?? image;
  const facts = buildFacts(game);
  const downloadable = isGameDownloadable(game);
  const downloadHref = gameDownloadUrl(game);

  const handlePlayAccess = () => {
    if (isAuthenticated) {
      navigate(`/game/${id}/play`);
      return;
    }
    navigate("/?login=1");
  };

  const handleDownloadClick = () => {
    triggerBrowserDownload(downloadHref);
  };

  const prevGallery = () => {
    setGalleryIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const nextGallery = () => {
    setGalleryIndex((prev) => (prev + 1) % galleryImages.length);
  };

  return (
    <ArenaPageLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/games")}
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-[#07101d]/70 px-4 py-2.5 font-tech text-[10px] font-bold uppercase tracking-wider text-white/58 transition hover:border-purple-500/40 hover:bg-purple-950/10 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to games
        </button>
        <div className="hidden items-center gap-2 rounded-md border border-purple-500/20 bg-purple-950/10 px-3 py-2 font-tech text-[10px] uppercase tracking-wider text-purple-200/70 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00f080] shadow-[0_0_12px_#00f080]" />
          Game launcher online
        </div>
      </div>

      <article className="arena-panel group relative min-h-[360px] overflow-hidden border-white/8 bg-[#03070d] shadow-[0_28px_90px_rgba(0,0,0,0.35)]">
        {showcaseSrc ? (
          <img
            src={showcaseSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-42 blur-[3px] transition duration-700 group-hover:scale-[1.03] group-hover:opacity-55"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-[#03070d] via-[#03070d]/92 to-[#03070d]/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#03070d] via-[#03070d]/30 to-purple-950/24" />
        <div className="absolute inset-y-0 left-0 w-[68%] bg-[#03070d]/42 backdrop-blur-[2px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(154,53,255,0.28),transparent_32%),radial-gradient(circle_at_82%_22%,rgba(0,240,128,0.10),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-purple-300/80 to-transparent" />

        <div className="relative z-10 grid min-h-[360px] gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)] lg:items-end">
          <div className="max-w-3xl space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {game.category ? (
                <span className="rounded border border-[#9f2dff]/50 bg-[#5b1499]/35 px-2.5 py-1 font-tech text-[9px] font-bold uppercase tracking-wider text-[#d773ff]">
                  {game.category}
                </span>
              ) : null}
              <span
                className={`rounded border px-2.5 py-1 font-tech text-[9px] font-bold uppercase tracking-wider ${
                  downloadable
                    ? "border-amber-500/35 bg-amber-950/50 text-amber-400"
                    : "border-emerald-500/35 bg-emerald-950/50 text-[#00f080]"
                }`}
              >
                {downloadable ? "Downloadable" : "Instant play"}
              </span>
            </div>
            <div>
              <h1 className="font-tech text-4xl font-black uppercase leading-none tracking-tight text-white drop-shadow-[0_0_28px_rgba(154,53,255,0.24)] sm:text-5xl xl:text-6xl">
                {title}
              </h1>
              <p className="mt-4 max-w-2xl rounded-lg border border-white/12 bg-[#03070d]/68 p-4 text-sm font-medium leading-relaxed text-white/86 shadow-[0_18px_60px_rgba(0,0,0,0.34)] backdrop-blur-md sm:text-base">
                {game.slogan || getGameDescription(game.description) || "Enter the arena, master the loop, and climb the Kult ecosystem."}
              </p>
            </div>
            <div className="grid max-w-xl grid-cols-3 gap-2">
              {[
                ["Mode", downloadable ? "Build" : "Browser"],
                ["Arena", "0G"],
                ["Access", isAuthenticated ? "Ready" : "Login"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-white/8 bg-black/35 px-3 py-2 backdrop-blur-sm">
                  <div className="font-tech text-[8px] uppercase tracking-wider text-white/36">{label}</div>
                  <div className="mt-1 truncate font-tech text-xs font-bold uppercase text-white/82">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/35 p-3 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-tech text-[10px] uppercase tracking-[0.2em] text-white/48">Launch control</span>
              <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 font-tech text-[9px] uppercase text-white/55">
                v1.0
              </span>
            </div>
            {downloadable ? (
              <button
                type="button"
                onClick={handleDownloadClick}
                className="btn-primary flex w-full items-center justify-center gap-2 rounded-md px-5 py-3 font-tech text-[10px] font-bold uppercase tracking-wider"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePlayAccess}
                className="btn-primary flex w-full items-center justify-center gap-2 rounded-md px-5 py-3 font-tech text-[10px] font-bold uppercase tracking-wider"
              >
                <Play className="h-4 w-4 fill-current" />
                Play now
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/inventory")}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-[#0a0f1b]/70 px-4 py-3 font-tech text-[10px] font-bold uppercase tracking-wider text-purple-300 transition hover:border-purple-500/40 hover:text-white"
            >
              <ShoppingBag className="h-4 w-4" />
              Inventory
            </button>
          </div>
        </div>
      </article>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="arena-panel flex items-center gap-3 border-white/8 bg-[#04080f]/95 p-4">
            <div className="grid h-11 w-11 place-items-center rounded-md border border-white/8 bg-white/[0.04]">
              <fact.icon className="h-5 w-5" style={{ color: fact.color }} />
            </div>
            <div className="min-w-0">
              <div className="font-tech text-[9px] text-white/48">{fact.label}</div>
              <div className="truncate text-lg font-semibold text-white">{fact.value}</div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => navigate("/leaderboard")}
          className="arena-panel group relative flex items-center gap-3 overflow-hidden border-[#ffc000]/20 bg-[#04080f]/95 p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-[#ffc000]/70 hover:shadow-[0_0_32px_rgba(255,192,0,0.18)]"
        >
          <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_20%_50%,rgba(255,192,0,0.18),transparent_42%)]" />
          <div className="relative grid h-11 w-11 place-items-center rounded-md border border-[#ffc000]/25 bg-[#ffc000]/10 text-[#ffc000] transition duration-300 group-hover:scale-105 group-hover:bg-[#ffc000]/16">
            <Crown className="h-5 w-5" />
          </div>
          <div className="relative min-w-0">
            <div className="font-tech text-[9px] text-white/48 transition group-hover:text-[#ffd768]">Leaderboard</div>
            <div className="truncate text-lg font-semibold text-white">Ranks</div>
          </div>
          <ArrowUpRight className="relative ml-auto h-4 w-4 text-[#ffc000]/70 transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#ffc000]" />
        </button>
        <button
          type="button"
          onClick={() => navigate("/inventory")}
          className="arena-panel group relative flex items-center gap-3 overflow-hidden border-purple-500/20 bg-[#04080f]/95 p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-purple-400/70 hover:shadow-[0_0_34px_rgba(154,53,255,0.24)]"
        >
          <div className="pointer-events-none absolute inset-0 translate-x-[-110%] bg-gradient-to-r from-transparent via-purple-300/16 to-transparent transition duration-700 group-hover:translate-x-[110%]" />
          <div className="relative grid h-11 w-11 place-items-center rounded-md border border-purple-400/25 bg-purple-500/10 text-purple-300 transition duration-300 group-hover:rotate-3 group-hover:scale-105 group-hover:bg-purple-500/16">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="relative min-w-0">
            <div className="font-tech text-[9px] text-white/48 transition group-hover:text-purple-200">Marketplace</div>
            <div className="truncate text-lg font-semibold text-white">Inventory</div>
          </div>
          <ArrowUpRight className="relative ml-auto h-4 w-4 text-purple-300/70 transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-purple-200" />
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-5">
          {about ? (
            <div className="arena-panel relative overflow-hidden space-y-4 border-white/8 bg-[#04080f]/95 p-5 sm:p-6">
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/55 to-transparent" />
              <h2 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">Mission briefing</h2>
              <div className="space-y-3 text-sm leading-relaxed text-white/60">
                {about.split("\n\n").filter(Boolean).map((para, i) => (
                  <p key={i}>{para.trim()}</p>
                ))}
              </div>
            </div>
          ) : null}

          {features.length > 0 ? (
            <div className="arena-panel space-y-4 border-white/8 bg-[#04080f]/95 p-5 sm:p-6">
              <h2 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">Features</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {features.map((feature) => (
                  <div
                    key={feature}
                    className="flex gap-3 rounded-lg border border-white/8 bg-[#0a0f1b]/50 p-3"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-purple-500/10 text-purple-400">
                      <Zap className="h-4 w-4" />
                    </div>
                    <p className="text-xs leading-relaxed text-white/75">{feature}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="arena-panel relative overflow-hidden flex flex-wrap items-center justify-between gap-4 border-purple-500/30 bg-[#070a12]/95 p-5 sm:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_50%,rgba(154,53,255,0.20),transparent_34%)]" />
            <div>
              <p className="font-tech text-[10px] uppercase tracking-wider text-[#d773ff]">
                {downloadable ? "Desktop build" : "Ready to play"}
              </p>
              <h3 className="mt-1 font-tech text-lg font-bold uppercase text-white">
                {downloadable ? `Get ${title} on your machine` : `Launch ${title} in browser`}
              </h3>
            </div>
            {downloadable ? (
              <button
                type="button"
                onClick={handleDownloadClick}
                className="btn-primary relative inline-flex items-center gap-2 rounded-md px-6 py-3 font-tech text-[10px] font-bold uppercase tracking-wider"
              >
                <Download className="h-4 w-4" />
                Download
                <ArrowUpRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePlayAccess}
                className="btn-primary relative inline-flex items-center gap-2 rounded-md px-6 py-3 font-tech text-[10px] font-bold uppercase tracking-wider"
              >
                <Play className="h-4 w-4 fill-current" />
                Play now
                <ArrowUpRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="arena-panel overflow-hidden border-white/8 bg-[#04080f]/95 shadow-[0_20px_70px_rgba(0,0,0,0.26)]">
            <div className="border-b border-white/8 px-4 py-3">
              <h3 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">Media deck</h3>
            </div>
            <div className="relative aspect-video border-b border-white/6 bg-[#0a0f18]">
              {showcaseSrc ? (
                <img src={showcaseSrc} alt={title} className="h-full w-full object-cover" loading="eager" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Gamepad2 className="h-10 w-10 text-white/25" />
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#04080f]/80 to-transparent" />
              {galleryImages.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={prevGallery}
                    className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-1.5 text-white transition hover:border-purple-500/40"
                    aria-label="Previous screenshot"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextGallery}
                    className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-1.5 text-white transition hover:border-purple-500/40"
                    aria-label="Next screenshot"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              ) : null}
            </div>
            {galleryImages.length > 1 ? (
              <div className="grid grid-cols-4 gap-1.5 p-2">
                {galleryImages.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setGalleryIndex(i)}
                    className={`overflow-hidden rounded border transition ${
                      galleryIndex === i
                        ? "border-[#9a35ff]/60 ring-1 ring-[#9a35ff]/30"
                        : "border-white/10 hover:border-white/25"
                    }`}
                  >
                    <img src={src} alt="" className="aspect-video w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {game.platform?.length ? (
            <div className="arena-panel space-y-3 border-white/8 bg-[#04080f]/95 p-4">
              <h3 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">Platforms</h3>
              <div className="rounded border border-white/8 bg-[#0a0f1b]/40 px-3 py-2.5">
                <span className="font-tech text-[9px] uppercase text-white/40">Platforms</span>
                <p className="mt-1 text-xs font-semibold text-white/80">{game.platform.join(", ")}</p>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </ArenaPageLayout>
  );
};

export default GameDetail;
