import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, X } from "lucide-react";
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
import { momentsApi } from "@/api/momentsApi";
import { KNOWN_MOMENT_GAMES } from "@/constants/moments";
import type { Moment } from "@/types/api";

export type EditMomentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moment: Moment;
  onUpdated?: (moment: Moment) => void | Promise<void>;
};

const TITLE_MIN_LENGTH = 2;
const TITLE_MAX_LENGTH = 80;
const DESCRIPTION_MAX_LENGTH = 500;

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

export function EditMomentDialog({ open, onOpenChange, moment, onUpdated }: EditMomentDialogProps) {
  const [title, setTitle] = useState(moment.title);
  const [description, setDescription] = useState(moment.description ?? "");
  const [tagsInput, setTagsInput] = useState(moment.tags.join(", "));
  const [selectedGameSlugs, setSelectedGameSlugs] = useState<Set<string>>(
    () => new Set(moment.relatedGames ?? []),
  );

  useEffect(() => {
    if (!open) return;
    setTitle(moment.title);
    setDescription(moment.description ?? "");
    setTagsInput(moment.tags.join(", "));
    setSelectedGameSlugs(new Set(moment.relatedGames ?? []));
  }, [moment, open]);

  const tagPreview = useMemo(() => parseTagsInput(tagsInput), [tagsInput]);

  const updateMutation = useMutation({
    mutationFn: () =>
      momentsApi.update(moment.momentId, {
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tagPreview,
        relatedGames: [...selectedGameSlugs],
      }),
    onSuccess: async (updated) => {
      toast.success("Moment updated");
      await onUpdated?.(updated);
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 403 || status === 404) {
        toast.error("You can only edit your own moments");
        return;
      }
      toast.error(error instanceof Error ? error.message : "Failed to update moment");
    },
  });

  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length >= TITLE_MIN_LENGTH && !updateMutation.isPending;

  const toggleGame = (slug: string) => {
    setSelectedGameSlugs((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const handleSubmit = () => {
    if (trimmedTitle.length < TITLE_MIN_LENGTH) {
      toast.error(`Title must be at least ${TITLE_MIN_LENGTH} characters`);
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (updateMutation.isPending ? null : onOpenChange(next))}>
      <ArenaDialogContent
        size="lg"
        className="overflow-hidden border-[#9a35ff]/30 bg-[linear-gradient(160deg,hsl(265_48%_12%_/_0.98),hsl(220_45%_7%_/_0.98))] shadow-[0_30px_80px_rgba(0,0,0,0.55),0_0_60px_rgba(154,53,255,0.14)] [&>button]:border-[#9a35ff]/25 [&>button]:bg-[#0a0f1b]/90 [&>button]:text-white/70 [&>button]:hover:border-[#9a35ff]/45 [&>button]:hover:text-white"
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <ArenaDialogHeader className="relative z-10 shrink-0 border-[#9a35ff]/15 bg-gradient-to-br from-[#9a35ff]/18 via-transparent to-cyan-500/5">
            <ArenaDialogTitle className="font-display text-xl tracking-tight text-white sm:text-2xl">
              Edit{" "}
              <span className="bg-gradient-to-r from-[#f0e6ff] via-[#d6acff] to-[#9a35ff] bg-clip-text text-transparent">
                Moment
              </span>
            </ArenaDialogTitle>
            <ArenaDialogDescription className="text-xs text-white/55 sm:text-sm">
              Update title, description, tags, and related games. Media cannot be changed after publishing.
            </ArenaDialogDescription>
          </ArenaDialogHeader>

          <ArenaDialogBody className="relative z-10 space-y-3 bg-[#03070d]/35">
            <div className="space-y-1.5">
              <Label htmlFor="edit-moment-title" className="font-tech text-[11px] font-bold uppercase tracking-wider text-white/70">
                Title <span className="text-red-400/80">*</span>
              </Label>
              <input
                id="edit-moment-title"
                type="text"
                value={title}
                maxLength={TITLE_MAX_LENGTH}
                onChange={(event) => setTitle(event.target.value)}
                className="h-10 w-full rounded-md border border-white/10 bg-[#0a0f1b]/80 px-3 text-sm text-white/90 placeholder-white/30 transition focus:border-[#9a35ff]/55 focus:outline-none focus:ring-2 focus:ring-[#9a35ff]/20"
              />
              <p className="text-right text-[10px] text-white/35">
                {title.length}/{TITLE_MAX_LENGTH}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-moment-description" className="font-tech text-[11px] font-bold uppercase tracking-wider text-white/70">
                Description
              </Label>
              <Textarea
                id="edit-moment-description"
                value={description}
                maxLength={DESCRIPTION_MAX_LENGTH}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-[72px] resize-none rounded-md border border-white/10 bg-[#0a0f1b]/80 px-3 py-2 text-sm text-white/90 placeholder-white/30 transition focus:border-[#9a35ff]/55 focus:outline-none focus:ring-2 focus:ring-[#9a35ff]/20"
              />
              <p className="text-right text-[10px] text-white/35">
                {description.length}/{DESCRIPTION_MAX_LENGTH}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-moment-tags" className="font-tech text-[11px] font-bold uppercase tracking-wider text-white/70">
                Tags
              </Label>
              <input
                id="edit-moment-tags"
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
              ) : null}
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
                      {game.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </ArenaDialogBody>

          <ArenaDialogFooter className="relative z-10 shrink-0 border-t border-[#9a35ff]/15 bg-[#03070d]/50">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
              className="font-tech text-[10px] font-bold uppercase tracking-wider text-white/55 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="gap-2 bg-[#9a35ff] font-tech text-[10px] font-bold uppercase tracking-wider text-white hover:bg-[#8525eb]"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Pencil className="h-3.5 w-3.5" />
                  Save changes
                </>
              )}
            </Button>
          </ArenaDialogFooter>
        </div>
      </ArenaDialogContent>
    </Dialog>
  );
}
