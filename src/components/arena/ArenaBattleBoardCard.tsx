import { Link } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import { ArenaAgentThumbnail } from "@/components/arena/ArenaAgentThumbnail";
import { leaderboardElo, leaderboardName } from "@/hooks/useEnrichedArenaLeaderboard";
import type { ArenaBattleBoardItem } from "@/hooks/useArenaBattleBoard";

function formatLobbyMode(mode?: string | null) {
  return mode ? mode.replaceAll("_", " ") : "Open Lobby";
}

function Fighter({
  agent,
  align = "left",
}: {
  agent: { id: string; name?: string | null; clan?: string | null; archetype?: string | null; elo?: number | null };
  align?: "left" | "right";
}) {
  const isRight = align === "right";

  return (
    <div className={`flex min-w-0 flex-col items-center ${isRight ? "text-right" : "text-left"}`}>
      <div className={`flex w-full items-center gap-2 ${isRight ? "justify-end" : "justify-start"}`}>
        {isRight ? null : (
          <ArenaAgentThumbnail
            agent={{ id: agent.id, archetype: agent.archetype ?? undefined, name: agent.name ?? undefined }}
            className="h-14 w-14 rounded-xl transition duration-500 group-hover:scale-105 group-hover:shadow-[0_0_18px_rgba(154,53,255,0.3)]"
            size="md"
          />
        )}
        <div className="min-w-0">
          <div className="truncate font-tech text-[11px] sm:text-xs">{agent.name ?? "Unknown agent"}</div>
          <div className="truncate text-[10px] text-muted-foreground">{agent.clan ?? agent.archetype ?? "AI Arena"}</div>
        </div>
        {isRight ? (
          <ArenaAgentThumbnail
            agent={{ id: agent.id, archetype: agent.archetype ?? undefined, name: agent.name ?? undefined }}
            className="h-14 w-14 rounded-xl transition duration-500 group-hover:scale-105 group-hover:shadow-[0_0_18px_rgba(154,53,255,0.3)]"
            size="md"
          />
        ) : null}
      </div>
      <div className="mt-2 w-full text-[10px] text-muted-foreground">ELO {Math.round(agent.elo ?? 0)}</div>
    </div>
  );
}

function FindingOpponent({ waitLabel, modeLabel }: { waitLabel: string; modeLabel: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-accent/35 bg-accent/10">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
      </div>
      <div className="mt-2 font-tech text-[11px] sm:text-xs text-white">Finding rival</div>
      <div className="mt-1 text-[10px] text-muted-foreground">{modeLabel}</div>
      <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-accent">
        <Search className="h-3 w-3" />
        Waiting {waitLabel}
      </div>
    </div>
  );
}

type ArenaBattleBoardCardProps = {
  item: ArenaBattleBoardItem;
  actionLabel: string;
  actionTo?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  actionLoading?: boolean;
};

function CardAction({
  actionLabel,
  actionTo,
  onAction,
  actionDisabled,
  actionLoading,
}: Omit<ArenaBattleBoardCardProps, "item">) {
  if (onAction) {
    return (
      <button
        type="button"
        onClick={onAction}
        disabled={actionDisabled || actionLoading}
        className="inline-flex items-center gap-1.5 text-xs text-accent transition hover:underline disabled:cursor-not-allowed disabled:opacity-60 font-tech"
      >
        {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        <span>{actionLabel}</span>
      </button>
    );
  }

  if (!actionTo) return null;

  return (
    <Link to={actionTo} className="text-xs text-accent hover:underline font-tech">
      {actionLabel}
    </Link>
  );
}

export function ArenaBattleBoardCard({
  item,
  actionLabel,
  actionTo,
  onAction,
  actionDisabled,
  actionLoading,
}: ArenaBattleBoardCardProps) {
  if (item.kind === "open-lobby") {
    return (
      <article className="card-glass group relative overflow-hidden rounded-xl border border-white/10 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.28)] transition-all duration-500 hover:-translate-y-1.5 hover:border-accent/55 hover:shadow-[0_22px_55px_rgba(0,0,0,0.42),0_0_30px_rgba(154,53,255,0.2)] sm:p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(154,53,255,0.16),transparent_42%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="pointer-events-none absolute -left-1/2 top-0 h-full w-1/4 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-700 group-hover:left-[125%] group-hover:opacity-100" />
        <div className="relative z-10">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="font-tech text-xs tracking-wider text-accent">QUEUE</span>
          </div>
          <div className="text-center sm:text-right min-w-0">
            <div className="text-xs">Open Lobby</div>
            <div className="text-[10px] text-muted-foreground">{formatLobbyMode(item.status.mode)}</div>
          </div>
          <div className="font-tech text-sm text-accent">{item.waitLabel}</div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
          <Fighter
            agent={{
              id: item.agent.id,
              name: item.agent.name,
              clan: item.agent.clan,
              archetype: item.agent.archetype,
              elo: item.agent.eloRating,
            }}
          />
          <span className="font-display text-2xl text-muted-foreground">VS</span>
          <FindingOpponent waitLabel={item.waitLabel} modeLabel={formatLobbyMode(item.status.mode)} />
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <CardAction
            actionLabel={actionLabel}
            actionTo={actionTo}
            onAction={onAction}
            actionDisabled={actionDisabled}
            actionLoading={actionLoading}
          />
          <span className="text-xs text-muted-foreground">
            {item.status.gameId ?? "Arena queue"} · {formatLobbyMode(item.status.mode)}
          </span>
        </div>
        </div>
      </article>
    );
  }

  return (
    <article className="card-glass group relative overflow-hidden rounded-xl border border-white/10 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.28)] transition-all duration-500 hover:-translate-y-1.5 hover:border-red-400/45 hover:shadow-[0_22px_55px_rgba(0,0,0,0.42),0_0_30px_rgba(239,68,68,0.16)] sm:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(239,68,68,0.12),transparent_42%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -left-1/2 top-0 h-full w-1/4 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-700 group-hover:left-[125%] group-hover:opacity-100" />
      <div className="relative z-10">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-tech text-xs tracking-wider text-red-400">LIVE</span>
        </div>
        <div className="text-center sm:text-right min-w-0">
          <div className="text-xs">Ranked Battle</div>
          <div className="text-[10px] text-muted-foreground">
            #{item.left.rank} vs #{item.right.rank}
          </div>
        </div>
        <div className="font-tech text-sm text-accent">LIVE</div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
        <Fighter
          agent={{
            id: item.left.agentId,
            name: leaderboardName(item.left),
            clan: item.left.clan,
            archetype: item.left.archetype,
            elo: leaderboardElo(item.left),
          }}
        />
        <span className="font-display text-2xl text-muted-foreground">VS</span>
        <Fighter
          align="right"
          agent={{
            id: item.right.agentId,
            name: leaderboardName(item.right),
            clan: item.right.clan,
            archetype: item.right.archetype,
            elo: leaderboardElo(item.right),
          }}
        />
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
        <CardAction
          actionLabel={actionLabel}
          actionTo={actionTo}
          onAction={onAction}
          actionDisabled={actionDisabled}
          actionLoading={actionLoading}
        />
        <span className="text-xs text-muted-foreground">{item.watchLabel}</span>
      </div>
      </div>
    </article>
  );
}
