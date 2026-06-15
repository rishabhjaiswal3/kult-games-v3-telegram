import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Award, Clock, Eye, Hexagon, Loader2, Plus, Search, Sparkles, TrendingUp, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { ArenaPageLayout } from "@/components/arena/ArenaPageLayout";
import { ArenaAgentThumbnail } from "@/components/arena/ArenaAgentThumbnail";
import { DashboardSignInGate } from "@/components/dashboard/DashboardSignInGate";
import { aiArenaGatewayApi } from "@/api/aiArenaGatewayApi";
import {
  trainingBoosts,
  trainingPrograms,
  trainingTabs,
} from "@/components/training/trainingData";
import { useAuth } from "@/contexts/AuthContext";
import { useAiArenaGatewaySession } from "@/hooks/useAiArenaGatewaySession";
import { useMyArenaAgents } from "@/hooks/useMyArenaAgents";
import type { AiArenaAgent, AiArenaTrainingEligibilityResponse, AiArenaTrainingJob } from "@/types/aiArenaGateway";

type TrainingJobWithAgent = AiArenaTrainingJob & {
  agent?: AiArenaAgent;
};

function jobTypeLabel(type?: string | null) {
  switch (type) {
    case "REINFORCEMENT_LEARNING":
      return "Reinforcement Learning";
    case "LORA_FINETUNE":
      return "LoRA Fine-tune";
    case "BEHAVIOUR_CLONING":
      return "Behaviour Cloning";
    default:
      return type ? type.replaceAll("_", " ") : "Training Job";
  }
}

function progressFromStatus(status?: string | null) {
  switch (status) {
    case "QUEUED":
      return 18;
    case "RUNNING":
      return 64;
    case "COMPLETED":
      return 100;
    case "FAILED":
      return 100;
    case "CANCELLED":
      return 100;
    default:
      return 8;
  }
}

function statusTone(status?: string | null) {
  switch (status) {
    case "COMPLETED":
      return "text-emerald-400";
    case "RUNNING":
      return "text-sky-400";
    case "FAILED":
      return "text-rose-400";
    case "CANCELLED":
      return "text-amber-400";
    default:
      return "text-purple-300";
  }
}

function sortJobs(jobs: TrainingJobWithAgent[]) {
  return [...jobs].sort((a, b) => {
    const left = new Date(b.createdAt ?? 0).getTime();
    const right = new Date(a.createdAt ?? 0).getTime();
    return left - right;
  });
}

