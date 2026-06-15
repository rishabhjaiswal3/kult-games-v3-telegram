import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  Search,
  SlidersHorizontal,
  Flame,
  Zap,
  Trophy,
  Swords,
  Target,
  Shield,
  Eye,
  Heart,
  Bookmark,
  Share2,
  Play,
  Plus,
  Clock,
  Hexagon,
  Video,
  Image as ImageIcon,
  ThumbsUp,
  Calendar,
  Loader2,
} from "lucide-react";
import { momentsApi } from "@/api/momentsApi";
import {
  isMomentsCreateQueryOpen,
  KNOWN_MOMENT_GAME_LABELS,
  MOMENTS_BATTLE_ID_QUERY_PARAM,
  MOMENTS_CREATE_QUERY_PARAM,
  MOMENTS_HUB_PREVIEW_COUNT,
  MOMENTS_MY_AGENT_ID_QUERY_PARAM,
  MOMENTS_QUERY_KEY_ROOT,
} from "@/constants/moments";
import type { Moment, MomentsFeedResponse } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { requestOpenLoginModal } from "@/lib/loginModalBus";
import { CreateMomentDialog } from "@/components/moments/CreateMomentDialog";
import MomentShareDialog from "@/components/moments/MomentShareDialog";

import momentWarzone from "@/assets/moment-warzone.png";
import momentRobowars from "@/assets/moment-robowars.png";
import momentFeatured from "@/assets/moment-featured.png";


type MainTab = "DISCOVER" | "MY MOMENTS" | "BOOKMARKS" | "RECENTLY WATCHED";
type SubCategory = "TRENDING" | "EPIC PLAYS" | "TOP PLAYS" | "CLUTCH" | "KILLS" | "VICTORIES";

const SUB_CATEGORIES: SubCategory[] = [
  "TRENDING",
  "EPIC PLAYS",
  "TOP PLAYS",
  "CLUTCH",
  "KILLS",
  "VICTORIES",
];

function parseSubCategory(value: string | null): SubCategory | null {
  return SUB_CATEGORIES.includes(value as SubCategory) ? (value as SubCategory) : null;
}

function buildMomentsBrowseHref(filters: {
  category: SubCategory;
  game: string;
  mode: string;
  bestOf: string;
  time: string;
  q: string;
  tab: MainTab;
}) {
  const params = new URLSearchParams();
  params.set("category", filters.category);
  if (filters.game !== "ALL GAMES") params.set("game", filters.game);
  if (filters.mode !== "ALL MODES") params.set("mode", filters.mode);
  if (filters.bestOf !== "BEST OF") params.set("bestOf", filters.bestOf);
  if (filters.time !== "ANY TIME") params.set("time", filters.time);
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.tab !== "DISCOVER") params.set("tab", filters.tab);
  const query = params.toString();
  return query ? `/moments/browse?${query}` : "/moments/browse";
}

type MomentCard = {
  id: string;
  title: string;
  game: string;
  mode: string;
  duration: string;
  durationSeconds: number | null;
  creator: string;
  creatorAvatar: string;
  clanName: string;
  clanIconType: string;
  views: string;
  viewCount: number;
  likes: string;
  likeCount: number;
  isBookmarked: boolean;
  categories: Set<SubCategory>;
  thumbnail: string;
  description: string;
  contentType: "image" | "video";
  mediaUrl: string | undefined;
  raw: Moment;
};

type CreatorRow = {
  rank: number;
  name: string;
  avatar: string;
  viewsLabel: string;
};

const PAGE_SIZE = 9;
const CREATOR_AVATARS = [momentWarzone, momentRobowars, momentFeatured, momentWarzone, momentRobowars, momentFeatured];
const NOW_MS = () => Date.now();

function metadataRecord(moment: Moment): Record<string, unknown> | null {
  return moment.assetMetadata && typeof moment.assetMetadata === "object" ? moment.assetMetadata : null;
}

