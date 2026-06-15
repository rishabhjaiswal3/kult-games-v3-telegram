import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2 } from "lucide-react";
import { aiArenaGatewayApi } from "@/api/aiArenaGatewayApi";
import type { AiArenaAgent } from "@/types/aiArenaGateway";
import { getRankFromElo } from "@/utils/rankSystem";

type BalancePanelProps = {
  agent: AiArenaAgent | null;
};

function formatArenaBalance(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function BalancePanel({ agent }: BalancePanelProps) {
  const walletQ = useQuery({
    queryKey: ["aiArenaGateway", "dashboard", "walletBalance", agent?.id],
    queryFn: () => aiArenaGatewayApi.getAgentWalletBalance(agent!.id),
    enabled: !!agent?.id,
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
  });

  const rankQ = useQuery({
    queryKey: ["aiArenaGateway", "dashboard", "agentRank", agent?.id],
    queryFn: () => aiArenaGatewayApi.getLeaderboardRankForAgent(agent!.id, "global"),
    enabled: !!agent?.id,
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
  });

  const totalAgentsQ = useQuery({
    queryKey: ["aiArenaGateway", "dashboard", "agentRosterTotal"],
    queryFn: () => aiArenaGatewayApi.listAgents(1, 1),
    enabled: !!agent?.id,
    staleTime: 60_000,
    retry: 1,
  });

  const balance = walletQ.data?.wallet?.balanceArena;
  const solanaAddress = walletQ.data?.wallet?.solanaAddress;
  const rank = rankQ.data?.rank;
  const totalAgents = totalAgentsQ.data?.total;
  const topPercent =
    rank && totalAgents && totalAgents > 0 ? Math.max(1, Math.ceil((rank / totalAgents) * 100)) : null;
  // Use agent eloRating directly (always present on AiArenaAgent) for league badge
  const agentElo = agent?.eloRating ?? null;
  const leagueInfo = agentElo != null ? getRankFromElo(agentElo) : null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
      <section className="arena-panel relative min-h-[84px] overflow-hidden p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-tech text-[10px] uppercase text-white/45">$Arena Balance</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-white/30">
              {agent ? agent.name : "No agent selected"}
            </div>
          </div>
          {walletQ.isFetching ? <Loader2 className="h-4 w-4 animate-spin text-white/35" /> : null}
        </div>
        <div className="mt-2 flex items-center gap-4">
          <span className="text-2xl font-semibold">{agent ? formatArenaBalance(balance) : "—"}</span>
          <img src="/arena-token-cropped.png" className="h-9 w-9 object-contain" alt="ARENA" />
        </div>
        {solanaAddress && !solanaAddress.startsWith("pending_") ? (
          <a
            href={`https://explorer.solana.com/address/${solanaAddress}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[10px] font-mono text-white/35 transition hover:text-neon-cyan"
          >
            <ExternalLink className="h-2.5 w-2.5" />
            View on Solana
          </a>
        ) : null}
        {agent && walletQ.isError ? (
          <div className="mt-2 text-xs text-white/40">Wallet balance unavailable for this agent right now.</div>
        ) : null}
      </section>
      <section className="arena-panel flex items-center justify-between p-4">
        <div>
          <div className="font-tech text-[10px] uppercase text-white/45">Rank</div>
          <div className="mt-2 text-xl font-semibold">
            {agent ? (rank != null ? `#${rank.toLocaleString()}` : "UNRANKED") : "—"}
          </div>
          {leagueInfo && agent ? (
            <div
              className="mt-0.5 font-tech text-[10px] uppercase tracking-wider"
              style={{ color: leagueInfo.color }}
            >
              {leagueInfo.name}
            </div>
          ) : null}
          <div className="mt-1 text-xs text-white/45">
            {agent
              ? topPercent != null
                ? `TOP ${topPercent}%`
                : rankQ.isError
                  ? "Rank unavailable"
                  : totalAgentsQ.isLoading
                    ? "Loading leaderboard"
                    : "Leaderboard pending"
              : "Select an agent"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {rankQ.isFetching ? <Loader2 className="h-4 w-4 animate-spin text-white/35" /> : null}
          {leagueInfo && agent ? (
            <img
              src={leagueInfo.image}
              alt={leagueInfo.name}
              title={leagueInfo.name}
              className="h-[72px] w-[72px] object-contain"
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
