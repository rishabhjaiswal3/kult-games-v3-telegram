import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { aiArenaGatewayApi } from "@/api/aiArenaGatewayApi";
import type { AiArenaAgent } from "@/types/aiArenaGateway";

type QuestsProps = {
  agent: AiArenaAgent | null;
  agentId: string | null;
};

type QuestDef = {
  title: string;
  reward: string;
  current: number;
  target: number;
  done: boolean;
};

function QuestRow({ quest }: { quest: QuestDef }) {
  const pct = Math.min(100, Math.round((quest.current / quest.target) * 100));
  return (
    <div className="rounded-md border border-white/7 bg-white/[0.015] p-3">
      <div className="grid grid-cols-[minmax(0,1fr)_max-content_max-content] items-start gap-x-3 gap-y-1 text-xs">
        <span className="min-w-0 pr-1 leading-snug text-white/80">{quest.title}</span>
        <span className="whitespace-nowrap font-semibold leading-snug text-white">
          {quest.current} / {quest.target}
        </span>
        <span className={`whitespace-nowrap leading-snug ${quest.done ? "text-[#00f080]" : "text-white/40"}`}>
          {quest.reward} {quest.done ? "✓" : ""}
        </span>
      </div>
      <div className="mt-3 h-1 rounded-full bg-white/8">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            quest.done
              ? "bg-gradient-to-r from-[#00e88f] to-[#00b8ff]"
              : "bg-gradient-to-r from-[#6737ff] to-[#b048ff]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function Quests({ agent, agentId }: QuestsProps) {
  const walletQ = useQuery({
    queryKey: ["aiArenaGateway", "dashboard", "walletBalance", agentId],
    queryFn: () => aiArenaGatewayApi.getAgentWalletBalance(agentId!),
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

  const wins = Number(agent?.wins ?? 0);
  const completedJobs = (jobsQ.data?.jobs ?? []).filter((j) => j.status === "COMPLETED").length;
  const arenaBalance = Number(walletQ.data?.wallet?.balanceArena ?? 0);

  const WIN_TARGET = 3;
  const TRAIN_TARGET = 1;
  const ARENA_TARGET = 50;

  const quests: QuestDef[] = [
    {
      title: `Win ${WIN_TARGET} battles in any mode`,
      reward: "+20 $ARENA",
      current: Math.min(wins, WIN_TARGET),
      target: WIN_TARGET,
      done: wins >= WIN_TARGET,
    },
    {
      title: "Train your agent at least once",
      reward: "+10 $ARENA",
      current: Math.min(completedJobs, TRAIN_TARGET),
      target: TRAIN_TARGET,
      done: completedJobs >= TRAIN_TARGET,
    },
    {
      title: `Accumulate ${ARENA_TARGET} $ARENA`,
      reward: "+15 $ARENA",
      current: Math.min(Math.floor(arenaBalance), ARENA_TARGET),
      target: ARENA_TARGET,
      done: arenaBalance >= ARENA_TARGET,
    },
  ];

  const isLoading = jobsQ.isLoading || walletQ.isLoading;

  return (
    <section className="arena-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-tech text-xs uppercase">Quests</h3>
        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-white/30" /> : null}
      </div>

      <div className="mt-3 space-y-2">
        {!agentId ? (
          <p className="text-xs text-white/35">Select an agent to track quest progress.</p>
        ) : isLoading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-md border border-white/6 bg-white/[0.02]" />
          ))
        ) : (
          quests.map((q) => <QuestRow key={q.title} quest={q} />)
        )}
      </div>

      <Link
        to="/leaderboard"
        className="mt-3 flex h-10 w-full items-center justify-center gap-3 rounded-md bg-gradient-to-r from-[#45156e] to-[#7121c8] font-tech text-xs"
      >
        VIEW ALL QUESTS <ArrowUpRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
