import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Pause,
  Play,
  Tag,
  Video,
  Image as ImageIcon,
  Hexagon,
  ExternalLink,
  Loader2,
  Trash2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { momentsApi } from "@/api/momentsApi";
import { MOMENTS_QUERY_KEY_ROOT } from "@/constants/moments";
import { useAuth } from "@/contexts/AuthContext";
import { requestOpenLoginModal } from "@/lib/loginModalBus";
import { MomentEngagementBar } from "@/components/moments/MomentEngagementBar";
import MomentThreadPanel from "@/components/moments/MomentThreadPanel";
import MomentShareDialog from "@/components/moments/MomentShareDialog";
import { EditMomentDialog } from "@/components/moments/EditMomentDialog";
import { isMomentOwner } from "@/lib/momentOwnership";
import type { Moment } from "@/types/api";

import momentWarzone from "@/assets/moment-warzone.png";
import momentRobowars from "@/assets/moment-robowars.png";
import momentFeatured from "@/assets/moment-featured.png";

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

function deriveGameLabel(moment: Moment): string {
  const hay = [...moment.relatedGames, ...moment.tags, moment.title].join(" ").toLowerCase();
  if (hay.includes("robo")) return "ROBOWARS";
  if (hay.includes("highway")) return "HIGHWAY HUSTLE";
  if (hay.includes("warzone")) return "WARZONE WARRIORS";
  if (hay.includes("ai-arena") || hay.includes("aiarena")) return "ARENA HIGHLIGHTS";
  const game = moment.relatedGames[0];
  return game ? game.replace(/[_-]/g, " ").toUpperCase() : "ARENA HIGHLIGHTS";
}

function deriveThumbnail(moment: Moment): string {
  const meta = moment.assetMetadata as Record<string, unknown> | undefined;
  if (meta) {
    for (const key of ["thumbnailUrl", "thumbnail", "posterUrl", "poster", "coverImage"]) {
      const val = meta[key];
      if (typeof val === "string" && val.trim()) return val.trim();
    }
  }
  if (moment.assetZgUrl) return moment.assetZgUrl;
  if (moment.assetUrl && /\.(png|jpe?g|gif|webp|avif)$/i.test(moment.assetUrl)) return moment.assetUrl;
  const hay = [...moment.relatedGames, ...moment.tags, moment.title].join(" ").toLowerCase();
  if (hay.includes("robo")) return momentRobowars;
  if (hay.includes("highway")) return momentFeatured;
  return momentWarzone;
}

