import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Loader2, Trash2, Video as VideoIcon, X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import {
  ArenaDialogBody,
  ArenaDialogContent,
  ArenaDialogDescription,
  ArenaDialogFooter,
  ArenaDialogHeader,
  ArenaDialogTitle,
} from "@/components/ui/arena-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { momentsApi } from "@/api/momentsApi";
import { compressMomentMediaFile } from "@/lib/compressMomentMedia";
import { BattleTrashTalkError, resolveBattleTrashTalkDraft } from "@/lib/battleTrashTalkMoment";
import {
  KNOWN_MOMENT_GAMES,
  MOMENT_ACCEPTED_MIME_TYPES,
  MOMENT_FILE_INPUT_ACCEPT,
  MOMENT_IMAGE_COMPRESS,
  MOMENT_MEDIA_LIMITS,
  momentImageUploadHint,
} from "@/constants/moments";
import type { CreateMomentResponse } from "@/types/api";

export type CreateMomentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (response: CreateMomentResponse) => void | Promise<void>;
  /** When set, pre-fills trash-talk title, winning commentary, and artwork. */
  battleId?: string | null;
  myAgentId?: string | null;
};

type PreviewKind = "image" | "video";

type SelectedAsset = {
  file: File;
  previewUrl: string;
  previewKind: PreviewKind;
};

const TITLE_MIN_LENGTH = 2;
const TITLE_MAX_LENGTH = 80;
const DESCRIPTION_MAX_LENGTH = 500;

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function detectPreviewKind(file: File): PreviewKind | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

function isAcceptedMimeType(file: File): boolean {
  return (MOMENT_ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type);
}

function parseTagsInput(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[,\n]/)
        .map((tag) => tag.trim().replace(/^#/, ""))
        .filter((tag) => tag.length > 0 && tag.length <= 32),
    ),
  );
}

