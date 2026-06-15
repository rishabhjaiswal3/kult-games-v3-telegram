import { useQuery } from "@tanstack/react-query";
import { Loader2, Radio, Search, Swords, UserMinus } from "lucide-react";
import { useEffect, useRef } from "react";
import { AI_ARENA_DEFAULT_GAME_ID } from "@/constants/aiArenaMatchmaking";
import { aiArenaGatewayApi } from "@/api/aiArenaGatewayApi";
import { ArenaAgentThumbnail } from "@/components/arena/ArenaAgentThumbnail";
import { ArenaMatchFaceoff } from "@/components/arena/ArenaMatchFaceoff";
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
import type { AiArenaAgent, AiArenaMatchmakingStatusBody } from "@/types/aiArenaGateway";

function formatWaitTime(ms?: number | null) {
  if (typeof ms !== "number" || ms <= 0) return "just now";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${totalSeconds}s`;
}

function formatShortId(value?: string | null) {
  if (!value) return "—";
  if (value.length <= 14) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

type ArenaMatchStatusModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: AiArenaAgent | null;
  onLeave?: (agentId: string) => void;
  leaving?: boolean;
  onMatchFound?: (payload: {
    agent: AiArenaAgent;
    opponent: AiArenaAgent;
    battleId: string;
    mode: string;
    gameId: string;
  }) => void;
};

function statusPhase(status: AiArenaMatchmakingStatusBody | null | undefined) {
  if (!status?.inQueue) return "idle" as const;
  if (status.matchId) return "matched" as const;
  return "searching" as const;
}

function MatchStatusHeader({
  agent,
  status,
  phase,
  loading,
}: {
  agent: AiArenaAgent;
  status: AiArenaMatchmakingStatusBody | null;
  phase: "idle" | "searching" | "matched";
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-background/35 p-4">
      <ArenaAgentThumbnail agent={agent} className="h-16 w-16 rounded-xl" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-display text-lg font-bold">{agent.name}</p>
          {phase === "searching" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-neon-cyan">
              <Radio className="h-3 w-3" /> Searching
            </span>
          ) : null}
          {phase === "matched" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-neon-green/30 bg-neon-green/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-neon-green">
              <Swords className="h-3 w-3" /> Match found
            </span>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {agent.archetype} · {agent.clan} · ELO {agent.eloRating}
        </p>
        {status?.matchId ? (
          <p className="mt-1 font-mono text-[10px] text-neon-cyan/90">Battle {formatShortId(status.matchId)}</p>
        ) : loading ? (
          <p className="mt-1 text-[10px] text-muted-foreground">Refreshing status…</p>
        ) : null}
      </div>
    </div>
  );
}

export function ArenaMatchStatusModal({
  open,
  onOpenChange,
  agent,
  onLeave,
  leaving,
  onMatchFound,
}: ArenaMatchStatusModalProps) {
  const agentId = agent?.id ?? null;

  // Capture gameId the moment it appears in status or battle — survives queue-clear polling resets.
  const resolvedGameIdRef = useRef<string>("default");
  // Guard: fire onMatchFound only once per battleId to prevent double-navigation.
  const matchFiredRef = useRef<string | null>(null);

  const statusQ = useQuery({
    queryKey: ["aiArenaGateway", "matchStatusModal", agentId],
    queryFn: () => aiArenaGatewayApi.getMatchmakingStatus(agentId!),
    enabled: open && !!agentId,
    refetchInterval: (query) => {
      if (!open) return false;
      const s = query.state.data?.status;
      // Keep polling while searching OR while matched-but-battle-not-yet-loaded
      if (s?.inQueue) return 2_000;
      return false;
    },
    staleTime: 1_000,
    retry: 1,
  });

  const status = statusQ.data?.status ?? null;
  const phase = statusPhase(status);
  const battleId = status?.matchId ?? undefined;

  const battleQ = useQuery({
    queryKey: ["aiArenaGateway", "matchStatusModalBattle", battleId],
    queryFn: () => aiArenaGatewayApi.getBattle(battleId!),
    enabled: open && !!battleId && !!agentId,
    // Poll every 2s while PENDING so we catch the IN_PROGRESS transition
    refetchInterval: (query) => {
      if (!open || !battleId) return false;
      const s = query.state.data?.battle?.status;
      if (!s || s === "PENDING" || s === "INITIALIZING") return 2_000;
      return false;
    },
    staleTime: 1_000,
    retry: 1,
  });

  const opponentId = battleQ.data?.battle?.agentIds?.find((id) => id !== agentId) ?? null;

  const opponentQ = useQuery({
    queryKey: ["aiArenaGateway", "matchStatusModalOpponent", opponentId],
    queryFn: () => aiArenaGatewayApi.getAgentById(opponentId!),
    enabled: open && !!opponentId,
    staleTime: 30_000,
    retry: 1,
  });

  // Latch gameId as soon as it arrives — don't lose it when polling resets status.
  useEffect(() => {
    if (status?.gameId) resolvedGameIdRef.current = status.gameId;
  }, [status?.gameId]);
  useEffect(() => {
    if (battleQ.data?.battle?.gameId) resolvedGameIdRef.current = battleQ.data.battle.gameId;
  }, [battleQ.data?.battle?.gameId]);

  // Fire once per battleId — prevent double-navigation when status/battle re-poll after queue clears.
  useEffect(() => {
    if (!open || !agent || !battleId || !opponentQ.data) return;
    if (matchFiredRef.current === battleId) return;
    matchFiredRef.current = battleId;
    onMatchFound?.({
      agent,
      opponent: opponentQ.data,
      battleId,
      mode:   status?.mode ?? battleQ.data?.battle?.mode ?? "RANKED",
      gameId: resolvedGameIdRef.current,
    });
  }, [open, agent, battleId, opponentQ.data, onMatchFound]);

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ArenaDialogContent size="lg">
        <ArenaDialogHeader>
          <ArenaDialogTitle className="font-display text-xl sm:text-2xl">
            Match <span className="gradient-text">status</span>
          </ArenaDialogTitle>
          <ArenaDialogDescription>
            Live queue updates for {agent.name}. A match appears here as soon as the arena pairs a fighter.
          </ArenaDialogDescription>
        </ArenaDialogHeader>

        <ArenaDialogBody className="space-y-5">
          <MatchStatusHeader agent={agent} status={status} phase={phase} loading={statusQ.isLoading} />

          {phase === "searching" ? (
            <div className="rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 px-4 py-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-neon-cyan/30 bg-neon-cyan/10">
                <Search className="h-6 w-6 animate-pulse text-neon-cyan" />
              </div>
              <p className="font-display text-lg font-bold text-foreground">Searching for opponent</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Your agent is listed in the open lobby. Waiting{" "}
                <span className="font-mono text-neon-cyan">
                  {formatWaitTime(status?.waitTimeMs ?? status?.estimatedWaitMs)}
                </span>
                .
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Mode {status?.mode ?? "RANKED"} · Game {status?.gameId ?? AI_ARENA_DEFAULT_GAME_ID}
              </p>
            </div>
          ) : null}

          {phase === "matched" && opponentQ.data ? (
            <>
              <ArenaMatchFaceoff
                left={agent}
                right={opponentQ.data}
                battleId={battleId}
                mode={status?.mode ?? battleQ.data?.battle?.mode ?? "RANKED"}
                pending={!battleQ.data?.battle?.status || battleQ.data.battle.status === "PENDING" || battleQ.data.battle.status === "INITIALIZING"}
              />
              {battleQ.data?.battle?.status === "IN_PROGRESS" ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-neon-green/25 bg-neon-green/10 px-4 py-3 text-sm font-semibold text-neon-green">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-neon-green" />
                  Battle is live — track it in the Battle Lookup below
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-neon-cyan/20 bg-neon-cyan/8 px-4 py-3 text-sm text-neon-cyan/80">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting battle — both agents entering the arena…
                </div>
              )}
            </>
          ) : null}

          {phase === "matched" && !opponentQ.data && !opponentQ.isError ? (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-background/30 py-10">
              <Loader2 className="h-5 w-5 animate-spin text-neon-cyan" />
              <span className="text-sm text-muted-foreground">Loading opponent details…</span>
            </div>
          ) : null}

          {phase === "idle" && !statusQ.isLoading ? (
            <div className="rounded-xl border border-white/10 bg-background/35 px-4 py-8 text-center">
              <p className="font-display text-base font-semibold text-foreground">Not in matchmaking</p>
              <p className="mt-2 text-sm text-muted-foreground">
                This agent is not currently queued. Use Start matching to list it in the lobby.
              </p>
            </div>
          ) : null}

          {statusQ.isError ? (
            <p className="text-sm text-destructive/90">Could not load matchmaking status. Try again in a moment.</p>
          ) : null}
        </ArenaDialogBody>

        <ArenaDialogFooter className="flex-wrap gap-2">
          {phase !== "idle" && onLeave ? (
            <Button
              type="button"
              variant="outline"
              disabled={leaving}
              onClick={() => onLeave(agent.id)}
              className="rounded-xl border-white/15"
            >
              {leaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserMinus className="mr-2 h-4 w-4" />}
              Leave queue
            </Button>
          ) : null}
          <Button type="button" onClick={() => onOpenChange(false)} className="rounded-xl">
            Close
          </Button>
        </ArenaDialogFooter>
      </ArenaDialogContent>
    </Dialog>
  );
}
