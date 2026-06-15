import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  Search,
  Eye,
  Heart,
  Play,
  Hexagon,
  Loader2,
  Video,
  Image as ImageIcon,
  Bookmark,
} from "lucide-react";
import { momentsApi } from "@/api/momentsApi";
import { KNOWN_MOMENT_GAME_LABELS, MOMENTS_QUERY_KEY_ROOT } from "@/constants/moments";
import type { Moment as ApiMoment, MomentsFeedResponse } from "@/types/api";

import momentWarzone from "@/assets/moment-warzone.png";
import momentRobowars from "@/assets/moment-robowars.png";
import momentFeatured from "@/assets/moment-featured.png";

const PAGE_SIZE = 12;

type MediaFilter = "ALL" | "IMAGE" | "VIDEO";

const GAME_OPTIONS = ["ALL GAMES", ...KNOWN_MOMENT_GAME_LABELS] as const;

const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v|avi|mkv|ogv|m3u8)(?:\?.*)?$/i;

function resolveContentType(moment: ApiMoment): "image" | "video" {
  const ft =
    typeof moment.assetMetadata?.fileType === "string" ? moment.assetMetadata.fileType : undefined;
  if (ft?.startsWith("video/")) return "video";
  if (ft?.startsWith("image/")) return "image";
  if (moment.assetUrl && VIDEO_EXTENSIONS.test(moment.assetUrl)) return "video";
  return "image";
}

function deriveThumbnail(moment: ApiMoment) {
  const meta = moment.assetMetadata as Record<string, unknown> | undefined;
  if (meta) {
    for (const key of ["thumbnailUrl", "thumbnail", "posterUrl", "poster", "coverImage", "imageUrl", "previewImage"]) {
      const val = meta[key];
      if (typeof val === "string" && val.trim()) return val.trim();
    }
  }
  if (moment.assetUrl && /\.(png|jpe?g|gif|webp|avif)$/i.test(moment.assetUrl)) return moment.assetUrl;
  const haystack = [...moment.relatedGames, ...moment.tags, moment.title].join(" ").toLowerCase();
  if (haystack.includes("robo")) return momentRobowars;
  if (haystack.includes("highway")) return momentFeatured;
  return momentWarzone;
}

function shortWallet(value?: string) {
  if (!value) return "UNKNOWN";
  if (value.length <= 12) return value.toUpperCase();
  return `${value.slice(0, 6)}…${value.slice(-4)}`.toUpperCase();
}