export function CreateMomentDialog({
  open,
  onOpenChange,
  onCreated,
  battleId,
  myAgentId,
}: CreateMomentDialogProps) {
  const { isAuthenticated } = useAuth();

  const [asset, setAsset] = useState<SelectedAsset | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [selectedGameSlugs, setSelectedGameSlugs] = useState<Set<string>>(new Set());
  const [isCompressing, setIsCompressing] = useState(false);
  const [isPrefilling, setIsPrefilling] = useState(false);
  const [awaitingCommentary, setAwaitingCommentary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prefillKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!asset) return;
    const objectUrl = asset.previewUrl;
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [asset]);

  const resetForm = useCallback(() => {
    setAsset(null);
    setTitle("");
    setDescription("");
    setTagsInput("");
    setSelectedGameSlugs(new Set());
    prefillKeyRef.current = null;
    setAwaitingCommentary(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  useEffect(() => {
    if (!open) resetForm();
  }, [open, resetForm]);

  useEffect(() => {
    if (!open || !battleId?.trim() || !isAuthenticated) return;

    const prefillKey = `${battleId}:${myAgentId ?? ""}`;
    if (prefillKeyRef.current === prefillKey) return;

    let cancelled = false;
    setIsPrefilling(true);
    resetForm();

    void resolveBattleTrashTalkDraft({ battleId: battleId.trim(), myAgentId })
      .then((draft) => {
        if (cancelled) {
          URL.revokeObjectURL(draft.previewUrl);
          return;
        }
        if (!draft.pendingCommentary || draft.description.trim()) {
          prefillKeyRef.current = prefillKey;
        }
        setTitle(draft.title);
        setDescription(draft.description);
        setTagsInput(draft.tags.join(", "));
        setSelectedGameSlugs(new Set(draft.relatedGameSlugs));
        setAsset({
          file: draft.imageFile,
          previewKind: "image",
          previewUrl: draft.previewUrl,
        });
        setAwaitingCommentary(Boolean(draft.pendingCommentary && !draft.description.trim()));
      })
      .catch((error) => {
        if (cancelled) return;
        const message =
          error instanceof BattleTrashTalkError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Could not load battle trash talk";
        toast.error(message);
      })
      .finally(() => {
        if (!cancelled) setIsPrefilling(false);
      });

    return () => {
      cancelled = true;
    };
  }, [battleId, isAuthenticated, myAgentId, open, resetForm]);

  useEffect(() => {
    if (!open || !battleId?.trim() || !isAuthenticated || !awaitingCommentary) return;

    let cancelled = false;
    const poll = () => {
      void resolveBattleTrashTalkDraft({ battleId: battleId.trim(), myAgentId })
        .then((draft) => {
          if (cancelled || draft.pendingCommentary || !draft.description.trim()) return;
          prefillKeyRef.current = `${battleId}:${myAgentId ?? ""}`;
          setDescription(draft.description);
          setTagsInput(draft.tags.join(", "));
          setSelectedGameSlugs(new Set(draft.relatedGameSlugs));
          setAwaitingCommentary(false);
          toast.success("AI commentary loaded");
        })
        .catch(() => undefined);
    };

    const intervalId = window.setInterval(poll, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [awaitingCommentary, battleId, isAuthenticated, myAgentId, open]);

  const tagPreview = useMemo(() => parseTagsInput(tagsInput), [tagsInput]);

  const createMomentMutation = useMutation({
    mutationFn: async () => {
      if (!asset) throw new Error("Pick an image or video first");
      const { file } = await compressMomentMediaFile(asset.file);
      return momentsApi.createFromFile({
        assetFile: file,
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tagPreview,
        relatedGames: [...selectedGameSlugs],
      });
    },
    onSuccess: async (response) => {
      toast.success("Moment published");
      await onCreated?.(response);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to publish moment");
    },
  });

  const isSubmitting = createMomentMutation.isPending;
  const isMediaBusy = isSubmitting || isCompressing || isPrefilling;

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    if (!isAcceptedMimeType(file)) {
      toast.error("Unsupported file type. Use JPG, PNG, GIF, WebP, MP4, WebM, or MOV.");
      return;
    }
    if (file.size > MOMENT_MEDIA_LIMITS.maxFileSizeBytes) {
      toast.error(`File is too large (limit ${formatBytes(MOMENT_MEDIA_LIMITS.maxFileSizeBytes)}).`);
      return;
    }

    const previewKind = detectPreviewKind(file);
    if (!previewKind) {
      toast.error("Could not detect media type for this file.");
      return;
    }

    setIsCompressing(true);
    try {
      const { file: optimizedFile, wasCompressed, originalSizeBytes } = await compressMomentMediaFile(file);

      if (optimizedFile.size > MOMENT_IMAGE_COMPRESS.hardMaxBytes && previewKind === "image") {
        toast.error(`Image is still too large after optimization (${formatBytes(optimizedFile.size)}). Max is 500 KB.`);
        return;
      }
      if (optimizedFile.size > MOMENT_MEDIA_LIMITS.maxFileSizeBytes) {
        toast.error(`File is still too large after optimization (${formatBytes(optimizedFile.size)}).`);
        return;
      }

      if (wasCompressed && optimizedFile.size < originalSizeBytes) {
        toast.success(`Optimized ${formatBytes(originalSizeBytes)} → ${formatBytes(optimizedFile.size)}`);
      }

      setAsset({
        file: optimizedFile,
        previewKind,
        previewUrl: URL.createObjectURL(optimizedFile),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not optimize media");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleClearFile = () => {
    setAsset(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleGame = (slug: string) => {
    setSelectedGameSlugs((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const trimmedTitle = title.trim();
  const canSubmit =
    isAuthenticated && !isMediaBusy && asset !== null && trimmedTitle.length >= TITLE_MIN_LENGTH;

  const handleSubmit = () => {
    if (!isAuthenticated) {
      toast.error("Connect your wallet to publish a moment.");
      return;
    }
    if (!asset) {
      toast.error("Pick an image or video first");
      return;
    }
    if (trimmedTitle.length < TITLE_MIN_LENGTH) {
      toast.error(`Title must be at least ${TITLE_MIN_LENGTH} characters`);
      return;
    }
    createMomentMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (isMediaBusy ? null : onOpenChange(next))}>
      <ArenaDialogContent
        size="lg"
        className="overflow-hidden border-[#9a35ff]/30 bg-[linear-gradient(160deg,hsl(265_48%_12%_/_0.98),hsl(220_45%_7%_/_0.98))] shadow-[0_30px_80px_rgba(0,0,0,0.55),0_0_60px_rgba(154,53,255,0.14)] [&>button]:border-[#9a35ff]/25 [&>button]:bg-[#0a0f1b]/90 [&>button]:text-white/70 [&>button]:hover:border-[#9a35ff]/45 [&>button]:hover:text-white"
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          className="pointer-events-none absolute top-0 left-[10%] right-[10%] z-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(154, 53, 255, 0.65), rgba(0, 210, 255, 0.35), transparent)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(154,53,255,0.12),transparent_55%)]" />

        <ArenaDialogHeader className="relative z-10 shrink-0 border-[#9a35ff]/15 bg-gradient-to-br from-[#9a35ff]/18 via-transparent to-cyan-500/5">
          <ArenaDialogTitle className="font-display text-xl tracking-tight text-white sm:text-2xl">
            {battleId ? (
              <>
                Publish{" "}
                <span className="bg-gradient-to-r from-[#f0e6ff] via-[#d6acff] to-[#9a35ff] bg-clip-text text-transparent">
                  Trash Talk
                </span>
              </>
            ) : (
              <>
                Publish a{" "}
                <span className="bg-gradient-to-r from-[#f0e6ff] via-[#d6acff] to-[#9a35ff] bg-clip-text text-transparent">
                  Moment
                </span>
              </>
            )}
          </ArenaDialogTitle>
          <ArenaDialogDescription className="text-xs text-white/55 sm:text-sm">
            {battleId
              ? "Your AI battle commentary is loaded below. Review and publish."
              : `Drop an arena clip or screenshot. ${momentImageUploadHint()}`}
          </ArenaDialogDescription>
        </ArenaDialogHeader>

        <ArenaDialogBody className="relative z-10 space-y-3 bg-[#03070d]/35">
          <div>
            <Label className="font-tech text-[11px] font-bold uppercase tracking-wider text-white/70">
              Media
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept={MOMENT_FILE_INPUT_ACCEPT}
              className="sr-only"
              onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
            />

            {isCompressing ? (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#9a35ff]/25 bg-[#9a35ff]/10 px-3 py-2 text-[11px] text-[#d6acff]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Optimizing media for upload…
              </div>
            ) : null}

            {isPrefilling ? (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-[11px] text-cyan-100">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading your battle commentary…
              </div>
            ) : null}

            {awaitingCommentary ? (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-100">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Battle in progress — AI commentary will appear when the match ends.
              </div>
            ) : null}

            {asset ? (
              <div className="mt-2 overflow-hidden rounded-lg border border-[#9a35ff]/20 bg-[#0a0f1b]/90">
                <div className="relative flex h-40 max-h-40 items-center justify-center bg-black/60 sm:h-44">
                  {asset.previewKind === "image" ? (
                    <img
                      src={asset.previewUrl}
                      alt={asset.file.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <video
                      src={asset.previewUrl}
                      className="h-full w-full object-contain"
                      controls
                      playsInline
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleClearFile}
                    disabled={isMediaBusy}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md border border-white/15 bg-black/60 text-white/80 transition hover:border-red-400/50 hover:bg-red-500/20 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Remove file"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-white/8 px-3 py-2 text-[11px] text-white/55">
                  <div className="flex min-w-0 items-center gap-2">
                    {asset.previewKind === "image" ? (
                      <ImagePlus className="h-3.5 w-3.5 text-[#d6acff]" />
                    ) : (
                      <VideoIcon className="h-3.5 w-3.5 text-[#d6acff]" />
                    )}
                    <span className="truncate text-white/80">{asset.file.name}</span>
                  </div>
                  <span className="whitespace-nowrap font-tech font-bold text-white/65">
                    {formatBytes(asset.file.size)}
                  </span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 flex h-36 w-full max-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#9a35ff]/25 bg-[#0a0f1b]/70 text-center text-white/60 transition hover:border-[#9a35ff]/55 hover:bg-[#9a35ff]/10 hover:text-white sm:h-40"
              >
                <ImagePlus className="h-7 w-7 text-[#9a35ff]/90" />
                <span className="font-tech text-[11px] font-bold uppercase tracking-wider">
                  Click to upload media
                </span>
                <span className="text-[10px] text-white/40">
                  {momentImageUploadHint()}
                </span>
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="moment-title"
              className="font-tech text-[11px] font-bold uppercase tracking-wider text-white/70"
            >
              Title <span className="text-red-400/80">*</span>
            </Label>
            <input
              id="moment-title"
              type="text"
              value={title}
              maxLength={TITLE_MAX_LENGTH}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Triple kill on Sector 7"
              className="h-10 w-full rounded-md border border-white/10 bg-[#0a0f1b]/80 px-3 text-sm text-white/90 placeholder-white/30 transition focus:border-[#9a35ff]/55 focus:outline-none focus:ring-2 focus:ring-[#9a35ff]/20"
            />
            <p className="text-right text-[10px] text-white/35">
              {title.length}/{TITLE_MAX_LENGTH}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="moment-description"
              className="font-tech text-[11px] font-bold uppercase tracking-wider text-white/70"
            >
              Description
            </Label>
            <Textarea
              id="moment-description"
              value={description}
              maxLength={DESCRIPTION_MAX_LENGTH}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What went down? Add context, callouts, or a backstory."
              className="min-h-[72px] resize-none rounded-md border border-white/10 bg-[#0a0f1b]/80 px-3 py-2 text-sm text-white/90 placeholder-white/30 transition focus:border-[#9a35ff]/55 focus:outline-none focus:ring-2 focus:ring-[#9a35ff]/20"
            />
            <p className="text-right text-[10px] text-white/35">
              {description.length}/{DESCRIPTION_MAX_LENGTH}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="moment-tags"
              className="font-tech text-[11px] font-bold uppercase tracking-wider text-white/70"
            >
              Tags
            </Label>
            <input
              id="moment-tags"
              type="text"
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder="clutch, 1v3, mvp"
              className="h-10 w-full rounded-md border border-white/10 bg-[#0a0f1b]/80 px-3 text-sm text-white/90 placeholder-white/30 transition focus:border-[#9a35ff]/55 focus:outline-none focus:ring-2 focus:ring-[#9a35ff]/20"
            />
            {tagPreview.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tagPreview.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#9a35ff]/35 bg-[#9a35ff]/12 px-2 py-0.5 font-tech text-[10px] font-bold uppercase tracking-wide text-[#d6acff]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-white/35">Comma- or newline-separated, up to 32 characters each.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="font-tech text-[11px] font-bold uppercase tracking-wider text-white/70">
              Related games
            </Label>
            <div className="flex flex-wrap gap-2">
              {KNOWN_MOMENT_GAMES.map((game) => {
                const isActive = selectedGameSlugs.has(game.slug);
                return (
                  <button
                    key={game.slug}
                    type="button"
                    onClick={() => toggleGame(game.slug)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-tech text-[10px] font-bold uppercase tracking-wider transition ${
                      isActive
                        ? "border-[#9a35ff]/55 bg-[#9a35ff]/20 text-white shadow-[0_0_12px_rgba(154,53,255,0.2)]"
                        : "border-white/10 bg-[#0a0f1b]/60 text-white/55 hover:border-[#9a35ff]/30 hover:text-white"
                    }`}
                  >
                    {isActive ? <X className="h-3 w-3" /> : null}
                    <span>{game.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {!isAuthenticated ? (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
              Connect your wallet to publish moments. The button below will stay disabled until you sign in.
            </p>
          ) : null}
        </ArenaDialogBody>

        <ArenaDialogFooter className="relative z-10 shrink-0 border-[#9a35ff]/15 bg-[#0a0f1b]/85">
          <Button
            variant="ghost"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="font-tech text-[11px] font-bold uppercase tracking-wider text-white/65 hover:bg-white/5 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-[#9a35ff] font-tech text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_0_15px_rgba(154,53,255,0.3)] transition hover:bg-[#8525eb] hover:shadow-[0_0_20px_rgba(154,53,255,0.5)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Publishing…
              </>
            ) : (
              "Publish Moment"
            )}
          </Button>
        </ArenaDialogFooter>
        </div>
      </ArenaDialogContent>
    </Dialog>
  );
}

export default CreateMomentDialog;
