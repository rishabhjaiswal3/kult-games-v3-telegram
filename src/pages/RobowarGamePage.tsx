import { useCallback, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Swords,
  Eye,
  Heart,
  Bookmark,
  Play,
  Pause,
  Loader2,
  Star,
} from "lucide-react";
import { aiArenaGatewayApi } from "@/api/aiArenaGatewayApi";
import { momentsApi } from "@/api/momentsApi";
import { getArenaAgentPortrait } from "@/constants/arenaAgentArchetypes";
import { MOMENTS_QUERY_KEY_ROOT } from "@/constants/moments";
import type { Moment } from "@/types/api";
import { cn } from "@/lib/utils";

// ── Red palette (VS header) ───────────────────────────────────────────────────
const R = {
  primary:  "#dc2626",
  bright:   "#ef4444",
  glow:     "rgba(220,38,38,0.5)",
  glowSoft: "rgba(220,38,38,0.15)",
  bg:       "#0a0202",
  border:   "rgba(220,38,38,0.3)",
};

const PAGE_SIZE = 18;

// ── Category tabs ─────────────────────────────────────────────────────────────
const CATEGORIES = ["For You", "Trending", "AI Arena", "Robowars"] as const;
type Category = (typeof CATEGORIES)[number];

const GAME_SLUG_MAP: Record<Category, string | undefined> = {
  "For You":   undefined,
  "Trending":  undefined,
  "AI Arena":  "ai-arena",
  "Robowars":  "robowars",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)(?:\?.*)?$/i;

function isMomentVideo(moment: Moment): boolean {
  const ft = String(moment.assetMetadata?.fileType ?? "").toLowerCase();
  if (ft.startsWith("video/")) return true;
  if (ft.startsWith("image/")) return false;
  const url = (moment.assetZgUrl ?? moment.assetUrl ?? "").split("?")[0].toLowerCase();
  return VIDEO_EXT.test(url);
}

function getMomentAssetUrl(moment: Moment): string | undefined {
  return moment.assetZgUrl ?? moment.assetUrl;
}

function pseudoDuration(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const total = 12 + (h % 108);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function pseudoViews(id: string, likes: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 17 + id.charCodeAt(i)) >>> 0;
  return likes * 6 + (h % 4000) + 1000;
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: value >= 10_000 ? 1 : 0,
  }).format(value);
}

function shortenWallet(addr: string, start = 6, end = 4): string {
  if (addr.length <= start + end + 3) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
}

