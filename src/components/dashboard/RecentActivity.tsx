import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpToLine, Brain, Hexagon, Loader2, Swords, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { aiArenaGatewayApi } from "@/api/aiArenaGatewayApi";
import type { AiArenaFinancialTransaction, AiArenaTrainingJob } from "@/types/aiArenaGateway";

type RecentActivityProps = {
  agentId: string | null;
};

type ActivityItem = {
  id: string;
  Icon: LucideIcon;
  title: string;
  sub: string;
  value: string;
  color: string;
  time: string;
  ts: number;
};

function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function txToActivity(tx: AiArenaFinancialTransaction): ActivityItem {
  const type = (tx.type ?? "").toUpperCase();
  const amount = Number(tx.amount ?? 0);
  const sign = type.includes("WITHDRAW") || type.includes("WAGER") ? "-" : "+";
  const valueStr = amount > 0 ? `${sign}${amount.toLocaleString()} $ARENA` : "";

  let Icon: LucideIcon = Hexagon;
  let title = "Transaction";
  let sub = tx.currency ?? "ARENA";
  let color = "#00e88f";

  if (type === "BATTLE_REWARD") {
    Icon = Trophy; title = "Battle reward earned"; color = "#00e88f";
  } else if (type === "BATTLE_WAGER") {
    Icon = Swords; title = "Entered wager battle"; color = "#0089ff";
  } else if (type === "DEPOSIT") {
    Icon = ArrowDownToLine; title = "ARENA deposited"; color = "#00e88f";
  } else if (type === "WITHDRAWAL") {
    Icon = ArrowUpToLine; title = "Withdrawal queued"; color = "#f6bb00"; sub = "Solana";
  } else if (type === "TOURNAMENT_ENTRY") {
    Icon = Swords; title = "Tournament entry"; color = "#a036ff";
  } else if (type === "TOURNAMENT_PRIZE") {
    Icon = Trophy; title = "Tournament prize"; color = "#f6bb00";
  } else if (type === "STAKE") {
    Icon = Hexagon; title = "ARENA staked"; color = "#a036ff";
  }

  return {
    id: tx.id,
    Icon, title, sub, color,
    value: valueStr,
    time: timeAgo(tx.createdAt),
    ts: tx.createdAt ? new Date(tx.createdAt).getTime() : 0,
  };
}

function jobToActivity(job: AiArenaTrainingJob): ActivityItem {
  const status = (job.status ?? "").toUpperCase();
  const type = (job.type ?? "").replaceAll("_", " ");

  let title = `Training: ${type}`;
  let sub = "AI Model update";
  let color = "#a036ff";
  let value = "";

  if (status === "COMPLETED") {
    title = "Training completed";
    sub = type;
    value = "+XP";
    color = "#a036ff";
  } else if (status === "RUNNING") {
    title = "Training in progress";
    sub = type;
    color = "#0089ff";
  } else if (status === "FAILED") {
    title = "Training failed";
    sub = type;
    color = "#ff4444";
  }

  const dateStr = job.completedAt ?? job.startedAt ?? job.createdAt;
  return {
    id: job.id,
    Icon: Brain, title, sub, color, value,
    time: timeAgo(dateStr),
    ts: dateStr ? new Date(dateStr).getTime() : 0,
  };
}

export function RecentActivity({ agentId }: RecentActivityProps) {
  const txQ = useQuery({
    queryKey: ["aiArenaGateway", "dashboard", "recentTx", agentId],
    queryFn: () => aiArenaGatewayApi.getAgentWalletTransactions(agentId!, 1, 6),
    enabled: !!agentId,
    staleTime: 30_000,
    retry: false,
  });

  const jobsQ = useQuery({
    queryKey: ["aiArenaGateway", "dashboard", "recentJobs", agentId],
    queryFn: () => aiArenaGatewayApi.listTrainingJobs({ agentId: agentId! }),
    enabled: !!agentId,
    staleTime: 30_000,
    retry: false,
  });

  const isLoading = txQ.isLoading || jobsQ.isLoading;

  const items: ActivityItem[] = [
    ...(txQ.data?.transactions ?? []).map(txToActivity),
    ...(jobsQ.data?.jobs ?? []).filter((j) => j.status !== "QUEUED").map(jobToActivity),
  ]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 5);

  return (
    <section className="arena-panel p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-tech text-xs uppercase">Recent Activity</h3>
        {(txQ.isFetching || jobsQ.isFetching) ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-white/30" />
        ) : null}
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg border border-white/6 bg-white/[0.02]" />
          ))}
        </div>
      ) : !agentId ? (
        <p className="mt-4 text-xs text-white/35">Select an agent to see activity.</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-xs text-white/35">No activity recorded yet. Win a battle or complete training to get started.</p>
      ) : (
        <div className="mt-4 divide-y divide-white/7">
          {items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 py-3"
            >
              <div
                className="grid h-9 w-9 place-items-center rounded-full bg-white/5"
                style={{ color: item.color }}
              >
                <item.Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 text-xs">
                <div className="truncate text-white/82">{item.title}</div>
                <div className="mt-0.5 text-white/45">{item.sub}</div>
              </div>
              <div className="text-right text-xs">
                {item.value ? (
                  <div className="font-semibold" style={{ color: item.color }}>{item.value}</div>
                ) : null}
                <div className="text-white/45">{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
