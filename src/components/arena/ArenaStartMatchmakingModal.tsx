import { Loader2, Swords } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { aiArenaGatewayApi } from "@/api/aiArenaGatewayApi";
import { ArenaAgentThumbnail } from "@/components/arena/ArenaAgentThumbnail";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  ArenaDialogBody,
  ArenaDialogContent,
  ArenaDialogDescription,
  ArenaDialogFooter,
  ArenaDialogHeader,
  ArenaDialogTitle,
} from "@/components/ui/arena-dialog";
import {
  AI_ARENA_DEFAULT_GAME_ID,
  AI_ARENA_GAME_IDS,
  AI_ARENA_MATCH_MODES,
  type AiArenaGameId,
  type AiArenaMatchMode,
} from "@/constants/aiArenaMatchmaking";
import type { AiArenaAgent } from "@/types/aiArenaGateway";

export type ArenaStartMatchmakingModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: AiArenaAgent[];
  defaultAgentId?: string | null;
  onQueued?: (agentId: string, gameId: string) => void | Promise<void>;
};

function apiErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; error?: string } | undefined;
    if (data?.message) return data.message;
    if (data?.error) return String(data.error);
    if (err.response?.status === 402) {
      return "Payment required — fund your agent wallet and provide a wager payment tx hash.";
    }
  }
  return err instanceof Error ? err.message : fallback;
}

export function ArenaStartMatchmakingModal({
  open,
  onOpenChange,
  agents,
  defaultAgentId,
  onQueued,
}: ArenaStartMatchmakingModalProps) {
  const [agentId, setAgentId] = useState<string | null>(defaultAgentId ?? null);
  const [gameId, setGameId] = useState<AiArenaGameId>(AI_ARENA_DEFAULT_GAME_ID);
  const [mode, setMode] = useState<AiArenaMatchMode>("RANKED");
  const [eloRange, setEloRange] = useState("200");
  const [paymentTxHash, setPaymentTxHash] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAgentId((cur) => {
      if (cur && agents.some((a) => a.id === cur)) return cur;
      if (defaultAgentId && agents.some((a) => a.id === defaultAgentId)) return defaultAgentId;
      return agents[0]?.id ?? null;
    });
    setGameId(AI_ARENA_DEFAULT_GAME_ID);
  }, [open, agents, defaultAgentId]);

  const selectedAgent = agents.find((a) => a.id === agentId) ?? null;
  const modeHint = AI_ARENA_MATCH_MODES.find((m) => m.value === mode)?.hint;

  const handleSubmit = async () => {
    if (!agentId) {
      toast.error("Select an agent to queue.");
      return;
    }
    const elo = Number.parseInt(eloRange, 10);
    setSubmitting(true);
    try {
      await aiArenaGatewayApi.joinMatchmakingQueue({
        agentId,
        gameId,
        mode,
        eloRange: Number.isFinite(elo) ? elo : 200,
        paymentTxHash: mode === "WAGER" && paymentTxHash.trim() ? paymentTxHash.trim() : undefined,
      });
      toast.success("Your agent is listed — waiting for a challenger.");
      try { sessionStorage.setItem("arena_queued_game_id", gameId); } catch { /* ignore */ }
      await onQueued?.(agentId, gameId);
      onOpenChange(false);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not start matchmaking"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ArenaDialogContent size="lg">
        <ArenaDialogHeader>
          <ArenaDialogTitle className="font-display text-xl sm:text-2xl">
            Start <span className="gradient-text">matchmaking</span>
          </ArenaDialogTitle>
          <ArenaDialogDescription>
            Queue your fighter in the open lobby. Other players can join and your agents will face off.
          </ArenaDialogDescription>
        </ArenaDialogHeader>

        <ArenaDialogBody className="space-y-5">
          {agents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Create an AI Arena agent before starting matchmaking.</p>
          ) : (
            <>
              {selectedAgent ? (
                <div className="flex items-center gap-4 rounded-xl border border-neon-cyan/20 bg-gradient-to-br from-neon-purple/10 to-neon-cyan/5 p-4">
                  <ArenaAgentThumbnail agent={selectedAgent} className="h-20 w-20 rounded-xl sm:h-24 sm:w-24" />
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-bold">{selectedAgent.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedAgent.archetype} • {selectedAgent.clan}
                    </p>
                    <p className="mt-1 font-display text-xl font-black tabular-nums text-neon-cyan">
                      {selectedAgent.eloRating} ELO
                    </p>
                  </div>
                </div>
              ) : null}

              <div>
                <label className="arena-label">Fighting agent</label>
                <select
                  value={agentId ?? ""}
                  onChange={(e) => setAgentId(e.target.value || null)}
                  disabled={submitting}
                  className="arena-select disabled:opacity-50"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — ELO {a.eloRating}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="arena-label">Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as AiArenaMatchMode)}
                    disabled={submitting}
                    className="arena-select disabled:opacity-50"
                  >
                    {AI_ARENA_MATCH_MODES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  {modeHint ? <p className="mt-1 text-[11px] text-muted-foreground">{modeHint}</p> : null}
                </div>
                <div>
                  <label className="arena-label">ELO range</label>
                  <input
                    type="number"
                    min={50}
                    step={50}
                    value={eloRange}
                    onChange={(e) => setEloRange(e.target.value)}
                    disabled={submitting}
                    className="arena-input disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="arena-label">Game ID</label>
                <select
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value as AiArenaGameId)}
                  disabled={submitting}
                  className="arena-select disabled:opacity-50"
                >
                  {AI_ARENA_GAME_IDS.map((game) => (
                    <option key={game.value} value={game.value}>
                      {game.label}
                    </option>
                  ))}
                </select>
              </div>

              {mode === "WAGER" ? (
                <div>
                  <label className="arena-label">Wager payment tx (x402)</label>
                  <input
                    value={paymentTxHash}
                    onChange={(e) => setPaymentTxHash(e.target.value)}
                    disabled={submitting}
                    placeholder="Solana tx hash after 5 ARENA payment"
                    className="arena-input font-mono disabled:opacity-50"
                  />
                </div>
              ) : null}
            </>
          )}
        </ArenaDialogBody>

        <ArenaDialogFooter>
          <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={submitting || !agentId || agents.length === 0}
            onClick={() => void handleSubmit()}
            className="rounded-xl border border-neon-cyan/35 bg-neon-cyan/15 text-neon-cyan hover:bg-neon-cyan/25"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Swords className="mr-2 h-4 w-4" />}
            List in open lobby
          </Button>
        </ArenaDialogFooter>
      </ArenaDialogContent>
    </Dialog>
  );
}
