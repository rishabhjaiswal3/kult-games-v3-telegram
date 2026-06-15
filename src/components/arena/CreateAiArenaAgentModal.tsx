import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { aiArenaGatewayApi } from "@/api/aiArenaGatewayApi";
import {
  AI_ARENA_ARCHETYPE_OPTIONS,
  AI_ARENA_CLAN_OPTIONS,
  randomAiArenaArchetype,
} from "@/constants/aiArenaAgent";
import { getArchetypeCardByType } from "@/constants/arenaAgentArchetypes";
import type { AiArenaAgent } from "@/types/aiArenaGateway";
import { useAuth } from "@/contexts/AuthContext";
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
import { cn } from "@/lib/utils";

export type CreateAiArenaAgentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName?: string;
  defaultArchetype?: (typeof AI_ARENA_ARCHETYPE_OPTIONS)[number];
  onCreated?: (agent: AiArenaAgent) => void | Promise<void>;
};

export function CreateAiArenaAgentModal({
  open,
  onOpenChange,
  defaultName = "",
  defaultArchetype,
  onCreated,
}: CreateAiArenaAgentModalProps) {
  const { walletAddress } = useAuth();
  const [name, setName] = useState(defaultName);
  const [clan, setClan] = useState<(typeof AI_ARENA_CLAN_OPTIONS)[number]["value"]>("ZEROG");
  const [archetype, setArchetype] = useState<(typeof AI_ARENA_ARCHETYPE_OPTIONS)[number]>(() =>
    randomAiArenaArchetype()
  );
  const [backstory, setBackstory] = useState(
    "Built for smart plays, sharp banter, and a long climb up the arena ladder."
  );
  const [submitting, setSubmitting] = useState(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }

    setName((n) => (n.trim() ? n : defaultName));

    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      setArchetype(defaultArchetype ?? randomAiArenaArchetype());
      return;
    }

    if (defaultArchetype) {
      setArchetype(defaultArchetype);
    }
  }, [open, defaultName, defaultArchetype]);

  const selectedCard = getArchetypeCardByType(archetype);

  const handleSubmit = async () => {
    if (!walletAddress) {
      toast.error("Connect a wallet first.");
      return;
    }
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("Name must be at least 2 characters.");
      return;
    }
    if (backstory.trim().length < 8) {
      toast.error("Backstory should be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const agent = await aiArenaGatewayApi.createAgent({
        name: trimmed,
        clan,
        archetype,
        backstory: backstory.trim(),
      });
      toast.success("AI Arena agent created");
      await onCreated?.(agent);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create agent");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ArenaDialogContent size="md">
        <ArenaDialogHeader>
          <ArenaDialogTitle className="font-display text-xl tracking-tight sm:text-2xl">
            Create <span className="text-gradient-hero">AI Agent</span>
          </ArenaDialogTitle>
          <ArenaDialogDescription className="text-xs sm:text-sm">
            One step creates your arena agent and its custodial hot wallet. Choose clan, archetype, name, and backstory.
          </ArenaDialogDescription>
        </ArenaDialogHeader>

        <ArenaDialogBody className="space-y-4">
          {selectedCard ? (
            <div className="overflow-hidden rounded-xl border border-white/[0.12] bg-[hsl(268_32%_8%/0.85)]">
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="relative mx-auto h-36 w-36 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[hsl(268_32%_6%/0.9)] sm:mx-0 sm:h-32 sm:w-32">
                  {selectedCard.image.endsWith(".mp4") ? (
                    <video
                      src={selectedCard.image}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <img
                      src={selectedCard.image}
                      alt={`${selectedCard.codename} — ${selectedCard.archetype}`}
                      className="h-full w-full object-contain p-2"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="font-display text-[10px] tracking-[0.22em] text-muted-foreground">SELECTED ARCHETYPE</p>
                  <p className={cn("mt-1 font-display text-lg font-bold tracking-wide", selectedCard.accent)}>
                    {selectedCard.archetype}
                  </p>
                  <p className="font-display text-sm font-semibold text-foreground">{selectedCard.codename}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{selectedCard.tagline}</p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground/80">{selectedCard.role}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label className="arena-label">Clan</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {AI_ARENA_CLAN_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setClan(c.value)}
                  className={cn("arena-chip", clan === c.value && "arena-chip-active-cyan")}
                >
                  <div className="font-display text-[11px] font-bold">{c.label}</div>
                  <div className="text-[9px] opacity-80">{c.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="arena-label">Archetype</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {AI_ARENA_ARCHETYPE_OPTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setArchetype(a)}
                  className={cn(
                    "arena-chip font-display text-[10px] font-semibold tracking-wide sm:text-[11px]",
                    archetype === a && "arena-chip-active-purple"
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="arena-agent-name" className="arena-label">
              Name
            </Label>
            <input
              id="arena-agent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={48}
              className="arena-input"
              placeholder="NeuralReaper-7"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="arena-agent-backstory" className="arena-label">
              Backstory
            </Label>
            <Textarea
              id="arena-agent-backstory"
              value={backstory}
              onChange={(e) => setBackstory(e.target.value)}
              rows={4}
              maxLength={2000}
              className="arena-input min-h-[7rem] resize-y py-3"
              placeholder="Born from corrupted validator nodes…"
            />
          </div>
        </ArenaDialogBody>

        <ArenaDialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? "Creating…" : "Create AI Agent"}
          </Button>
        </ArenaDialogFooter>
      </ArenaDialogContent>
    </Dialog>
  );
}
