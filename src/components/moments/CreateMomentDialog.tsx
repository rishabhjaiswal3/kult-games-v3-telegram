import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  KNOWN_MOMENT_GAMES,
  MOMENT_ACCEPTED_MIME_TYPES,
  MOMENT_FILE_INPUT_ACCEPT,
  MOMENT_MEDIA_LIMITS,
} from "@/constants/moments";
import type { CreateMomentResponse } from "@/types/api";

export type CreateMomentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (response: CreateMomentResponse) => void | Promise<void>;
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

export function CreateMomentDialog({ open, onOpenChange, onCreated }: CreateMomentDialogProps) {
  const { isAuthenticated } = useAuth();

  const [asset, setAsset] = useState<SelectedAsset | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [selectedGameSlugs, setSelectedGameSlugs] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!asset) return;
    const objectUrl = asset.previewUrl;
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [asset]);

  const resetForm = () => {
    setAsset(null);
    setTitle("");
    setDescription("");
    setTagsInput("");
    setSelectedGameSlugs(new Set());
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  const tagPreview = useMemo(() => parseTagsInput(tagsInput), [tagsInput]);

  const createMomentMutation = useMutation({
    mutationFn: async () => {
      if (!asset) throw new Error("Pick an image or video first");
      return momentsApi.createFromFile({
        assetFile: asset.file,
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

  const handleFileChange = (file: File | null) => {
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

    // The previous object URL (if any) is revoked by the effect cleanup below
    // when React commits the new asset value — single source of truth.
    setAsset({
      file,
      previewKind,
      previewUrl: URL.createObjectURL(file),
    });
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
    isAuthenticated && !isSubmitting && asset !== null && trimmedTitle.length >= TITLE_MIN_LENGTH;

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
    <Dialog open={open} onOpenChange={(next) => (isSubmitting ? null : onOpenChange(next))}>
      <ArenaDialogContent size="lg">
        <ArenaDialogHeader>
          <ArenaDialogTitle className="font-display text-xl tracking-tight sm:text-2xl">
            Publish a <span className="text-gradient-hero">Moment</span>
          </ArenaDialogTitle>
          <ArenaDialogDescription className="text-xs sm:text-sm">
            Drop an arena clip or screenshot — up to 2 min for video. Adds straight to the Moments feed.
          </ArenaDialogDescription>
        </ArenaDialogHeader>

        <ArenaDialogBody className="space-y-5">
          <div>
            <Label className="font-tech text-[11px] font-bold uppercase tracking-wider text-white/70">
              Media
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept={MOMENT_FILE_INPUT_ACCEPT}
              className="sr-only"
              onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
            />

            {asset ? (
              <div className="mt-2 overflow-hidden rounded-lg border border-white/10 bg-[#0a0f1b]/80">
                <div className="relative flex aspect-[16/9] items-center justify-center bg-black/60">
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
                    disabled={isSubmitting}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md border border-white/15 bg-black/60 text-white/80 transition hover:border-red-400/50 hover:bg-red-500/20 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Remove file"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-white/8 px-3 py-2 text-[11px] text-white/55">
                  <div className="flex min-w-0 items-center gap-2">
                    {asset.previewKind === "image" ? (
                      <ImagePlus className="h-3.5 w-3.5 text-purple-300" />
                    ) : (
                      <VideoIcon className="h-3.5 w-3.5 text-purple-300" />
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
                className="mt-2 flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-[#0a0f1b]/60 text-center text-white/60 transition hover:border-purple-400/50 hover:bg-purple-950/10 hover:text-white"
              >
                <ImagePlus className="h-7 w-7 text-purple-300/80" />
                <span className="font-tech text-[11px] font-bold uppercase tracking-wider">
                  Click to upload media
                </span>
                <span className="text-[10px] text-white/40">
                  Any image · MP4 · WebM · MOV · video ≤ {MOMENT_MEDIA_LIMITS.maxVideoDurationSeconds}s
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
              className="h-10 w-full rounded-md border border-white/10 bg-[#0a0f1b]/70 px-3 text-sm text-white/90 placeholder-white/30 transition focus:border-purple-500/50 focus:outline-none"
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
              className="min-h-[96px] resize-none rounded-md border border-white/10 bg-[#0a0f1b]/70 px-3 py-2 text-sm text-white/90 placeholder-white/30 transition focus:border-purple-500/50 focus:outline-none"
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
              className="h-10 w-full rounded-md border border-white/10 bg-[#0a0f1b]/70 px-3 text-sm text-white/90 placeholder-white/30 transition focus:border-purple-500/50 focus:outline-none"
            />
            {tagPreview.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tagPreview.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 font-tech text-[10px] font-bold uppercase tracking-wide text-purple-200"
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
                        ? "border-purple-500/50 bg-purple-500/20 text-white"
                        : "border-white/10 bg-[#0a0f1b]/60 text-white/55 hover:border-white/20 hover:text-white"
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

        <ArenaDialogFooter>
          <Button
            variant="ghost"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="font-tech text-[11px] font-bold uppercase tracking-wider"
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
      </ArenaDialogContent>
    </Dialog>
  );
}

export default CreateMomentDialog;