function filterJobsForTab(activeTab: string, jobs: TrainingJobWithAgent[]) {
  if (activeTab === "TRAINING SESSIONS") {
    return jobs.filter((job) => job.status === "QUEUED" || job.status === "RUNNING");
  }
  if (activeTab === "SKILLS") {
    return jobs.filter((job) => job.status === "COMPLETED");
  }
  if (activeTab === "EVO LAB") {
    return jobs.filter((job) => job.status === "FAILED" || job.status === "CANCELLED");
  }
  return jobs;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function dedupeJobs(jobs: TrainingJobWithAgent[]) {
  const seen = new Set<string>();
  const out: TrainingJobWithAgent[] = [];
  for (const job of jobs) {
    if (!job.id || seen.has(job.id)) continue;
    seen.add(job.id);
    out.push(job);
  }
  return out;
}

function deriveProgramType(programName: string): "BEHAVIOUR_CLONING" | "REINFORCEMENT_LEARNING" | "LORA_FINETUNE" {
  if (programName === "MENTAL FORTITUDE") return "REINFORCEMENT_LEARNING";
  if (programName === "RESOURCE MANAGEMENT") return "LORA_FINETUNE";
  return "BEHAVIOUR_CLONING";
}

function eligibilityReasons(eligibility?: AiArenaTrainingEligibilityResponse | null) {
  return {
    hasRunningJobs: eligibility?.reasons?.hasRunningJobs ?? false,
    insufficientBattles: eligibility?.reasons?.insufficientBattles ?? false,
    totalBattles: eligibility?.reasons?.totalBattles ?? 0,
    runningJobs: eligibility?.reasons?.runningJobs ?? 0,
  };
}

function readinessCopy(eligibility?: AiArenaTrainingEligibilityResponse | null) {
  if (!eligibility) return "Select an agent to inspect training readiness.";
  if (eligibility.eligible) return "This agent is ready to queue a new training job.";
  const reasons = eligibilityReasons(eligibility);
  if (reasons.hasRunningJobs) return "This agent already has a running training job.";
  if (reasons.insufficientBattles) {
    return `This agent needs more battles before training can start.`;
  }
  return "Training is temporarily unavailable for this agent.";
}

const TrainingPage = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { isAiArenaReady } = useAiArenaGatewaySession();
  const [activeTab, setActiveTab] = useState<string>("OVERVIEW");
  const myAgentsQ = useMyArenaAgents(1, 50);
  const agents = myAgentsQ.data?.agents ?? [];
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobLookupInput, setJobLookupInput] = useState("");

  useEffect(() => {
    setSelectedAgentId((current) => {
      if (current && agents.some((agent) => agent.id === current)) return current;
      return agents[0]?.id ?? null;
    });
  }, [agents]);

  const trainingJobsQ = useQuery({
    queryKey: ["aiArenaGateway", "trainingPageJobs", agents.map((agent) => agent.id).join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        agents.map(async (agent) => {
          const jobs = await aiArenaGatewayApi.getAgentTrainingJobs(agent.id);
          return jobs.map((job) => ({ ...job, agent }));
        })
      );
      return sortJobs(dedupeJobs(results.flat()));
    },
    enabled: isAuthenticated && isAiArenaReady && agents.length > 0,
    staleTime: 10_000,
    retry: 1,
  });

  const eligibilityQ = useQuery({
    queryKey: ["aiArenaGateway", "trainingPageEligibility", agents.map((agent) => agent.id).join(",")],
    queryFn: async () => {
      const entries = await Promise.all(
        agents.map(async (agent) => {
          try {
            const result = await aiArenaGatewayApi.getTrainingEligibility(agent.id);
            return [agent.id, result] as const;
          } catch {
            return [agent.id, null] as const;
          }
        })
      );
      return Object.fromEntries(entries) as Record<string, AiArenaTrainingEligibilityResponse | null>;
    },
    enabled: isAuthenticated && isAiArenaReady && agents.length > 0,
    staleTime: 10_000,
    retry: 1,
  });

  const globalJobsQ = useQuery({
    queryKey: ["aiArenaGateway", "trainingPageGlobalJobs", agents.map((agent) => agent.id).join(",")],
    queryFn: async () => {
      const result = await aiArenaGatewayApi.listTrainingJobs();
      return sortJobs(
        dedupeJobs(
          (result.jobs ?? []).map((job) => ({
            ...job,
            agent: agents.find((agent) => agent.id === job.agentId),
          }))
        )
      );
    },
    enabled: isAuthenticated && isAiArenaReady,
    staleTime: 10_000,
    retry: 1,
  });

  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) ?? null;
  const selectedEligibility = selectedAgentId ? eligibilityQ.data?.[selectedAgentId] ?? null : null;
  const selectedEligibilityReasons = eligibilityReasons(selectedEligibility);
  const allJobs = trainingJobsQ.data ?? [];
  const globalJobs = globalJobsQ.data ?? [];
  const filteredJobs = filterJobsForTab(activeTab, allJobs);
  const activeJobs = allJobs.filter((job) => job.status === "QUEUED" || job.status === "RUNNING");
  const completedJobs = allJobs.filter((job) => job.status === "COMPLETED");
  const eligibleAgentsCount = Object.values(eligibilityQ.data ?? {}).filter((entry) => entry?.eligible).length;
  const visibleGlobalJobs = globalJobs.slice(0, 6);
  const selectedJobSummary = useMemo(
    () => [...allJobs, ...globalJobs].find((job) => job.id === selectedJobId) ?? null,
    [allJobs, globalJobs, selectedJobId]
  );

  useEffect(() => {
    if (selectedJobId) return;
    const defaultJobId = allJobs[0]?.id ?? globalJobs[0]?.id ?? null;
    if (!defaultJobId) return;
    setSelectedJobId(defaultJobId);
    setJobLookupInput(defaultJobId);
  }, [allJobs, globalJobs, selectedJobId]);

  const jobDetailQ = useQuery({
    queryKey: ["aiArenaGateway", "trainingPageJobDetail", selectedJobId],
    queryFn: () => aiArenaGatewayApi.getTrainingJob(selectedJobId!),
    enabled: isAuthenticated && isAiArenaReady && !!selectedJobId,
    staleTime: 10_000,
    retry: 1,
  });

  const inspectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setJobLookupInput(jobId);
  };

  const invalidateTrainingQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: ["aiArenaGateway", "trainingPageJobs"], exact: false });
    await queryClient.invalidateQueries({ queryKey: ["aiArenaGateway", "trainingPageEligibility"], exact: false });
    await queryClient.invalidateQueries({ queryKey: ["aiArenaGateway", "trainingPageGlobalJobs"], exact: false });
    await queryClient.invalidateQueries({ queryKey: ["aiArenaGateway", "trainingPageJobDetail"], exact: false });
    await queryClient.invalidateQueries({ queryKey: ["aiArenaGateway", "myAgents"], exact: false });
  };

  const queueMut = useMutation({
    mutationFn: async (program?: string) => {
      if (!selectedAgentId) throw new Error("Select an agent first.");
      if (!selectedEligibility?.eligible) {
        throw new Error(readinessCopy(selectedEligibility));
      }
      return aiArenaGatewayApi.createTrainingJob({
        agentId: selectedAgentId,
        type: deriveProgramType(program ?? "BATTLE SIMULATION"),
        priority: 5,
        config: {
          source: "training-page",
          program: program ?? "Quick Queue",
        },
      });
    },
    onSuccess: async (result) => {
      toast.success(`Training queued: ${jobTypeLabel(result.job.type)}`);
      await invalidateTrainingQueries();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not queue training");
    },
  });

  const quickTrainMut = useMutation({
    mutationFn: async () => {
      if (!selectedAgentId) throw new Error("Select an agent first.");
      if (!selectedEligibility?.eligible) {
        throw new Error(readinessCopy(selectedEligibility));
      }
      return aiArenaGatewayApi.startAgentTraining(selectedAgentId, {
        type: "BEHAVIOUR_CLONING",
        priority: 1,
      });
    },
    onSuccess: async (result) => {
      toast.success(`Quick training queued: ${jobTypeLabel(result.job.type)}`);
      inspectJob(result.job.id);
      await invalidateTrainingQueries();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not start quick training");
    },
  });

  const cancelMut = useMutation({
    mutationFn: async (jobId: string) => aiArenaGatewayApi.cancelTrainingJob(jobId),
    onSuccess: async () => {
      toast.success("Training job cancelled");
      await invalidateTrainingQueries();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not cancel training job");
    },
  });

  if (!isAuthenticated) {
    return (
      <DashboardSignInGate
        title="Training Center"
        description="Connect your wallet to manage AI Arena training jobs for your agents."
      />
    );
  }

  return (
    <ArenaPageLayout>
      <div>
        <h1 className="font-tech text-3xl font-bold uppercase tracking-tight text-white">TRAINING CENTER</h1>
        <p className="mt-1 text-[11px] font-medium text-white/55">
          Monitor real AI Arena training jobs, queue new runs, and check eligibility by agent.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="MY AGENTS" value={agents.length.toLocaleString()} icon={Zap} color="text-purple-400" />
        <StatCard label="TRAINING JOBS" value={allJobs.length.toLocaleString()} icon={Activity} color="text-blue-400" />
        <StatCard label="ACTIVE JOBS" value={activeJobs.length.toLocaleString()} icon={Clock} color="text-emerald-400" />
        <StatCard label="COMPLETED" value={completedJobs.length.toLocaleString()} icon={Award} color="text-sky-400" />
        <StatCard label="ELIGIBLE AGENTS" value={eligibleAgentsCount.toLocaleString()} icon={TrendingUp} color="text-amber-400" />
      </div>

      <div className="arena-panel border-white/8 bg-[#04080f]/95 p-3">
        <div className="flex flex-wrap items-center gap-1">
          {trainingTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded px-3 py-1.5 font-tech text-[10px] font-bold uppercase tracking-wider transition ${
                activeTab === tab ? "bg-[#9a35ff] text-white" : "text-white/40 hover:bg-white/5 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_376px]">
        <div className="min-w-0 space-y-4">
          <div className="arena-panel overflow-hidden border-white/8 bg-[#04080f]/95">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 p-5">
              <div>
                <h3 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">Training queue</h3>
                <p className="mt-1 text-[11px] text-white/45">
                  Start an instant agent training run or queue a custom job for your selected fighter.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => quickTrainMut.mutate()}
                  disabled={!selectedAgentId || quickTrainMut.isPending || !selectedEligibility?.eligible}
                  className="flex cursor-pointer items-center gap-1 rounded border border-cyan-500/35 bg-cyan-500/10 px-3 py-1 font-tech text-[9px] font-bold uppercase tracking-wider text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {quickTrainMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                  <span>Quick train</span>
                </button>
                <button
                  type="button"
                  onClick={() => queueMut.mutate(undefined)}
                  disabled={!selectedAgentId || queueMut.isPending || !selectedEligibility?.eligible}
                  className="flex cursor-pointer items-center gap-1 rounded border border-purple-500/35 bg-[#9a35ff]/10 px-3 py-1 font-tech text-[9px] font-bold uppercase tracking-wider text-purple-400 transition hover:border-purple-400 hover:bg-[#9a35ff]/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {queueMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  <span>Create custom job</span>
                </button>
              </div>
            </div>

            <div className="border-b border-white/8 px-5 py-4">
              <div className="mb-2 font-tech text-[9px] uppercase tracking-[0.18em] text-white/38">Selected agent</div>
              <div className="flex flex-wrap gap-2">
                {agents.map((agent) => {
                  const isActive = agent.id === selectedAgentId;
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition ${
                        isActive
                          ? "border-[#9a35ff]/60 bg-[#9a35ff]/15 text-white"
                          : "border-white/8 bg-[#03070d]/60 text-white/70 hover:border-white/15 hover:text-white"
                      }`}
                    >
                      <ArenaAgentThumbnail agent={agent} />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold">{agent.name}</span>
                        <span className="block truncate text-[10px] text-white/45">{agent.archetype}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 divide-y divide-white/6 p-5">
              {trainingJobsQ.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-white/55">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading training jobs…
                </div>
              ) : filteredJobs.length > 0 ? (
                filteredJobs.map((job, index) => (
                  <div
                    key={job.id}
                    className={`flex flex-wrap items-center justify-between gap-4 ${selectedJobId === job.id ? "rounded-xl border border-[#9a35ff]/35 bg-[#9a35ff]/6 px-3" : ""} ${index === 0 ? "pb-4" : index === filteredJobs.length - 1 ? "pt-4" : "py-4"}`}
                  >
                    <div className="flex items-center gap-3">
                      <ArenaAgentThumbnail agent={job.agent ?? fallbackAgentForTraining(job.agentId)} className="h-10 w-10 rounded-xl" size="md" />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold leading-none text-white">{job.agent?.name ?? shortAgentName(job.agentId)}</span>
                          <Hexagon className="h-3 w-3 fill-[#9a35ff] text-[#9a35ff]" />
                        </div>
                        <span className="block text-[9px] text-white/40">{job.agent?.clan ?? job.agent?.archetype ?? "AI Arena"}</span>
                      </div>
                    </div>

                    <div className="min-w-[220px] flex-1 space-y-1.5">
                      <div className="flex items-baseline justify-between text-[10px] font-semibold text-white/50">
                        <span className="font-bold leading-tight text-white">{jobTypeLabel(job.type)}</span>
                        <span className={`font-tech uppercase ${statusTone(job.status)}`}>{job.status}</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-[#9a35ff]" style={{ width: `${progressFromStatus(job.status)}%` }} />
                      </div>
                      <span className="block text-[8px] font-medium leading-none text-white/35">
                        {job.datasetRootHash ? `dataset ${job.datasetRootHash.slice(0, 14)}…` : `created ${formatDateTime(job.createdAt)}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3.5">
                      <button
                        type="button"
                        onClick={() => inspectJob(job.id)}
                        className="flex cursor-pointer items-center gap-1 rounded border border-white/8 bg-[#0a0f1b]/60 px-2.5 py-1 font-tech text-[9px] font-bold uppercase tracking-wider text-cyan-300 transition hover:border-cyan-500/35 hover:bg-cyan-950/10"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Inspect</span>
                      </button>
                      <div className="flex items-center gap-1 font-tech text-[10px] font-semibold text-white/55">
                        <Clock className="h-3.5 w-3.5 text-white/30" />
                        <span>{formatDateTime(job.startedAt ?? job.createdAt)}</span>
                      </div>
                      {(job.status === "QUEUED" || job.status === "RUNNING") ? (
                        <button
                          type="button"
                          onClick={() => cancelMut.mutate(job.id)}
                          disabled={cancelMut.isPending}
                          className="flex cursor-pointer items-center gap-1 rounded border border-white/8 bg-[#0a0f1b]/60 px-2.5 py-1 font-tech text-[9px] font-bold uppercase tracking-wider text-rose-300 transition hover:border-rose-500/35 hover:bg-rose-950/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {cancelMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                          <span>Cancel</span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-white/50">
                  {agents.length === 0 ? "Create an AI Arena agent first to start training." : "No training jobs match this view yet."}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/8 bg-white/[0.005] px-5 py-4 font-tech text-[10px] font-bold uppercase text-white/40">
              <span>Visible jobs • {filteredJobs.length}</span>
              <span className="text-white/70">Active queue • {activeJobs.length}</span>
            </div>
          </div>

          <div className="arena-panel overflow-hidden border-white/8 bg-[#04080f]/95">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 p-5">
              <div>
                <h3 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">Global training feed</h3>
                <p className="mt-1 text-[11px] text-white/45">
                  A live look at recent training activity happening across the arena.
                </p>
              </div>
              <span className="font-tech text-[10px] uppercase tracking-[0.16em] text-white/40">
                Visible jobs • {globalJobs.length}
              </span>
            </div>

            <div className="space-y-3 p-5">
              {globalJobsQ.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-white/55">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading global training jobs…
                </div>
              ) : visibleGlobalJobs.length > 0 ? (
                visibleGlobalJobs.map((job) => (
                  <div
                    key={job.id}
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3.5 py-3 transition ${
                      selectedJobId === job.id
                        ? "border-cyan-500/30 bg-cyan-500/8"
                        : "border-white/8 bg-black/15"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-bold text-white">
                          {job.agent?.name ?? shortAgentName(job.agentId)}
                        </span>
                        <span className={`font-tech text-[9px] uppercase tracking-[0.16em] ${statusTone(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="mt-1 text-[10px] text-white/45">
                        {jobTypeLabel(job.type)} · {formatDateTime(job.createdAt)}
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-white/35">
                        Job {job.id}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => inspectJob(job.id)}
                      className="flex cursor-pointer items-center gap-1 rounded border border-white/8 bg-[#0a0f1b]/60 px-3 py-1.5 font-tech text-[9px] font-bold uppercase tracking-wider text-cyan-300 transition hover:border-cyan-500/35 hover:bg-cyan-950/10"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Inspect Job
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-sm text-white/50">No global training jobs are visible right now.</div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">Training programs</h3>
              <span className="font-tech text-[10px] uppercase tracking-[0.16em] text-white/40">Queue from the same page</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {trainingPrograms.map((program) => (
                <div key={program.name} className={`arena-panel relative flex flex-col justify-between space-y-4 overflow-hidden border p-5 transition ${program.color}`}>
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold uppercase leading-tight text-white/95">{program.name}</h4>
                    <p className="text-xs font-semibold leading-relaxed opacity-80">{program.desc}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="select-none rounded border bg-black/40 px-2.5 py-1.5 font-tech text-[10px] font-bold uppercase tracking-wide">
                        {program.badge}
                      </span>
                      <span className="font-tech text-[11px] font-bold text-emerald-300">{program.pct}</span>
                      <span className="font-tech text-[11px] font-semibold text-white/55">{program.winRate}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => queueMut.mutate(program.name)}
                      disabled={!selectedAgentId || queueMut.isPending || !selectedEligibility?.eligible}
                      className="cursor-pointer rounded border border-white/8 bg-[#0a0f1b]/60 px-5 py-2 font-tech text-[10px] font-bold uppercase tracking-wider text-white transition hover:border-purple-500/35 hover:bg-[#9a35ff]/10 hover:text-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      SELECT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4 self-start xl:sticky xl:top-24">
          <div className="arena-panel relative space-y-4 overflow-hidden border-white/8 bg-[#04080f]/95 p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">Job inspector</h3>
              <span className="font-tech text-[10px] uppercase tracking-[0.16em] text-white/40">Look up any job by ID</span>
            </div>

            <div className="space-y-2">
              <label className="font-tech text-[9px] uppercase tracking-[0.16em] text-white/35">Job ID</label>
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
                  <input
                    value={jobLookupInput}
                    onChange={(event) => setJobLookupInput(event.target.value)}
                    placeholder="Paste training job id"
                    className="w-full rounded border border-white/8 bg-[#03070d]/60 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-purple-500/45"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextId = jobLookupInput.trim();
                    if (!nextId) {
                      toast.error("Paste a training job ID to inspect.");
                      return;
                    }
                    setSelectedJobId(nextId);
                  }}
                  className="rounded border border-cyan-500/35 bg-cyan-500/10 px-3 py-2.5 font-tech text-[10px] uppercase tracking-[0.16em] text-cyan-300 transition hover:border-cyan-400"
                >
                  Inspect
                </button>
              </div>
            </div>

            {jobDetailQ.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-white/55">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading job snapshot…
              </div>
            ) : jobDetailQ.isError ? (
              <div className="rounded-lg border border-rose-500/20 bg-rose-950/10 px-4 py-3 text-sm text-rose-100/85">
                Could not load that training job. Check the job ID and try again.
              </div>
            ) : jobDetailQ.data?.job ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-white/8 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-white">{jobTypeLabel(jobDetailQ.data.job.type)}</div>
                      <div className="mt-1 font-mono text-[10px] text-white/40">{jobDetailQ.data.job.id}</div>
                    </div>
                    <div className={`font-tech text-[10px] uppercase tracking-[0.16em] ${statusTone(jobDetailQ.data.job.status)}`}>
                      {jobDetailQ.data.job.status}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <ReadinessStat label="Agent" value={selectedJobSummary?.agent?.name ?? shortAgentName(jobDetailQ.data.job.agentId)} />
                  <ReadinessStat label="Priority" value={String(jobDetailQ.data.job.priority ?? 0)} />
                  <ReadinessStat label="Started" value={formatDateTime(jobDetailQ.data.job.startedAt)} />
                  <ReadinessStat label="Completed" value={formatDateTime(jobDetailQ.data.job.completedAt)} />
                </div>

                <div className="rounded-lg border border-white/8 bg-black/20 px-3 py-2.5 text-[10px] text-white/55">
                  {jobDetailQ.data.job.datasetRootHash
                    ? `Dataset root ${jobDetailQ.data.job.datasetRootHash}`
                    : "No dataset root hash on this job."}
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/50">Select or paste a job ID to inspect a single training job.</p>
            )}
          </div>

          <div className="arena-panel relative space-y-4 overflow-hidden border-white/8 bg-[#04080f]/95 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">Agent readiness</h3>
              {eligibilityQ.isLoading ? <Loader2 className="h-4 w-4 animate-spin text-white/40" /> : null}
            </div>

            {selectedAgent ? (
              <div className="space-y-3 text-sm text-white/72">
                <div className="flex items-center gap-3">
                  <ArenaAgentThumbnail agent={selectedAgent} className="h-14 w-14 rounded-xl" size="md" />
                  <div>
                    <div className="font-tech text-sm text-white">{selectedAgent.name}</div>
                    <div className="text-[11px] text-white/45">
                      {selectedAgent.clan} · {selectedAgent.archetype}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-white/8 bg-black/20 p-3 text-xs">
                  <div className={`font-tech text-[10px] uppercase tracking-[0.16em] ${selectedEligibility?.eligible ? "text-emerald-400" : "text-amber-300"}`}>
                    {selectedEligibility?.eligible ? "Eligible" : "Needs attention"}
                  </div>
                  <p className="mt-2 leading-relaxed text-white/60">{readinessCopy(selectedEligibility)}</p>
                </div>

                {selectedEligibility ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <ReadinessStat label="Total Battles" value={selectedEligibilityReasons.totalBattles.toLocaleString()} />
                    <ReadinessStat label="Running Jobs" value={selectedEligibilityReasons.runningJobs.toLocaleString()} />
                    <ReadinessStat label="Has Running Job" value={selectedEligibilityReasons.hasRunningJobs ? "Yes" : "No"} />
                    <ReadinessStat label="Needs More Battles" value={selectedEligibilityReasons.insufficientBattles ? "Yes" : "No"} />
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-white/50">No AI Arena agents available yet.</p>
            )}
          </div>

          <div className="arena-panel relative space-y-4 overflow-hidden border-white/8 bg-[#04080f]/95 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">Training boosts</h3>
              <Sparkles className="h-4 w-4 text-purple-300" />
            </div>
            <div className="space-y-3.5">
              {trainingBoosts.map((boost) => (
                <div key={boost.name} className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded border ${
                      boost.color === "purple"
                        ? "border-purple-500/20 bg-purple-500/10 text-purple-400"
                        : boost.color === "blue"
                          ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                          : boost.color === "amber"
                            ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    {boost.icon === "sparkles" && <Sparkles className="h-5 w-5 fill-current" />}
                    {boost.icon === "zap" && <Zap className="h-5 w-5 animate-pulse fill-current" />}
                    {boost.icon === "activity" && <Activity className="h-5 w-5 fill-current" />}
                    {boost.icon === "award" && <Award className="h-5 w-5 fill-current" />}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5 text-[10px] font-semibold text-white/50">
                    <div className="flex items-center justify-between">
                      <span className="font-bold leading-none text-white">{boost.name}</span>
                      <span className="font-tech text-[8px] uppercase tracking-wider text-white/35">{boost.count}</span>
                    </div>
                    <div className="text-[9px] leading-none text-white/30">{boost.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </ArenaPageLayout>
  );
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: typeof Zap;
  color: string;
}) {
  return (
    <div className="arena-panel flex items-center justify-between border-white/8 bg-[#04080f]/90 p-4">
      <div className="space-y-1">
        <span className="font-tech text-[9px] font-bold uppercase tracking-wider text-white/40">{label}</span>
        <span className="font-tech block text-xl font-bold text-white">{value}</span>
      </div>
      <div className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 ${color}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
    </div>
  );
}

function ReadinessStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/8 bg-black/20 px-3 py-2">
      <div className="font-tech text-[9px] uppercase tracking-[0.16em] text-white/35">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function shortAgentName(agentId: string) {
  return `Agent ${agentId.slice(0, 6)}`;
}

function fallbackAgentForTraining(agentId: string): AiArenaAgent {
  return {
    id: agentId,
    name: shortAgentName(agentId),
    clan: "Unknown",
    archetype: "Unknown",
    evolutionStage: "GENESIS",
    eloRating: 0,
    wins: 0,
    losses: 0,
  };
}

export default TrainingPage;