function compactNum(value: number | null | undefined) {
  if (!value || value <= 0) return "—";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function matchGameLabel(moment: ApiMoment): string {
  const hay = [...moment.relatedGames, ...moment.tags, moment.title].join(" ").toLowerCase();
  if (hay.includes("robo")) return "ROBOWARS";
  if (hay.includes("highway")) return "HIGHWAY HUSTLE";
  if (hay.includes("warzone")) return "WARZONE WARRIORS";
  return moment.relatedGames[0]?.toUpperCase() ?? "ARENA";
}

function feedHasMore(lastPage: MomentsFeedResponse, allPages: MomentsFeedResponse[]) {
  const loaded = allPages.reduce((t, p) => t + p.moments.length, 0);
  if (lastPage.total > 0 && loaded >= lastPage.total) return false;
  if (lastPage.totalPages > 0 && lastPage.page >= lastPage.totalPages) return false;
  return lastPage.moments.length >= lastPage.perPage;
}

export function AllMomentsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState("ALL GAMES");
  const [selectedMedia, setSelectedMedia] = useState<MediaFilter>("ALL");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const deferredSearch = useDeferredValue(searchQuery.trim());

  const mediaTypeParam = selectedMedia === "IMAGE" ? ("image" as const) : selectedMedia === "VIDEO" ? ("video" as const) : undefined;

  const feedQuery = useInfiniteQuery({
    queryKey: [MOMENTS_QUERY_KEY_ROOT, "all-page", deferredSearch, mediaTypeParam],
    queryFn: ({ pageParam }) =>
      momentsApi.list({
        page: pageParam,
        perPage: PAGE_SIZE,
        searchQuery: deferredSearch || undefined,
        mediaType: mediaTypeParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages, lastPageParam) =>
      feedHasMore(lastPage, allPages) ? lastPageParam + 1 : undefined,
    staleTime: 30_000,
    retry: 1,
  });

  const allMoments = useMemo(
    () => feedQuery.data?.pages.flatMap((p) => p.moments) ?? [],
    [feedQuery.data],
  );

  const filteredMoments = useMemo(() => {
    return allMoments.filter((m) => {
      if (selectedGame !== "ALL GAMES") {
        const label = matchGameLabel(m);
        if (label !== selectedGame) return false;
      }
      return true;
    });
  }, [allMoments, selectedGame]);

  const handleLoadMoreRef = useRef(() => {});
  handleLoadMoreRef.current = () => {
    if (feedQuery.hasNextPage) void feedQuery.fetchNextPage();
  };

  const loadMoreObserverRef = useRef<IntersectionObserver | null>(null);
  const sentinelRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (loadMoreObserverRef.current) {
      loadMoreObserverRef.current.disconnect();
      loadMoreObserverRef.current = null;
    }
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) handleLoadMoreRef.current();
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    loadMoreObserverRef.current = observer;
  }, []);

  useEffect(() => {
    return () => loadMoreObserverRef.current?.disconnect();
  }, []);

  const toggleDropdown = (name: string) =>
    setActiveDropdown((cur) => (cur === name ? null : name));

  const handleBookmarkToggle = useCallback((id: string) => {
    setBookmarkedIds((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const totalCount = feedQuery.data?.pages[0]?.total ?? 0;

  return (
    <div className="min-h-full bg-transparent text-foreground">
      <div className="pointer-events-none fixed inset-0 z-[-1] bg-[radial-gradient(circle_at_78%_12%,rgba(139,37,255,0.15),transparent_28%),radial-gradient(circle_at_18%_90%,rgba(33,144,255,0.1),transparent_32%)]" />

      <section className="mx-auto max-w-full px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/moments")}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/60 transition hover:border-white/20 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-tech text-2xl font-bold tracking-tight text-white">ALL MOMENTS</h1>
              <p className="text-[11px] font-medium text-white/45">
                {totalCount > 0 ? `${totalCount.toLocaleString()} moments` : "Explore all moments"}
              </p>
            </div>
          </div>
        </div>

        {/* Filters bar */}
        <div className="relative z-30 mb-5 flex flex-wrap items-center gap-2">
          {/* Game dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("game")}
              className="flex h-[34px] cursor-pointer items-center justify-between gap-2.5 rounded border border-white/8 bg-[#0a0f1b]/60 px-3 py-1.5 font-tech text-[10px] font-bold uppercase text-white/70 transition hover:border-white/15 hover:text-white"
            >
              <span>{selectedGame}</span>
              <ChevronDown className="h-3.5 w-3.5 text-white/40" />
            </button>
            {activeDropdown === "game" ? (
              <>
                <div className="fixed inset-0 z-40" onClick={() => toggleDropdown("game")} />
                <div className="absolute left-0 z-50 mt-1 w-48 rounded border border-white/10 bg-[#080d19] p-1 shadow-xl">
                  {GAME_OPTIONS.map((game) => (
                    <button
                      key={game}
                      onClick={() => {
                        setSelectedGame(game);
                        setActiveDropdown(null);
                      }}
                      className={`w-full rounded px-2.5 py-1.5 text-left font-tech text-[10px] font-bold uppercase transition hover:bg-white/5 hover:text-white ${
                        selectedGame === game ? "bg-white/[0.02] text-purple-400" : "text-white/60"
                      }`}
                    >
                      {game}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {/* Media type chips */}
          {(["ALL", "IMAGE", "VIDEO"] as MediaFilter[]).map((opt) => {
            const isActive = selectedMedia === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setSelectedMedia(opt)}
                className={`flex h-[34px] items-center gap-1.5 rounded border px-3 font-tech text-[10px] font-bold uppercase tracking-wider transition ${
                  isActive
                    ? "border-purple-500/50 bg-purple-500/20 text-white"
                    : "border-white/8 bg-[#0a0f1b]/60 text-white/55 hover:border-white/15 hover:text-white"
                }`}
              >
                {opt === "VIDEO" ? <Video className="h-3 w-3" /> : opt === "IMAGE" ? <ImageIcon className="h-3 w-3" /> : null}
                <span>{opt === "ALL" ? "ALL TYPES" : opt}</span>
              </button>
            );
          })}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <div className="relative max-sm:w-full">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search moments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[34px] w-[220px] rounded border border-white/8 bg-[#0a0f1b]/60 py-1.5 pl-9 pr-3 text-xs text-white/86 placeholder-white/30 transition focus:border-purple-500/50 focus:outline-none max-sm:w-full"
            />
          </div>
        </div>

        {/* Grid */}
        {feedQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex animate-pulse flex-col">
                <div className="aspect-[16/9] rounded border border-white/8 bg-white/5" />
                <div className="mt-3 h-4 w-2/3 rounded bg-white/5" />
                <div className="mt-2 h-3 w-1/2 rounded bg-white/5" />
              </div>
            ))}
          </div>
        ) : filteredMoments.length === 0 ? (
          <div className="arena-panel border-white/8 bg-[#04080f]/80 p-12 text-center">
            <Video className="mx-auto h-10 w-10 text-white/20" />
            <p className="mt-3 text-sm font-semibold text-white/60">No moments found</p>
            <p className="mt-2 text-xs text-white/40">Try adjusting your filters or search.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedGame("ALL GAMES");
                setSelectedMedia("ALL");
                setSearchQuery("");
              }}
              className="mt-4 rounded border border-purple-500/25 px-4 py-2 font-tech text-[10px] font-bold uppercase text-purple-400 transition hover:bg-purple-500/10"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMoments.map((moment) => {
              const ct = resolveContentType(moment);
              const thumb = deriveThumbnail(moment);
              const gameLabel = matchGameLabel(moment);
              const isBookmarked = bookmarkedIds.has(moment.momentId);
              return (
                <div key={moment.momentId} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => navigate(`/moments/${moment.momentId}`)}
                    className="group relative aspect-[16/9] cursor-pointer overflow-hidden rounded border border-white/8 bg-black/40 text-left"
                  >
                    {ct === "video" && moment.assetUrl ? (
                      <video
                        src={moment.assetUrl}
                        poster={thumb}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        preload="metadata"
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={thumb}
                        alt={moment.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-all duration-300 group-hover:via-black/30" />

                    {/* Game badge */}
                    <div
                      className={`absolute left-3 top-3 rounded border px-2 py-0.5 font-tech text-[9px] font-black uppercase tracking-wide select-none ${
                        gameLabel === "ROBOWARS"
                          ? "border-sky-500/35 bg-sky-950/80 text-sky-400"
                          : gameLabel === "HIGHWAY HUSTLE"
                            ? "border-amber-500/35 bg-amber-950/80 text-amber-300"
                            : "border-purple-500/35 bg-purple-950/80 text-[#d6acff]"
                      }`}
                    >
                      {gameLabel}
                    </div>

                    {/* Media type badge */}
                    <div className="absolute right-3 top-3">
                      <div
                        className={`flex items-center gap-1 rounded border px-1.5 py-0.5 font-tech text-[9px] font-black tracking-wide ${
                          ct === "video"
                            ? "border-sky-400/30 bg-sky-950/80 text-sky-300"
                            : "border-emerald-400/30 bg-emerald-950/80 text-emerald-300"
                        }`}
                      >
                        {ct === "video" ? <Video className="h-2.5 w-2.5" /> : <ImageIcon className="h-2.5 w-2.5" />}
                        <span>{ct === "video" ? "VID" : "IMG"}</span>
                      </div>
                    </div>

                    {/* Play overlay for video */}
                    {ct === "video" ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-sm transition duration-300 group-hover:scale-110 group-hover:border-purple-400 group-hover:bg-[#9a35ff] group-hover:shadow-[0_0_15px_rgba(154,53,255,0.45)]">
                          <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
                        </div>
                      </div>
                    ) : null}
                  </button>

                  <div className="mt-3 flex flex-1 flex-col justify-between">
                    <div>
                      <h3
                        onClick={() => navigate(`/moments/${moment.momentId}`)}
                        className="cursor-pointer truncate text-sm font-semibold leading-snug text-white/90 transition hover:text-purple-400"
                      >
                        {moment.title || "Untitled Moment"}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-white/50">
                        <span>by {shortWallet(moment.playerWalletAddress)}</span>
                        <Hexagon className="h-3 w-3 fill-[#9a35ff] text-[#9a35ff]" />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-white/6 pt-3 text-xs font-semibold text-white/45">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-white/30" />
                          <span>—</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4 text-white/30" />
                          <span>{compactNum(moment.numLikes)}</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookmarkToggle(moment.momentId);
                        }}
                        className="cursor-pointer text-white/30 transition hover:text-purple-400"
                      >
                        <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-purple-500 text-purple-500" : ""}`} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div className="flex flex-col items-center gap-3 pt-6">
          <div
            ref={feedQuery.hasNextPage ? sentinelRefCallback : null}
            aria-hidden
            className="h-px w-full"
          />
          {feedQuery.isFetchingNextPage ? (
            <div className="flex items-center gap-2 font-tech text-[10px] font-bold uppercase tracking-wider text-purple-400/90">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Loading more moments</span>
            </div>
          ) : !feedQuery.hasNextPage && filteredMoments.length > 0 ? (
            <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-white/40">
              No more moments
            </span>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default AllMomentsPage;