function shortenWallet(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatDate(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ── Game badge ────────────────────────────────────────────────────────────────
function GameBadge({ game }: { game: string }) {
  if (game === "ROBOWARS") return <span className="rounded border border-sky-500/35 bg-sky-950/80 px-2 py-0.5 font-tech text-[9px] font-black uppercase tracking-wide text-sky-400">{game}</span>;
  if (game === "HIGHWAY HUSTLE") return <span className="rounded border border-amber-500/35 bg-amber-950/80 px-2 py-0.5 font-tech text-[9px] font-black uppercase tracking-wide text-amber-300">{game}</span>;
  return <span className="rounded border border-purple-500/35 bg-purple-950/80 px-2 py-0.5 font-tech text-[9px] font-black uppercase tracking-wide text-[#d6acff]">{game}</span>;
}

// ── Media player ──────────────────────────────────────────────────────────────
function MomentMediaPlayer({ moment }: { moment: Moment }) {
  const url = getMomentAssetUrl(moment);
  const isVideo = isMomentVideo(moment);
  const thumb = deriveThumbnail(moment);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [imageSrc, setImageSrc] = useState(url ?? thumb);

  useEffect(() => {
    setImageSrc(url ?? thumb);
  }, [url, thumb]);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    else { el.pause(); setPlaying(false); }
  };

  const stageClass =
    "relative aspect-video w-full overflow-hidden rounded-xl bg-[#0B0B0E]";
  const mediaClass = "absolute inset-0 h-full w-full object-contain";

  if (!url) {
    return (
      <div className={stageClass}>
        <img src={thumb} alt={moment.title} className={mediaClass} />
      </div>
    );
  }

  if (!isVideo) {
    return (
      <div className={stageClass}>
        <img
          src={imageSrc}
          alt={moment.title}
          className={mediaClass}
          loading="eager"
          decoding="async"
          onError={() => {
            if (imageSrc !== thumb) setImageSrc(thumb);
          }}
        />
      </div>
    );
  }

  return (
    <div className={stageClass}>
      <video
        ref={videoRef}
        src={url}
        poster={thumb}
        className={mediaClass}
        playsInline
        controls={playing}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      {!playing && (
        <button type="button" onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center transition"
          aria-label="Play video"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-black/50 backdrop-blur-sm shadow-lg transition hover:scale-105 hover:bg-[#9a35ff]/80">
            <Play className="ml-1 h-7 w-7 fill-white text-white" />
          </span>
        </button>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function MomentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, walletAddress } = useAuth();
  const queryClient = useQueryClient();
  const commentsRef = useRef<HTMLDivElement>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const momentQuery = useQuery({
    queryKey: [MOMENTS_QUERY_KEY_ROOT, "detail", id],
    queryFn: () => momentsApi.getById(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
    retry: 1,
  });

  const likeMutation = useMutation({
    mutationFn: () => momentsApi.like(id!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [MOMENTS_QUERY_KEY_ROOT, "detail", id] });
      toast.success("Moment liked");
    },
    onError: (e: unknown) => {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 409) { toast.info("Already liked"); return; }
      if (status === 401) { requestOpenLoginModal(); return; }
      toast.error("Could not like moment");
    },
  });

  const handleLike = () => {
    if (!isAuthenticated) { requestOpenLoginModal(); return; }
    likeMutation.mutate();
  };

  const deleteMutation = useMutation({
    mutationFn: () => momentsApi.remove(id!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [MOMENTS_QUERY_KEY_ROOT] });
      toast.success("Moment deleted");
      navigate("/moments");
    },
    onError: (e: unknown) => {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 401) { requestOpenLoginModal(); return; }
      if (status === 403 || status === 404) {
        toast.error("You can only delete your own moments");
        return;
      }
      toast.error("Could not delete moment");
    },
  });

  const handleDelete = () => {
    if (!isAuthenticated) { requestOpenLoginModal(); return; }
    deleteMutation.mutate();
  };

  const scrollToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (momentQuery.isLoading) {
    return (
      <div className="min-h-full bg-[#03070d] text-white">
        <div className="mx-auto max-w-[1284px] px-4 py-8 sm:px-6 lg:px-8">
          <button type="button" onClick={() => navigate("/moments")}
            className="mb-6 flex items-center gap-2 font-tech text-[11px] font-bold uppercase tracking-wider text-white/60 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Moments
          </button>
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-[#9a35ff]" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error / not found ────────────────────────────────────────────────────────
  if (momentQuery.isError || !momentQuery.data) {
    return (
      <div className="min-h-full bg-[#03070d] text-white">
        <div className="mx-auto max-w-[1284px] px-4 py-8 sm:px-6 lg:px-8">
          <button type="button" onClick={() => navigate("/moments")}
            className="mb-6 flex items-center gap-2 font-tech text-[11px] font-bold uppercase tracking-wider text-white/60 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Moments
          </button>
          <div className="arena-panel border-white/8 bg-[#04080f]/80 p-16 text-center">
            <p className="text-sm font-semibold text-white/60">Moment not found</p>
            <button type="button" onClick={() => navigate("/moments")}
              className="mt-4 rounded border border-purple-500/25 px-4 py-2 font-tech text-[10px] font-bold uppercase text-purple-400 transition hover:bg-purple-500/10"
            >
              Browse Moments
            </button>
          </div>
        </div>
      </div>
    );
  }

  const moment = momentQuery.data;
  const gameLabel = deriveGameLabel(moment);
  const isVideo = isMomentVideo(moment);
  const contentType = isVideo ? "video" : "image";
  const isOwner = isMomentOwner(walletAddress, moment);

  return (
    <div className="min-h-full bg-[#03070d] text-white">
      <div className="pointer-events-none fixed inset-0 z-[-1] bg-[radial-gradient(circle_at_78%_12%,rgba(139,37,255,0.12),transparent_28%),radial-gradient(circle_at_18%_90%,rgba(33,144,255,0.07),transparent_32%)]" />

      <section className="mx-auto max-w-[1284px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Back nav */}
        <button type="button" onClick={() => navigate("/moments")}
          className="mb-5 flex items-center gap-2 font-tech text-[11px] font-bold uppercase tracking-wider text-white/60 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Moments
        </button>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">

          {/* ── Main column ── */}
          <div className="min-w-0 space-y-5">

            <MomentMediaPlayer moment={moment} />

            {/* Title + meta */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-bold leading-snug text-white sm:text-2xl">
                    {moment.title || "Untitled Moment"}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-white/50">
                    <div className="flex items-center gap-1.5">
                      <span>by</span>
                      <span className="font-semibold text-white/80">{shortenWallet(moment.playerWalletAddress)}</span>
                      <Hexagon className="h-3 w-3 fill-[#9a35ff] text-[#9a35ff]" />
                    </div>
                    {moment.createdAt && <span>{formatDate(moment.createdAt)}</span>}
                  </div>
                </div>

                {/* Content type + game badges */}
                <div className="flex shrink-0 items-center gap-2">
                  <div className={`flex items-center gap-1 rounded border px-2 py-0.5 font-tech text-[9px] font-black tracking-wide ${contentType === "video" ? "border-sky-400/30 bg-sky-950/80 text-sky-300" : "border-emerald-400/30 bg-emerald-950/80 text-emerald-300"}`}>
                    {contentType === "video" ? <Video className="h-2.5 w-2.5" /> : <ImageIcon className="h-2.5 w-2.5" />}
                    <span>{contentType === "video" ? "VID" : "IMG"}</span>
                  </div>
                  <GameBadge game={gameLabel} />
                </div>
              </div>

              {/* Description */}
              {moment.description && (
                <p className="text-sm leading-relaxed text-white/60">{moment.description}</p>
              )}
              {moment.aiCaption && !moment.description && (
                <p className="text-sm leading-relaxed text-white/60">{moment.aiCaption}</p>
              )}

              {/* Tags */}
              {moment.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="h-3.5 w-3.5 shrink-0 text-white/30" />
                  {moment.tags.map((tag) => (
                    <span key={tag} className="rounded border border-white/8 bg-white/[0.04] px-2 py-0.5 font-tech text-[9px] text-white/50">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* AI analysis pill */}
              {moment.aiMomentType && (
                <div className="inline-flex items-center gap-2 rounded-full border border-[#9a35ff]/25 bg-[#9a35ff]/10 px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9a35ff]" />
                  <span className="font-tech text-[9px] font-bold uppercase tracking-wider text-[#c084fc]">
                    AI: {moment.aiMomentType.replace(/_/g, " ")}
                    {moment.aiRarity ? ` · ${moment.aiRarity}` : ""}
                    {typeof moment.aiRankScore === "number" ? ` · Score ${moment.aiRankScore}` : ""}
                  </span>
                </div>
              )}
            </div>

            <MomentEngagementBar
              moment={moment}
              bookmarked={bookmarked}
              onBookmarkToggle={() => setBookmarked((b) => !b)}
              onLike={handleLike}
              onComments={scrollToComments}
              isLiking={likeMutation.isPending}
            />

            {/* 0G storage proof (when available) */}
            {moment.assetZgHash && (
              <div className="rounded border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="font-tech font-bold uppercase tracking-wider">0G Storage Verified</span>
                  </div>
                  {moment.assetZgTxHash && (
                    <a
                      href={`https://chainscan.0g.ai/tx/${moment.assetZgTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-tech text-[9px] font-bold uppercase tracking-wider text-emerald-400/70 transition hover:text-emerald-400"
                    >
                      View proof <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <p className="mt-1 font-mono text-[9px] text-white/30 truncate">{moment.assetZgHash}</p>
              </div>
            )}

            {/* Comments section */}
            <div ref={commentsRef} id="comments" className="scroll-mt-4">
              <MomentThreadPanel moment={moment} />
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-4">

            {/* Moment stats */}
            <div className="arena-panel border-white/8 bg-[#04080f]/95 p-5 space-y-4">
              <h3 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">Moment Info</h3>
              <div className="divide-y divide-white/6 text-[11px] font-medium">
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-white/55">Creator</span>
                  <span className="font-tech font-bold text-white">{shortenWallet(moment.playerWalletAddress)}</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-white/55">Game</span>
                  <GameBadge game={gameLabel} />
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-white/55">Likes</span>
                  <span className="font-tech font-bold text-white">{moment.numLikes.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-white/55">Comments</span>
                  <span className="font-tech font-bold text-white">{moment.numComments.toLocaleString()}</span>
                </div>
                {moment.createdAt && (
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-white/55">Posted</span>
                    <span className="font-tech font-bold text-white">{formatDate(moment.createdAt)}</span>
                  </div>
                )}
                {moment.zgStatus && (
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-white/55">0G Status</span>
                    <span className={`font-tech font-bold uppercase ${moment.zgStatus === "stored" ? "text-emerald-400" : "text-white/60"}`}>
                      {moment.zgStatus}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* AI analysis card (when available) */}
            {(moment.aiStatus === "processed" || moment.aiCaption || moment.aiMomentType) && (
              <div className="arena-panel border-white/8 bg-[#04080f]/95 p-5 space-y-3">
                <h3 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">AI Analysis</h3>
                {moment.aiCaption && (
                  <p className="text-[11px] leading-relaxed text-white/60">{moment.aiCaption}</p>
                )}
                <div className="divide-y divide-white/6 text-[11px] font-medium">
                  {moment.aiMomentType && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-white/55">Type</span>
                      <span className="font-tech font-bold uppercase text-[#c084fc]">{moment.aiMomentType.replace(/_/g, " ")}</span>
                    </div>
                  )}
                  {moment.aiRarity && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-white/55">Rarity</span>
                      <span className="font-tech font-bold uppercase text-[#c084fc]">{moment.aiRarity}</span>
                    </div>
                  )}
                  {typeof moment.aiRankScore === "number" && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-white/55">Rank Score</span>
                      <span className="font-tech font-bold text-white">{moment.aiRankScore}</span>
                    </div>
                  )}
                  {typeof moment.aiSkillScore === "number" && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-white/55">Skill Score</span>
                      <span className="font-tech font-bold text-white">{moment.aiSkillScore}</span>
                    </div>
                  )}
                </div>
                {moment.aiHighlights.length > 0 && (
                  <div className="space-y-1">
                    <span className="font-tech text-[9px] font-bold uppercase tracking-wider text-white/40">Highlights</span>
                    <ul className="space-y-1">
                      {moment.aiHighlights.slice(0, 4).map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-white/60">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#9a35ff]/60" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Share */}
            <div className="arena-panel border-white/8 bg-[#04080f]/95 p-5 space-y-3">
              <h3 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">Share</h3>
              <MomentShareDialog moment={moment} triggerVariant="button" />
            </div>

            {isOwner && (
              <div className="arena-panel border-[#9a35ff]/20 bg-[#04080f]/95 p-5 space-y-3">
                <h3 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">Manage Moment</h3>
                <p className="text-[11px] leading-relaxed text-white/45">
                  You created this moment. Edit details or permanently remove it.
                </p>
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded border border-[#9a35ff]/35 bg-[#9a35ff]/12 px-4 py-2.5 font-tech text-[10px] font-bold uppercase tracking-wider text-[#d6acff] transition hover:border-[#9a35ff]/55 hover:bg-[#9a35ff]/20"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit moment
                </button>

                <div className="border-t border-white/8 pt-3 space-y-3">
                  <h4 className="font-tech text-[10px] font-semibold uppercase tracking-wider text-red-400/90">Danger Zone</h4>
                  <p className="text-[11px] leading-relaxed text-white/45">
                    Permanently remove this moment. This action cannot be undone.
                  </p>
                  {isConfirmingDelete ? (
                    <div className="flex flex-wrap items-center gap-2 rounded border border-red-500/25 bg-red-500/5 p-3">
                      <span className="font-tech text-[10px] font-bold text-red-400">Delete this moment?</span>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        className="rounded border border-red-500/40 bg-red-500/20 px-3 py-1.5 font-tech text-[9px] font-bold uppercase tracking-wider text-red-300 transition hover:bg-red-500/30 disabled:opacity-50"
                      >
                        {deleteMutation.isPending ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Loader2 className="h-3 w-3 animate-spin" /> Deleting…
                          </span>
                        ) : (
                          "Confirm delete"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(false)}
                        disabled={deleteMutation.isPending}
                        className="rounded border border-white/10 px-3 py-1.5 font-tech text-[9px] font-bold uppercase tracking-wider text-white/40 transition hover:text-white disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded border border-red-500/30 bg-red-500/10 px-4 py-2.5 font-tech text-[10px] font-bold uppercase tracking-wider text-red-400 transition hover:border-red-500/45 hover:bg-red-500/15"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete moment
                    </button>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>

      {isOwner ? (
        <EditMomentDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          moment={moment}
          onUpdated={async () => {
            await queryClient.invalidateQueries({ queryKey: [MOMENTS_QUERY_KEY_ROOT, "detail", id] });
            await queryClient.invalidateQueries({ queryKey: [MOMENTS_QUERY_KEY_ROOT] });
          }}
        />
      ) : null}
    </div>
  );
}

export default MomentDetailPage;