function gameLabelFromSlug(slug: string): string {
  const labels: Record<string, string> = {
    "ai-arena":       "AI Arena",
    "guess-the-ai":   "AI Arena",
    "robowars":       "Robowars",
    "kult-royale":    "Warzone Warriors",
    "warzonewarriors":"Warzone Warriors",
    "highway-hustle": "Racing League",
    "highwayhustle":  "Racing League",
  };
  const key = slug.toLowerCase();
  return labels[key] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function filterMoments(moments: Moment[], category: Category): Moment[] {
  const slug = GAME_SLUG_MAP[category];
  if (!slug) return moments;
  const needles = slug === "ai-arena"
    ? ["ai-arena", "aiarena", "guess-the-ai", "guesstheai"]
    : ["robowars", "robo"];
  return moments.filter((m) => {
    const games = m.relatedGames.map((g) => g.toLowerCase());
    const tags  = m.tags.map((t) => t.toLowerCase());
    return needles.some(
      (n) => games.some((g) => g.includes(n) || n.includes(g)) || tags.some((t) => t.includes(n)),
    );
  });
}

function feedHasMore(
  lastPage: { total: number; totalPages: number; page: number; perPage: number; moments: unknown[] },
  allPages: typeof lastPage[],
) {
  const loaded = allPages.reduce((t, p) => t + p.moments.length, 0);
  if (lastPage.total > 0 && loaded >= lastPage.total) return false;
  if (lastPage.totalPages > 0 && lastPage.page >= lastPage.totalPages) return false;
  return lastPage.moments.length >= lastPage.perPage;
}

function shortId(v?: string | null) {
  if (!v) return "—";
  return v.length > 14 ? `${v.slice(0, 6)}…${v.slice(-4)}` : v;
}

// ── Moment card (matches kult-moment MomentArenaFeedCard design) ──────────────
function MomentCard({ moment, onOpen }: { moment: Moment; onOpen: (id: string) => void }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const url      = getMomentAssetUrl(moment);
  const isVideo  = isMomentVideo(moment);
  const views    = pseudoViews(moment.momentId, moment.numLikes);
  const duration = pseudoDuration(moment.momentId);
  const gameSlug = moment.relatedGames?.[0];
  const gameLabel = gameSlug ? gameLabelFromSlug(gameSlug) : null;

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  return (
    <article
      onClick={() => onOpen(moment.momentId)}
      className="group cursor-pointer overflow-hidden rounded-xl bg-[#14141A] transition-all hover:shadow-[0_0_28px_rgba(99,54,255,0.18)]"
    >
      {/* Thumbnail / video */}
      <div className="relative aspect-video overflow-hidden bg-[#0B0B0E]">
        {url ? (
          isVideo ? (
            <>
              <video
                ref={videoRef}
                src={url}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                muted
                playsInline
                loop
                preload="metadata"
                onClick={togglePlay}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              />
              <button
                type="button"
                onClick={togglePlay}
                className={cn(
                  "absolute inset-0 z-10 flex items-center justify-center transition-opacity",
                  playing ? "opacity-0 hover:opacity-100" : "opacity-100",
                )}
                aria-label={playing ? "Pause" : "Play"}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-2 ring-white/30 transition-transform duration-200 group-hover:scale-110">
                  {playing
                    ? <Pause className="h-4 w-4 fill-white text-white" />
                    : <Play  className="h-4 w-4 fill-white text-white" />
                  }
                </span>
              </button>
            </>
          ) : (
            <img
              src={url}
              alt={moment.title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/20 via-black/60 to-black/90">
            <Play className="h-8 w-8 text-white/20" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Game badge — top left */}
        {gameLabel && (
          <div className="absolute left-2 top-2 z-10">
            <span className="inline-flex items-center rounded-md bg-[#6336FF] px-2 py-0.5 font-tech text-[9px] font-black tracking-wider text-white">
              {gameLabel.toUpperCase()}
            </span>
          </div>
        )}

        {/* Duration — top right */}
        <div className="absolute right-2 top-2 z-10">
          <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-white backdrop-blur-sm">
            {duration}
          </span>
        </div>

        {/* Play overlay for non-video (image) — center */}
        {!isVideo && url && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-2 ring-white/30 transition-transform duration-200 group-hover:scale-110">
              <Play className="h-4 w-4 fill-white text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1.5 px-3 py-2.5">
        <h3 className="line-clamp-1 text-sm font-bold leading-snug text-white">
          {moment.title || "Untitled Moment"}
        </h3>

        {/* Creator + clan */}
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <div className="flex min-w-0 items-center gap-1">
            <span className="text-[#8B8B9A]">by</span>
            <span className="truncate font-semibold text-white">
              {shortenWallet(moment.playerWalletAddress)}
            </span>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#6336FF]" />
          </div>
          {gameLabel && (
            <span className="shrink-0 truncate text-[10px] text-[#5C5C6B]">{gameLabel}</span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 pt-0.5 text-[11px] text-[#8B8B9A]">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {formatCompact(views)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
            {formatCompact(moment.numLikes)}
          </span>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="ml-auto rounded p-0.5 transition-colors hover:text-white"
            aria-label="Bookmark"
          >
            <Bookmark className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Category filter strip ─────────────────────────────────────────────────────
function CategoryStrip({
  active,
  onChange,
}: {
  active: Category;
  onChange: (c: Category) => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-white/[0.06] bg-[#0E0E16] px-3 py-3 [scrollbar-width:none]">
      {CATEGORIES.map((c) => {
        const on = active === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-1.5 font-tech text-[11px] font-bold tracking-wide transition-colors",
              on
                ? "border-[#6336FF]/50 bg-[#6336FF] text-white shadow-[0_0_18px_rgba(99,54,255,0.4)]"
                : "border-white/[0.1] bg-black/40 text-[#8B8B9A] hover:border-[#6336FF]/30 hover:text-white",
            )}
          >
            {c === "For You" && on && <Star className="h-3 w-3 fill-current" aria-hidden />}
            {c.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RobowarGamePage() {
  const { battleId } = useParams<{ battleId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const myAgentId       = searchParams.get("myAgentId");
  const opponentIdParam = searchParams.get("opponentId");
  const mode            = searchParams.get("mode") ?? "RANKED";

  const [activeCategory, setActiveCategory] = useState<Category>("For You");

  // Agent queries
  const myAgentQ = useQuery({
    queryKey: ["robowar", "myAgent", myAgentId],
    queryFn:  () => aiArenaGatewayApi.getAgentById(myAgentId!),
    enabled:  !!myAgentId,
    staleTime: 60_000,
    retry: 1,
  });
  const opponentQ = useQuery({
    queryKey: ["robowar", "opponent", opponentIdParam],
    queryFn:  () => aiArenaGatewayApi.getAgentById(opponentIdParam!),
    enabled:  !!opponentIdParam,
    staleTime: 60_000,
    retry: 1,
  });

  const myAgent  = myAgentQ.data  ?? null;
  const opponent = opponentQ.data ?? null;

  // Moments feed
  const feedQuery = useInfiniteQuery({
    queryKey: [MOMENTS_QUERY_KEY_ROOT, "robowar-feed"],
    queryFn: ({ pageParam }) => momentsApi.list({ page: pageParam, perPage: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages, lastPageParam) =>
      feedHasMore(lastPage, allPages) ? lastPageParam + 1 : undefined,
    staleTime: 60_000,
    retry: 1,
  });

  const allMoments = useMemo(
    () => feedQuery.data?.pages.flatMap((p) => p.moments) ?? [],
    [feedQuery.data],
  );

  const displayMoments = useMemo(
    () => filterMoments(allMoments, activeCategory),
    [allMoments, activeCategory],
  );

  // Infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (!node || !feedQuery.hasNextPage) return;
      const io = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) void feedQuery.fetchNextPage();
        },
        { rootMargin: "240px" },
      );
      io.observe(node);
      observerRef.current = io;
    },
    [feedQuery.hasNextPage, feedQuery.fetchNextPage],
  );

  const openMoment = useCallback(
    (id: string) => navigate(`/moments/${id}`),
    [navigate],
  );

  return (
    <div
      className="flex h-dvh min-h-0 flex-col overflow-hidden"
      style={{ background: R.bg, color: "#fff" }}
    >
      {/* ── Top nav ──────────────────────────────────────────────────── */}
      <div
        className="flex shrink-0 items-center justify-between gap-3 px-3 sm:px-5 py-2 z-30"
        style={{ background: "rgba(10,2,2,0.97)", borderBottom: `1px solid ${R.border}` }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-tech text-[9px] uppercase tracking-widest text-white/45 hover:text-white transition"
          style={{ border: `1px solid ${R.border}` }}
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-white/25 hidden sm:block">BATTLE</span>
          <span className="font-mono text-[10px] text-white/50">{shortId(battleId)}</span>
          <span
            className="rounded-full px-2 py-0.5 font-tech text-[8px] uppercase tracking-widest"
            style={{ background: R.glowSoft, color: R.bright, border: `1px solid ${R.border}` }}
          >
            {mode}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full animate-pulse" style={{ background: R.bright }} />
          <span className="font-tech text-[9px] uppercase tracking-widest" style={{ color: R.bright }}>
            Robowar
          </span>
        </div>
      </div>

      {/* ── Agent VS strip ───────────────────────────────────────────── */}
      <div
        className="flex shrink-0 items-center justify-between gap-4 px-4 sm:px-8 py-3"
        style={{ background: "rgba(10,2,2,0.9)", borderBottom: `1px solid ${R.border}` }}
      >
        {/* Left agent */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl" style={{ border: `1px solid ${R.border}` }}>
            {myAgent
              ? <img src={getArenaAgentPortrait(myAgent as any)} alt="" className="h-full w-full object-cover object-top" />
              : <div className="h-full w-full" style={{ background: R.glowSoft }} />
            }
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-bold text-white">{myAgent?.name ?? "—"}</div>
            <div className="font-tech text-[9px] uppercase tracking-wider" style={{ color: R.bright }}>
              {myAgent?.archetype ?? "—"}
            </div>
            <div className="font-mono text-[9px] text-white/30">{myAgent?.eloRating ?? "—"} ELO</div>
          </div>
        </div>

        {/* VS */}
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ border: `1px solid ${R.primary}`, background: R.glowSoft, boxShadow: `0 0 20px ${R.glow}` }}
          >
            <Swords className="h-4 w-4" style={{ color: R.bright }} />
          </div>
          <span className="font-display text-xs font-black" style={{ color: R.bright }}>VS</span>
          <span className="font-tech text-[8px] uppercase tracking-widest text-white/25">{mode}</span>
        </div>

        {/* Right agent */}
        <div className="flex flex-row-reverse items-center gap-3 min-w-0">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl" style={{ border: `1px solid ${R.border}` }}>
            {opponent
              ? <img src={getArenaAgentPortrait(opponent as any)} alt="" className="h-full w-full object-cover object-top -scale-x-100" />
              : <div className="h-full w-full" style={{ background: R.glowSoft }} />
            }
          </div>
          <div className="min-w-0 text-right">
            <div className="truncate font-display text-sm font-bold text-white">{opponent?.name ?? "—"}</div>
            <div className="font-tech text-[9px] uppercase tracking-wider" style={{ color: R.bright }}>
              {opponent?.archetype ?? "—"}
            </div>
            <div className="font-mono text-[9px] text-white/30">{opponent?.eloRating ?? "—"} ELO</div>
          </div>
        </div>
      </div>

      {/* ── Category filter ──────────────────────────────────────────── */}
      <CategoryStrip active={activeCategory} onChange={setActiveCategory} />

      {/* ── Moments feed ─────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-[hsl(268_35%_7%/0.5)]">
        {feedQuery.isLoading ? (
          <div className="grid gap-4 px-4 py-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex animate-pulse flex-col overflow-hidden rounded-xl bg-[#14141A]">
                <div className="aspect-video bg-white/5" />
                <div className="space-y-2 px-3 py-2.5">
                  <div className="h-4 w-2/3 rounded bg-white/5" />
                  <div className="h-3 w-1/2 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : feedQuery.isError ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <p className="text-sm font-semibold text-white/40">Could not load moments</p>
            <button
              type="button"
              onClick={() => void feedQuery.refetch()}
              className="rounded-xl border border-[#6336FF]/40 bg-[#6336FF]/10 px-5 py-2 font-tech text-[10px] uppercase tracking-widest text-[#a07aff]"
            >
              Retry
            </button>
          </div>
        ) : displayMoments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <p className="text-sm font-semibold text-white/40">No moments in this category yet</p>
            <button
              type="button"
              onClick={() => setActiveCategory("For You")}
              className="rounded-xl border border-white/10 bg-black/40 px-5 py-2 font-tech text-[10px] uppercase tracking-widest text-white/60 hover:text-white"
            >
              Show all
            </button>
          </div>
        ) : (
          <div className="px-4 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayMoments.map((moment) => (
                <MomentCard key={moment.momentId} moment={moment} onOpen={openMoment} />
              ))}
            </div>

            {/* Infinite scroll sentinel + footer */}
            <div className="flex flex-col items-center gap-3 pt-6">
              <div ref={feedQuery.hasNextPage ? sentinelRef : null} aria-hidden className="h-px w-full" />
              {feedQuery.isFetchingNextPage ? (
                <div className="flex items-center gap-2 font-tech text-[10px] uppercase tracking-wider text-[#a07aff]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Loading more moments</span>
                </div>
              ) : !feedQuery.hasNextPage && displayMoments.length > 0 ? (
                <span className="font-tech text-[10px] uppercase tracking-wider text-white/30">
                  No more moments
                </span>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