function metadataString(moment: Moment, keys: string[]): string | undefined {
  const metadata = metadataRecord(moment);
  if (!metadata) return undefined;
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function metadataNumber(moment: Moment, keys: string[]): number | undefined {
  const metadata = metadataRecord(moment);
  if (!metadata) return undefined;
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function shortWallet(value?: string) {
  if (!value) return "UNKNOWN";
  if (value.length <= 12) return value.toUpperCase();
  return `${value.slice(0, 6)}…${value.slice(-4)}`.toUpperCase();
}

function seededAvatar(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 1_000_003;
  return CREATOR_AVATARS[Math.abs(hash) % CREATOR_AVATARS.length]!;
}

function compactMetric(value: number | null | undefined) {
  if (!value || value <= 0) return "—";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function parseDurationValue(value: string | number | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  if (/^\d+$/.test(value.trim())) {
    const s = Number(value.trim());
    return Number.isFinite(s) && s > 0 ? s : null;
  }
  if (value.includes(":")) {
    const parts = value.split(":").map(Number);
    if (parts.some((p) => !Number.isFinite(p))) return null;
    return parts.reduce((t, p) => t * 60 + p, 0);
  }
  return null;
}

function formatDuration(value: string | number | undefined) {
  if (typeof value === "string" && value.includes(":")) return value;
  const total = parseDurationValue(value);
  if (!total) return "—";
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  if (h > 0) return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function matchKnownGameLabel(value: string) {
  const n = value.toLowerCase();
  if (n.includes("robo")) return "ROBOWARS";
  if (n.includes("highway")) return "HIGHWAY HUSTLE";
  if (n.includes("warzone")) return "WARZONE WARRIORS";
  return null;
}

function deriveGame(moment: Moment) {
  const candidates = [
    metadataString(moment, ["game", "gameName", "gameTitle"]),
    ...moment.relatedGames,
    ...moment.tags,
    moment.aiMomentType,
    moment.title,
  ].filter((v): v is string => Boolean(v));

  for (const c of candidates) {
    const matched = matchKnownGameLabel(c);
    if (matched) return matched;
  }

  const fallback = moment.relatedGames[0]?.replace(/[_-]/g, " ").trim();
  return fallback ? fallback.toUpperCase() : "ARENA HIGHLIGHTS";
}

function deriveMode(moment: Moment) {
  const hay = [
    metadataString(moment, ["mode", "matchMode", "playlist"]),
    ...moment.tags,
    ...moment.relatedGames,
    moment.title,
    moment.description,
  ].filter((v): v is string => Boolean(v)).join(" ").toLowerCase();

  if (hay.includes("autonomous")) return "AUTONOMOUS";
  if (hay.includes("5v5") || hay.includes("squad")) return "5V5 SHOWDOWN";
  if (hay.includes("1v1") || hay.includes("duel") || hay.includes("arena")) return "1V1 ARENA";
  return "ALL MODES";
}

function deriveClan(moment: Moment) {
  const hay = [
    metadataString(moment, ["clan", "chain", "network", "creatorClan"]),
    ...moment.tags,
    ...moment.relatedGames,
    moment.aiRarity,
  ].filter((v): v is string => Boolean(v)).join(" ").toLowerCase();

  if (hay.includes("solana")) return { clanName: "Solana", clanIconType: "solana" };
  if (hay.includes("base")) return { clanName: "Base", clanIconType: "base" };
  if (hay.includes("0g") || hay.includes("zerog")) return { clanName: "0G", clanIconType: "arena" };
  if (hay.includes("kult")) return { clanName: "Kult", clanIconType: "arena" };
  if (hay.includes("shadow")) return { clanName: "Shadow", clanIconType: "shadow" };
  if (hay.includes("rebel") || hay.includes("berserker")) return { clanName: "Rebel", clanIconType: "rebel" };
  return { clanName: "Arena", clanIconType: "mecha" };
}

function deriveCategories(moment: Moment): Set<SubCategory> {
  const memberships = new Set<SubCategory>(["TRENDING", "EPIC PLAYS"]);
  const hay = [moment.aiMomentType, moment.aiCaption, moment.title, moment.description, ...moment.tags, ...moment.aiHighlights]
    .filter((v): v is string => Boolean(v)).join(" ").toLowerCase();

  if (/(kill|eliminat|frag|headshot|multi[- ]?kill)/.test(hay)) memberships.add("KILLS");
  if (/(clutch|1v|last stand|comeback|surviv)/.test(hay)) memberships.add("CLUTCH");
  if (/(victory|win|champion|dominance|capture|defeat)/.test(hay)) memberships.add("VICTORIES");

  const engagement = (moment.numLikes ?? 0) + (moment.numComments ?? 0);
  if ((moment.aiRankScore ?? 0) >= 85 || engagement >= 3 || /(top play|highlight|mvp|perfect)/.test(hay)) {
    memberships.add("TOP PLAYS");
  }
  return memberships;
}

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|avi|mkv|ogv|m3u8)(?:\?.*)?$/i;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg|bmp)(?:\?.*)?$/i;

function isVideoMediaUrl(url: string | undefined) {
  return Boolean(url && VIDEO_EXT.test(url));
}

function gamePlaceholderThumbnail(game: string) {
  if (game === "ROBOWARS") return momentRobowars;
  if (game === "HIGHWAY HUSTLE") return momentFeatured;
  return momentWarzone;
}

function deriveContentType(moment: Moment): "image" | "video" {
  const ft = metadataString(moment, ["fileType", "mimeType", "contentType", "type"]);
  if (ft) {
    const n = ft.toLowerCase();
    if (n.startsWith("video/")) return "video";
    if (n.startsWith("image/")) return "image";
  }
  const url = moment.assetZgUrl ?? moment.assetUrl ?? "";
  if (VIDEO_EXT.test(url)) return "video";
  if (IMAGE_EXT.test(url)) return "image";
  return "image";
}

function deriveThumbnail(moment: Moment, game: string) {
  const explicit = metadataString(moment, ["thumbnailUrl", "thumbnail", "posterUrl", "poster", "coverImage", "imageUrl", "previewImage"]);
  if (explicit && !isVideoMediaUrl(explicit)) return explicit;
  if (moment.assetZgUrl && !isVideoMediaUrl(moment.assetZgUrl)) return moment.assetZgUrl;
  if (moment.assetUrl && IMAGE_EXT.test(moment.assetUrl)) return moment.assetUrl;
  return gamePlaceholderThumbnail(game);
}

function deriveViewCount(moment: Moment) {
  return metadataNumber(moment, ["views", "viewCount", "view_count", "impressions", "playCount"]) ?? 0;
}

function deriveCreator(moment: Moment) {
  return (metadataString(moment, ["creator", "creatorName", "playerName", "agentName"]) ?? shortWallet(moment.playerWalletAddress)).toUpperCase();
}

function deriveMomentDescription(moment: Moment) {
  return (
    moment.description?.trim() ??
    moment.aiCaption?.trim() ??
    (moment.aiHighlights.length > 0 ? moment.aiHighlights.join(" • ") : undefined) ??
    "Fresh arena footage pulled from the live Kult moments feed."
  );
}

function deriveMomentCard(moment: Moment, bookmarkedIds: Set<string>): MomentCard {
  const game = deriveGame(moment);
  const creator = deriveCreator(moment);
  const clan = deriveClan(moment);
  const durationSource = metadataString(moment, ["duration", "clipDuration", "videoDuration"]) ??
    metadataNumber(moment, ["durationSeconds", "clipDurationSeconds", "lengthSeconds"]);
  const durationSeconds = parseDurationValue(durationSource);
  const viewCount = deriveViewCount(moment);

  return {
    id: moment.momentId,
    title: (moment.title || moment.aiCaption || "Untitled Moment").trim(),
    game,
    mode: deriveMode(moment),
    duration: formatDuration(durationSource),
    durationSeconds,
    creator,
    creatorAvatar: seededAvatar(moment.momentId || creator),
    clanName: clan.clanName,
    clanIconType: clan.clanIconType,
    views: compactMetric(viewCount),
    viewCount,
    likes: compactMetric(moment.numLikes),
    likeCount: moment.numLikes,
    isBookmarked: bookmarkedIds.has(moment.momentId),
    categories: deriveCategories(moment),
    thumbnail: deriveThumbnail(moment, game),
    description: deriveMomentDescription(moment),
    contentType: deriveContentType(moment),
    mediaUrl: moment.assetZgUrl ?? moment.assetUrl,
    raw: moment,
  };
}

function dedupeMoments(moments: Moment[]) {
  const byId = new Map<string, Moment>();
  for (const m of moments) {
    if (!byId.has(m.momentId)) byId.set(m.momentId, m);
  }
  return [...byId.values()];
}

function isWithinTimeWindow(createdAt: string | undefined, selectedTime: string) {
  if (selectedTime === "ANY TIME") return true;
  if (!createdAt) return false;
  const ts = new Date(createdAt).getTime();
  if (!Number.isFinite(ts)) return false;
  const now = NOW_MS();
  if (selectedTime === "LAST 24 HOURS") return now - ts <= 24 * 60 * 60 * 1000;
  if (selectedTime === "THIS WEEK") return now - ts <= 7 * 24 * 60 * 60 * 1000;
  if (selectedTime === "THIS MONTH") return now - ts <= 30 * 24 * 60 * 60 * 1000;
  return true;
}

function sortMomentCards(cards: MomentCard[], selectedBestOf: string, creatorCounts: Map<string, number>) {
  return [...cards].sort((a, b) => {
    if (selectedBestOf === "MOST VIEWS") return b.viewCount - a.viewCount || b.likeCount - a.likeCount;
    if (selectedBestOf === "MOST LIKES") return b.likeCount - a.likeCount || b.viewCount - a.viewCount;
    if (selectedBestOf === "TOP CREATORS") return (creatorCounts.get(b.creator) ?? 0) - (creatorCounts.get(a.creator) ?? 0) || b.likeCount - a.likeCount;
    return (b.raw.aiRankScore ?? 0) - (a.raw.aiRankScore ?? 0) || b.likeCount - a.likeCount || b.viewCount - a.viewCount;
  });
}

function buildCreatorRows(cards: MomentCard[]): CreatorRow[] {
  const map = new Map<string, { name: string; avatar: string; totalViews: number; totalLikes: number; totalMoments: number }>();
  for (const card of cards) {
    const cur = map.get(card.creator) ?? { name: card.creator, avatar: card.creatorAvatar, totalViews: 0, totalLikes: 0, totalMoments: 0 };
    cur.totalViews += card.viewCount;
    cur.totalLikes += card.likeCount;
    cur.totalMoments += 1;
    map.set(card.creator, cur);
  }
  return [...map.values()]
    .sort((a, b) => b.totalLikes - a.totalLikes || b.totalViews - a.totalViews)
    .slice(0, 5)
    .map((c, i) => ({ rank: i + 1, name: c.name, avatar: c.avatar, viewsLabel: c.totalViews > 0 ? compactMetric(c.totalViews) : `${c.totalMoments} clips` }));
}

function pickFeaturedMoment(cards: MomentCard[]) {
  if (cards.length === 0) return null;
  return [...cards].sort((a, b) => (b.raw.aiRankScore ?? 0) - (a.raw.aiRankScore ?? 0) || b.likeCount - a.likeCount)[0]!;
}

function averageDurationLabel(cards: MomentCard[]) {
  const durations = cards.map((c) => c.durationSeconds).filter((v): v is number => typeof v === "number" && v > 0);
  if (durations.length === 0) return "—";
  return formatDuration(Math.round(durations.reduce((t, v) => t + v, 0) / durations.length));
}

function feedHasMore(lastPage: MomentsFeedResponse, allPages: MomentsFeedResponse[]) {
  const loaded = allPages.reduce((t, p) => t + p.moments.length, 0);
  if (lastPage.total > 0 && loaded >= lastPage.total) return false;
  if (lastPage.totalPages > 0 && lastPage.page >= lastPage.totalPages) return false;
  return lastPage.moments.length >= lastPage.perPage;
}

function ClanIconBadge({ type }: { type: string }) {
  const base = "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold";
  if (type === "solana") return <span className={`${base} bg-teal-400/20 text-teal-400`}>S</span>;
  if (type === "base") return <span className={`${base} bg-blue-500/20 text-blue-400`}>B</span>;
  if (type === "shadow") return <span className={`${base} bg-red-500/20 text-red-500`}>S</span>;
  if (type === "rebel") return <span className={`${base} bg-amber-400/20 text-amber-400`}>R</span>;
  return <span className={`${base} bg-gray-500/20 text-gray-400`}>A</span>;
}

function GameBadge({ game, size = "sm" }: { game: string; size?: "sm" | "xs" }) {
  const text = size === "xs" ? "font-tech text-[8px] font-black uppercase tracking-wide" : "font-tech text-[9px] font-black uppercase tracking-wide";
  if (game === "ROBOWARS") return <div className={`rounded border border-sky-500/35 bg-sky-950/80 px-2 py-0.5 text-sky-400 select-none ${text}`}>{game}</div>;
  if (game === "HIGHWAY HUSTLE") return <div className={`rounded border border-amber-500/35 bg-amber-950/80 px-2 py-0.5 text-amber-300 select-none ${text}`}>{game}</div>;
  return <div className={`rounded border border-purple-500/35 bg-purple-950/80 px-2 py-0.5 text-[#d6acff] select-none ${text}`}>{game}</div>;
}

function MediaTypeBadge({ contentType, size = "sm" }: { contentType: "image" | "video"; size?: "sm" | "xs" }) {
  const text = size === "xs" ? "font-tech text-[8px] font-black tracking-wide" : "font-tech text-[9px] font-black tracking-wide";
  if (contentType === "video") return (
    <div className={`flex items-center gap-1 rounded border border-sky-400/30 bg-sky-950/80 px-1.5 py-0.5 text-sky-300 ${text}`}>
      <Video className="h-2.5 w-2.5" /><span>VID</span>
    </div>
  );
  return (
    <div className={`flex items-center gap-1 rounded border border-emerald-400/30 bg-emerald-950/80 px-1.5 py-0.5 text-emerald-300 ${text}`}>
      <ImageIcon className="h-2.5 w-2.5" /><span>IMG</span>
    </div>
  );
}

// ── Dropdown ──────────────────────────────────────────────────────────────────
function FilterDropdown({ label, options, value, onSelect, activeDropdown, name, onToggle }: {
  label: string; options: string[]; value: string;
  onSelect: (v: string) => void;
  activeDropdown: string | null; name: string; onToggle: (n: string) => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={() => onToggle(name)}
        className="flex h-[34px] max-w-[9.5rem] cursor-pointer items-center justify-between gap-1.5 rounded border border-white/8 bg-[#0a0f1b]/60 px-2.5 py-1.5 font-tech text-[9px] font-bold uppercase text-white/70 transition hover:border-white/15 hover:text-white sm:max-w-[10.5rem] sm:px-3 sm:text-[10px]"
      >
        <span className="truncate">{value}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-white/40" />
      </button>
      {activeDropdown === name && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => onToggle(name)} />
          <div className="absolute left-0 z-50 mt-1 w-44 rounded border border-white/10 bg-[#080d19] p-1 shadow-xl">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onSelect(opt); onToggle(name); }}
                className={`w-full rounded px-2.5 py-1.5 text-left font-tech text-[10px] font-bold uppercase transition hover:bg-white/5 hover:text-white ${value === opt ? "bg-white/[0.02] text-purple-400" : "text-white/60"}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function AllMomentsPage() {
  const location = useLocation();
  const isBrowseAll = location.pathname === "/moments/browse";

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<MainTab>(() => {
    if (location.pathname !== "/moments/browse") return "DISCOVER";
    const tab = searchParams.get("tab");
    if (tab === "MY MOMENTS" || tab === "BOOKMARKS" || tab === "RECENTLY WATCHED") return tab;
    return "DISCOVER";
  });
  const [activeCategory, setActiveCategory] = useState<SubCategory>(() => {
    if (location.pathname !== "/moments/browse") return "TRENDING";
    return parseSubCategory(searchParams.get("category")) ?? "TRENDING";
  });
  const [selectedGame, setSelectedGame] = useState(() =>
    location.pathname === "/moments/browse" ? searchParams.get("game") ?? "ALL GAMES" : "ALL GAMES",
  );
  const [selectedMode, setSelectedMode] = useState(() =>
    location.pathname === "/moments/browse" ? searchParams.get("mode") ?? "ALL MODES" : "ALL MODES",
  );
  const [selectedBestOf, setSelectedBestOf] = useState(() =>
    location.pathname === "/moments/browse" ? searchParams.get("bestOf") ?? "BEST OF" : "BEST OF",
  );
  const [selectedTime, setSelectedTime] = useState(() =>
    location.pathname === "/moments/browse" ? searchParams.get("time") ?? "ANY TIME" : "ANY TIME",
  );
  const [searchQuery, setSearchQuery] = useState(() =>
    location.pathname === "/moments/browse" ? searchParams.get("q") ?? "" : "",
  );
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [recentlyWatchedIds, setRecentlyWatchedIds] = useState<Set<string>>(new Set());
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const navigate = useNavigate();
  const [createSearchParams, setSearchParams] = useSearchParams();
  const battleIdParam = createSearchParams.get(MOMENTS_BATTLE_ID_QUERY_PARAM);
  const myAgentIdParam = createSearchParams.get(MOMENTS_MY_AGENT_ID_QUERY_PARAM);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const deferredSearch = useDeferredValue(searchQuery.trim());

  const syncCreateQueryParam = useCallback(
    (open: boolean) => {
      const next = new URLSearchParams(createSearchParams);
      if (open) next.set(MOMENTS_CREATE_QUERY_PARAM, "true");
      else {
        next.delete(MOMENTS_CREATE_QUERY_PARAM);
        next.delete(MOMENTS_BATTLE_ID_QUERY_PARAM);
        next.delete(MOMENTS_MY_AGENT_ID_QUERY_PARAM);
      }
      const nextSearch = next.toString();
      const currentSearch = createSearchParams.toString();
      if (nextSearch !== currentSearch) {
        setSearchParams(next, { replace: true });
      }
    },
    [createSearchParams, setSearchParams],
  );

  const handleCreateOpenChange = useCallback(
    (open: boolean) => {
      if (open && !isAuthenticated) {
        syncCreateQueryParam(true);
        requestOpenLoginModal();
        return;
      }
      setIsCreateOpen(open);
      syncCreateQueryParam(open);
    },
    [isAuthenticated, syncCreateQueryParam],
  );

  useEffect(() => {
    const shouldOpen =
      isMomentsCreateQueryOpen(createSearchParams.get(MOMENTS_CREATE_QUERY_PARAM)) ||
      Boolean(createSearchParams.get(MOMENTS_BATTLE_ID_QUERY_PARAM)?.trim());
    if (!shouldOpen) {
      setIsCreateOpen(false);
      return;
    }
    if (!isAuthenticated) {
      requestOpenLoginModal();
      return;
    }
    setIsCreateOpen(true);
  }, [createSearchParams, isAuthenticated]);

  useEffect(() => {
    if (!isBrowseAll) return;
    const params = new URLSearchParams();
    params.set("category", activeCategory);
    if (selectedGame !== "ALL GAMES") params.set("game", selectedGame);
    if (selectedMode !== "ALL MODES") params.set("mode", selectedMode);
    if (selectedBestOf !== "BEST OF") params.set("bestOf", selectedBestOf);
    if (selectedTime !== "ANY TIME") params.set("time", selectedTime);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (activeTab !== "DISCOVER") params.set("tab", activeTab);
    const createFlag = createSearchParams.get(MOMENTS_CREATE_QUERY_PARAM);
    if (createFlag) params.set(MOMENTS_CREATE_QUERY_PARAM, createFlag);
    const battleId = createSearchParams.get(MOMENTS_BATTLE_ID_QUERY_PARAM);
    if (battleId) params.set(MOMENTS_BATTLE_ID_QUERY_PARAM, battleId);
    const myAgentId = createSearchParams.get(MOMENTS_MY_AGENT_ID_QUERY_PARAM);
    if (myAgentId) params.set(MOMENTS_MY_AGENT_ID_QUERY_PARAM, myAgentId);
    const nextSearch = params.toString();
    if (nextSearch !== createSearchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [
    activeCategory,
    activeTab,
    createSearchParams,
    isBrowseAll,
    searchQuery,
    selectedBestOf,
    selectedGame,
    selectedMode,
    selectedTime,
    setSearchParams,
  ]);

  const discoverQuery = useInfiniteQuery({
    queryKey: [MOMENTS_QUERY_KEY_ROOT, "discover", deferredSearch],
    queryFn: ({ pageParam }) => momentsApi.list({ page: pageParam, perPage: PAGE_SIZE, searchQuery: deferredSearch || undefined }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages, lastPageParam) => feedHasMore(lastPage, allPages) ? lastPageParam + 1 : undefined,
    staleTime: 30_000,
    retry: 1,
  });

  const discoverMoments = useMemo(() => discoverQuery.data?.pages.flatMap((p) => p.moments) ?? [], [discoverQuery.data]);
  const allKnownMoments = useMemo(() => dedupeMoments(discoverMoments), [discoverMoments]);

  const creatorMomentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of allKnownMoments) {
      const c = deriveCreator(m);
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return counts;
  }, [allKnownMoments]);

  const discoverCards = useMemo(() => discoverMoments.map((m) => deriveMomentCard(m, bookmarkedIds)), [discoverMoments, bookmarkedIds]);
  const allKnownCards = useMemo(() => allKnownMoments.map((m) => deriveMomentCard(m, bookmarkedIds)), [allKnownMoments, bookmarkedIds]);
  const featuredMoment = useMemo(() => pickFeaturedMoment(discoverCards), [discoverCards]);

  const sourceCards = useMemo(() => {
    if (activeTab === "BOOKMARKS") return allKnownCards.filter((c) => bookmarkedIds.has(c.id));
    if (activeTab === "RECENTLY WATCHED") return allKnownCards.filter((c) => recentlyWatchedIds.has(c.id));
    return discoverCards;
  }, [activeTab, allKnownCards, bookmarkedIds, discoverCards, recentlyWatchedIds]);

  const filteredMoments = useMemo(() => {
    const cards = sourceCards.filter((card) => {
      if (!card.categories.has(activeCategory)) return false;
      if (selectedGame !== "ALL GAMES" && card.game !== selectedGame) return false;
      if (selectedMode !== "ALL MODES" && card.mode !== selectedMode) return false;
      if (!isWithinTimeWindow(card.raw.createdAt, selectedTime)) return false;
      if (deferredSearch) {
        const hay = [card.title, card.creator, card.game, card.description, card.raw.playerWalletAddress].join(" ").toLowerCase();
        if (!hay.includes(deferredSearch.toLowerCase())) return false;
      }
      return true;
    });
    return sortMomentCards(cards, selectedBestOf, creatorMomentCounts);
  }, [activeCategory, creatorMomentCounts, deferredSearch, selectedBestOf, selectedGame, selectedMode, selectedTime, sourceCards]);

  const displayMoments = useMemo(
    () => (isBrowseAll ? filteredMoments : filteredMoments.slice(0, MOMENTS_HUB_PREVIEW_COUNT)),
    [filteredMoments, isBrowseAll],
  );

  const browseHref = useMemo(
    () =>
      buildMomentsBrowseHref({
        category: activeCategory,
        game: selectedGame,
        mode: selectedMode,
        bestOf: selectedBestOf,
        time: selectedTime,
        q: searchQuery,
        tab: activeTab,
      }),
    [activeCategory, activeTab, searchQuery, selectedBestOf, selectedGame, selectedMode, selectedTime],
  );

  const showViewMore =
    !isBrowseAll && activeTab === "DISCOVER" && !discoverQuery.isLoading && filteredMoments.length > 0;

  const stats = useMemo(() => {
    const totalMoments = discoverQuery.data?.pages[0]?.total ?? discoverCards.length;
    const totalLikes = discoverCards.reduce((t, c) => t + c.likeCount, 0);
    const totalViews = discoverCards.reduce((t, c) => t + c.viewCount, 0);
    const thisWeek = discoverCards.filter((c) => isWithinTimeWindow(c.raw.createdAt, "THIS WEEK")).length;
    return {
      totalMoments,
      thisWeek,
      totalViews: totalViews > 0 ? compactMetric(totalViews) : "—",
      totalLikes: compactMetric(totalLikes),
      averageWatchTime: averageDurationLabel(discoverCards),
    };
  }, [discoverCards, discoverQuery.data]);

  const topCreators = useMemo(() => buildCreatorRows(discoverCards), [discoverCards]);

  const canLoadMore = isBrowseAll && activeTab === "DISCOVER" && Boolean(discoverQuery.hasNextPage);
  const isLoadingMore = isBrowseAll && activeTab === "DISCOVER" && discoverQuery.isFetchingNextPage;

  const handleLoadMoreRef = useRef(() => {});
  handleLoadMoreRef.current = () => { if (canLoadMore) void discoverQuery.fetchNextPage(); };

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRefCallback = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) handleLoadMoreRef.current(); },
      { rootMargin: "240px" },
    );
    io.observe(node);
    observerRef.current = io;
  }, []);

  useEffect(() => () => { observerRef.current?.disconnect(); }, []);

  const handleBookmarkToggle = useCallback((id: string) => {
    setBookmarkedIds((cur) => { const next = new Set(cur); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);

  const openMoment = useCallback((card: MomentCard | null) => {
    if (!card) return;
    setRecentlyWatchedIds((cur) => new Set([card.id, ...[...cur].filter((x) => x !== card.id)].slice(0, 24)));
    navigate(`/moments/${card.id}`);
  }, [navigate]);

  const toggleDropdown = (name: string) => setActiveDropdown((cur) => cur === name ? null : name);

  const emptyState = useMemo(() => {
    if (activeTab === "MY MOMENTS" && !isAuthenticated) return { title: "Connect your wallet to view your moments", action: "Your personal clips will appear here once you sign in." };
    if (discoverQuery.isError) return { title: "Could not load moments right now", action: "Please try again in a moment." };
    if (activeTab === "BOOKMARKS") return { title: "No bookmarked moments yet", action: "Save a few clips and they will show up here." };
    if (activeTab === "RECENTLY WATCHED") return { title: "No recently watched moments yet", action: "Open a few clips and they will appear here." };
    if (activeTab === "MY MOMENTS") return { title: "No moments found for your wallet yet", action: "Record and register a moment to see it here." };
    return { title: "No moments found matching filters", action: "Try adjusting your filters or search terms." };
  }, [activeTab, discoverQuery.isError, isAuthenticated]);

  return (
    <div className="min-h-full text-white" style={{ backgroundColor: "#03070d" }}>
      <div className="pointer-events-none fixed inset-0 z-[-1] bg-[radial-gradient(circle_at_78%_12%,rgba(139,37,255,0.15),transparent_28%),radial-gradient(circle_at_18%_90%,rgba(33,144,255,0.1),transparent_32%)]" />

      <section className="mx-auto max-w-[1284px] px-4 py-5 sm:px-6 lg:px-8">
        <div className={isBrowseAll ? "min-w-0 space-y-4" : "grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]"}>

          <div className="min-w-0 space-y-4">
            {isBrowseAll ? (
              <Link
                to="/moments"
                className="inline-flex items-center gap-2 font-tech text-[10px] font-bold uppercase tracking-wider text-white/55 transition hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Moments
              </Link>
            ) : null}

            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="font-tech text-3xl font-bold tracking-tight text-white">
                  {isBrowseAll ? "ALL MOMENTS" : "MOMENTS"}
                </h1>
                <p className="mt-1 text-[11px] font-medium text-white/55">
                  {isBrowseAll
                    ? `Browsing ${activeCategory.toLowerCase()} clips with your current filters.`
                    : "Epic plays, insane clutches, and legendary victories. Replay and share your best battles."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCreateOpenChange(true)}
                className="flex h-10 cursor-pointer items-center gap-2 rounded-md bg-[#9a35ff] px-4 font-tech text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_0_15px_rgba(154,53,255,0.3)] transition hover:bg-[#8525eb] hover:shadow-[0_0_20px_rgba(154,53,255,0.5)]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Moment</span>
              </button>
            </div>

            <div className="-mx-1 flex items-center gap-4 overflow-x-auto border-b border-white/8 px-1 text-xs font-bold tracking-wide scrollbar-none select-none sm:gap-6">
              {(["DISCOVER", "MY MOMENTS", "BOOKMARKS", "RECENTLY WATCHED"] as MainTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative shrink-0 cursor-pointer pb-2.5 uppercase transition-all hover:text-white ${activeTab === tab ? "text-white" : "text-white/45"}`}
                >
                  {tab}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9a35ff]" />}
                </button>
              ))}
            </div>

            <div className="relative z-30 flex min-w-0 flex-wrap items-center gap-2">
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <FilterDropdown label="Game" options={["ALL GAMES", ...KNOWN_MOMENT_GAME_LABELS]} value={selectedGame} onSelect={setSelectedGame} activeDropdown={activeDropdown} name="game" onToggle={toggleDropdown} />
                <FilterDropdown label="Mode" options={["ALL MODES", "1V1 ARENA", "5V5 SHOWDOWN", "AUTONOMOUS"]} value={selectedMode} onSelect={setSelectedMode} activeDropdown={activeDropdown} name="mode" onToggle={toggleDropdown} />
                <FilterDropdown label="Best of" options={["BEST OF", "MOST VIEWS", "MOST LIKES", "TOP CREATORS"]} value={selectedBestOf} onSelect={setSelectedBestOf} activeDropdown={activeDropdown} name="bestOf" onToggle={toggleDropdown} />
                <FilterDropdown label="Time" options={["ANY TIME", "LAST 24 HOURS", "THIS WEEK", "THIS MONTH"]} value={selectedTime} onSelect={setSelectedTime} activeDropdown={activeDropdown} name="time" onToggle={toggleDropdown} />
              </div>
              <div className="flex min-w-[10rem] flex-1 basis-[10rem] items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search moments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-[34px] w-full min-w-0 rounded border border-white/8 bg-[#0a0f1b]/60 py-1.5 pl-9 pr-3 text-xs text-white/86 placeholder-white/30 transition focus:border-purple-500/50 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  className="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded border border-white/8 bg-[#0a0f1b]/60 p-2 text-white/60 transition hover:border-white/15 hover:text-white"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-1.5 pt-1 sm:grid-cols-3 2xl:grid-cols-6">
              {[
                { label: "TRENDING", Icon: Flame, desc: "Most popular" },
                { label: "EPIC PLAYS", Icon: Zap, desc: "Insane plays" },
                { label: "TOP PLAYS", Icon: Trophy, desc: "Community voted" },
                { label: "CLUTCH", Icon: Swords, desc: "1vX & Comebacks" },
                { label: "KILLS", Icon: Target, desc: "Multi kills" },
                { label: "VICTORIES", Icon: Shield, desc: "Epic wins" },
              ].map(({ label, Icon, desc }) => {
                const isActive = activeCategory === label;
                return (
                  <button
                    key={label}
                    onClick={() => setActiveCategory(label as SubCategory)}
                    className={`arena-panel flex min-w-0 cursor-pointer flex-col items-start border-white/8 bg-[#04080f]/90 p-2 text-left transition sm:p-2.5 ${
                      isActive ? "border-purple-500/40 bg-gradient-to-br from-purple-950/40 to-purple-900/10 shadow-[0_0_12px_rgba(154,53,255,0.1)]" : "hover:border-white/15 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-1">
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-[#b95cff]" : "text-white/45"}`} />
                      <span className="truncate font-tech text-[9px] font-bold leading-tight tracking-wide sm:text-[10px]">{label}</span>
                    </div>
                    <span className="mt-1 line-clamp-2 text-[7px] font-semibold uppercase leading-snug text-white/45 sm:text-[8px]">{desc}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 pt-3">
              <h2 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">{activeCategory} MOMENTS</h2>
              {showViewMore ? (
                <Link
                  to={browseHref}
                  className="inline-flex shrink-0 items-center gap-1.5 font-tech text-[10px] font-bold uppercase tracking-wider text-[#d6acff] transition hover:text-white"
                >
                  View More
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>

            {discoverQuery.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex animate-pulse flex-col">
                    <div className="aspect-[16/9] rounded border border-white/8 bg-white/5" />
                    <div className="mt-3 h-4 w-2/3 rounded bg-white/5" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-white/5" />
                    <div className="mt-4 h-4 w-full rounded bg-white/5" />
                  </div>
                ))}
              </div>
            ) : filteredMoments.length === 0 ? (
              <div className="arena-panel border-white/8 bg-[#04080f]/80 p-12 text-center">
                <Video className="mx-auto h-10 w-10 text-white/20" />
                <p className="mt-3 text-sm font-semibold text-white/60">{emptyState.title}</p>
                <p className="mt-2 text-xs text-white/40">{emptyState.action}</p>
                <button
                  onClick={() => { setSelectedGame("ALL GAMES"); setSelectedMode("ALL MODES"); setSelectedBestOf("BEST OF"); setSelectedTime("ANY TIME"); setSearchQuery(""); }}
                  className="mt-4 rounded border border-purple-500/25 px-4 py-2 font-tech text-[10px] font-bold uppercase text-purple-400 transition hover:bg-purple-500/10"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayMoments.map((item) => (
                  <div key={item.id} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => openMoment(item)}
                      className="group relative aspect-[16/9] cursor-pointer overflow-hidden rounded border border-white/8 bg-black/40 text-left"
                    >
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-all duration-300 group-hover:via-black/30" />
                      <div className="absolute left-3 top-3"><GameBadge game={item.game} /></div>
                      <div className="absolute right-3 top-3 flex items-center gap-1.5">
                        <MediaTypeBadge contentType={item.contentType} />
                        <div className="rounded border border-white/10 bg-[#03070d]/80 px-1.5 py-0.5 font-tech text-[9px] font-black tracking-wide text-white">{item.duration}</div>
                      </div>
                      {item.contentType === "video" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-sm transition duration-300 group-hover:scale-110 group-hover:border-purple-400 group-hover:bg-[#9a35ff] group-hover:shadow-[0_0_15px_rgba(154,53,255,0.45)]">
                            <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
                          </div>
                        </div>
                      )}
                    </button>

                    <div className="mt-3 flex flex-1 flex-col justify-between">
                      <div>
                        <h3 onClick={() => openMoment(item)} className="cursor-pointer truncate text-sm font-semibold leading-snug text-white/90 transition hover:text-purple-400">
                          {item.title}
                        </h3>
                        <div className="mt-1.5 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                            <span>by {item.creator}</span>
                            <Hexagon className="h-3 w-3 fill-[#9a35ff] text-[#9a35ff]" />
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                            <ClanIconBadge type={item.clanIconType} />
                            <span className="max-w-[90px] truncate">{item.clanName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-white/6 pt-3 text-xs font-semibold text-white/45">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><Eye className="h-4 w-4 text-white/30" />{item.views}</span>
                          <span className="flex items-center gap-1"><Heart className="h-4 w-4 text-white/30" />{item.likes}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="inline-flex h-8 w-8 items-center justify-center text-white/30 transition hover:text-purple-400"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <MomentShareDialog moment={item.raw} triggerVariant="icon" />
                          </div>
                          <button type="button" onClick={() => handleBookmarkToggle(item.id)} className="cursor-pointer text-white/30 transition hover:text-purple-400">
                            <Bookmark className={`h-4 w-4 ${item.isBookmarked ? "fill-purple-500 text-purple-500" : ""}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isBrowseAll && activeTab === "DISCOVER" ? (
              <div className="relative z-10 flex flex-col items-center gap-3 pt-4">
                <div ref={canLoadMore ? sentinelRefCallback : null} aria-hidden className="h-px w-full" />
                {isLoadingMore ? (
                  <div className="flex items-center gap-2 font-tech text-[10px] font-bold uppercase tracking-wider text-purple-400/90">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /><span>LOADING MORE MOMENTS</span>
                  </div>
                ) : !canLoadMore && filteredMoments.length > 0 ? (
                  <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-white/40">NO MORE MOMENTS</span>
                ) : null}
              </div>
            ) : null}
          </div>

          {!isBrowseAll ? (
          <aside className="space-y-4">

            {/* Featured moment */}
            <div className="arena-panel relative space-y-4 overflow-hidden border-white/8 bg-[#04080f]/95 p-5">
              <h3 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">FEATURED MOMENT</h3>

              <button
                type="button"
                onClick={() => openMoment(featuredMoment)}
                className="group relative aspect-[16/10] w-full cursor-pointer overflow-hidden rounded border border-white/8 bg-black/40 text-left"
              >
                <img
                  src={featuredMoment?.thumbnail ?? momentFeatured}
                  alt={featuredMoment?.title ?? "Featured Moment"}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute left-3 top-3"><GameBadge game={featuredMoment?.game ?? "ARENA HIGHLIGHTS"} size="xs" /></div>
                <div className="absolute right-3 top-3 flex items-center gap-1.5">
                  <MediaTypeBadge contentType={featuredMoment?.contentType ?? "image"} size="xs" />
                  <div className="rounded border border-white/10 bg-[#03070d]/80 px-1.5 py-0.5 font-tech text-[8px] font-black tracking-wide text-white">{featuredMoment?.duration ?? "—"}</div>
                </div>
                {featuredMoment?.contentType === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-sm transition duration-300 group-hover:scale-110 group-hover:border-purple-400 group-hover:bg-[#9a35ff] group-hover:shadow-[0_0_15px_rgba(154,53,255,0.5)]">
                      <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
                    </div>
                  </div>
                )}
              </button>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="cursor-pointer text-sm font-bold text-white transition hover:text-purple-400">
                    {featuredMoment?.title ?? "No featured moment yet"}
                  </h4>
                  <div className="flex shrink-0 items-center gap-1 text-[10px] text-white/50">
                    <span>by {featuredMoment?.creator ?? "ARENA"}</span>
                    <Hexagon className="h-3 w-3 fill-[#9a35ff] text-[#9a35ff]" />
                  </div>
                </div>
                <p className="text-[11px] font-medium leading-relaxed text-white/55">
                  {featuredMoment?.description ?? "As soon as fresh moments land in the feed, the best-performing clip shows up here."}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-white/6 pt-3 text-[10px] font-semibold text-white/45">
                <span className="flex items-center gap-1.5"><Eye className="h-4 w-4 text-white/30" />{featuredMoment?.views ?? "—"}</span>
                <span className="flex items-center gap-1.5"><Heart className="h-4 w-4 text-white/30" />{featuredMoment?.likes ?? "—"}</span>
                <span className="flex items-center gap-1.5"><Share2 className="h-4 w-4 text-white/30" />{featuredMoment ? featuredMoment.raw.numComments.toLocaleString() : "—"}</span>
              </div>

              <button
                type="button"
                onClick={() => openMoment(featuredMoment)}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded bg-[#9a35ff] py-2.5 font-tech text-[10px] font-bold uppercase tracking-wider text-white shadow-[0_0_15px_rgba(154,53,255,0.3)] transition hover:bg-[#8525eb] hover:shadow-[0_0_20px_rgba(154,53,255,0.5)]"
              >
                <span>WATCH NOW</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Moments stats */}
            <div className="arena-panel relative space-y-4 overflow-hidden border-white/8 bg-[#04080f]/95 p-5">
              <h3 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">MOMENTS STATS</h3>
              <div className="divide-y divide-white/6 text-[11px] font-medium">
                {[
                  { Icon: Video,    label: "Total Moments", value: stats.totalMoments.toLocaleString(), badge: null },
                  { Icon: Calendar, label: "This Week",     value: stats.thisWeek.toLocaleString(), badge: "LIVE" },
                  { Icon: Eye,      label: "Total Views",   value: stats.totalViews, badge: null },
                  { Icon: ThumbsUp, label: "Total Likes",   value: stats.totalLikes, badge: null },
                  { Icon: Clock,    label: "Avg. Watch Time", value: stats.averageWatchTime, badge: null },
                ].map(({ Icon, label, value, badge }) => (
                  <div key={label} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2.5 text-white/55">
                      <Icon className="h-4 w-4 text-white/30" />
                      <span>{label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-tech font-bold text-white">{value}</span>
                      {badge && <span className="ml-1 rounded border border-emerald-500/20 bg-emerald-500/10 px-1 py-0.5 text-[8px] font-bold text-emerald-400 select-none">{badge}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top creators */}
            <div className="arena-panel relative space-y-4 overflow-hidden border-white/8 bg-[#04080f]/95 p-5">
              <h3 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">TOP CREATORS</h3>
              <div className="space-y-3 text-xs font-semibold">
                {topCreators.length === 0 ? (
                  <div className="rounded border border-white/8 bg-white/[0.02] px-3 py-4 text-center text-white/45">
                    Creator stats appear as soon as the live feed returns moments.
                  </div>
                ) : topCreators.map((creator) => (
                  <div key={`${creator.rank}-${creator.name}`} className="flex items-center justify-between py-0.5">
                    <div className="flex items-center gap-3">
                      <span className="w-3 text-center font-tech text-[10px] font-black text-white/45">{creator.rank}</span>
                      <div className="h-7 w-7 overflow-hidden rounded-full border border-white/10 bg-white/5">
                        <img src={creator.avatar} alt={creator.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex items-center gap-1 text-white/90">
                        <span>{creator.name}</span>
                        <Hexagon className="h-3 w-3 fill-[#9a35ff] text-[#9a35ff]" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-white/55">
                      <Eye className="h-3.5 w-3.5 text-white/30" /><span>{creator.viewsLabel}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
          ) : null}
        </div>
      </section>

      <CreateMomentDialog
        open={isCreateOpen}
        onOpenChange={handleCreateOpenChange}
        battleId={battleIdParam}
        myAgentId={myAgentIdParam}
        onCreated={() => void queryClient.invalidateQueries({ queryKey: [MOMENTS_QUERY_KEY_ROOT] })}
      />
    </div>
  );
}

export default AllMomentsPage;
