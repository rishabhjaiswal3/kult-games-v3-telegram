import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpToLine, Copy, ExternalLink, Loader2, ShieldCheck, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { aiArenaGatewayApi } from "@/api/aiArenaGatewayApi";
import { ArenaTokenAmount } from "@/components/arena/ArenaTokenAmount";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AiArenaAgent, AiArenaFinancialTransaction } from "@/types/aiArenaGateway";

type ArenaAgentWalletManagerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: AiArenaAgent[];
  agentsLoading?: boolean;
  initialAgentId?: string | null;
  onCreateAgent?: () => void;
  onWalletUpdated?: (agentId: string) => void | Promise<void>;
};

function formatTxType(type?: string | null) {
  return (type ?? "TRANSACTION").replaceAll("_", " ");
}

function shortHash(value?: string | null) {
  if (!value) return "—";
  if (value.length <= 18) return value;
  return `${value.slice(0, 8)}…${value.slice(-8)}`;
}

function formatTxDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

const SOLANA_CLUSTER = "devnet";

function solanaExplorerUrl(address: string) {
  return `https://explorer.solana.com/address/${address}?cluster=${SOLANA_CLUSTER}`;
}

function isRealSolanaAddress(address?: string | null) {
  if (!address) return false;
  return !address.startsWith("pending_") && address.length >= 32;
}

function formatAgentSelectLabel(agent: AiArenaAgent) {
  return `${agent.name} — ${agent.archetype} — ELO ${Number(agent.eloRating ?? 0).toLocaleString()}`;
}

function transactionTone(status?: string | null) {
  const normalized = status?.toUpperCase();
  if (normalized === "CONFIRMED") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  if (normalized === "PENDING") return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  if (normalized === "FAILED") return "border-rose-500/20 bg-rose-500/10 text-rose-200";
  return "border-white/10 bg-white/5 text-white/70";
}

function WalletMetric({
  label,
  children,
  accentClassName = "text-neon-cyan",
}: {
  label: string;
  children: ReactNode;
  accentClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#02070d]/90 px-4 py-4 min-h-[96px]">
      <div className={`text-[10px] font-mono uppercase tracking-[0.18em] ${accentClassName}`}>{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function WalletTransactionRow({ tx }: { tx: AiArenaFinancialTransaction }) {
  const destination =
    tx.metadata && typeof tx.metadata === "object" && "destination" in tx.metadata
      ? String((tx.metadata as Record<string, unknown>).destination ?? "")
      : "";
  const type = (tx.type ?? "").toUpperCase();
  const Icon = type.includes("WITHDRAW") ? ArrowUpToLine : ArrowDownToLine;
  const iconClassName = type.includes("WITHDRAW")
    ? "border-orange-500/20 bg-orange-500/10 text-orange-200"
    : "border-neon-cyan/20 bg-neon-cyan/10 text-neon-cyan";

  return (
    <div className="rounded-xl border border-white/10 bg-[#02070d]/90 px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${iconClassName}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-sm font-bold text-foreground">{formatTxType(tx.type)}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{formatTxDate(tx.createdAt)}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm font-semibold text-foreground">
            {Number(tx.amount ?? 0).toLocaleString()} {tx.currency ?? "ARENA"}
          </div>
          <div
            className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${transactionTone(tx.status)}`}
          >
            {tx.status ?? "UNKNOWN"}
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        {tx.txHash ? <span className="font-mono">Tx {shortHash(tx.txHash)}</span> : null}
        {destination ? <span className="font-mono">To {shortHash(destination)}</span> : null}
      </div>
    </div>
  );
}

export function ArenaAgentWalletManagerModal({
  open,
  onOpenChange,
  agents,
  agentsLoading = false,
  initialAgentId = null,
  onCreateAgent,
  onWalletUpdated,
}: ArenaAgentWalletManagerModalProps) {
  const queryClient = useQueryClient();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(initialAgentId);
  const [tab, setTab] = useState<"fund" | "withdraw">("fund");
  const [fundAmount, setFundAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDestination, setWithdrawDestination] = useState("");

  useEffect(() => {
    if (!open) return;
    const preferred = initialAgentId && agents.some((agent) => agent.id === initialAgentId) ? initialAgentId : null;
    setSelectedAgentId((current) => {
      if (current && agents.some((agent) => agent.id === current)) return current;
      return preferred ?? agents[0]?.id ?? null;
    });
    setTab("fund");
    setFundAmount("");
    setWithdrawAmount("");
    setWithdrawDestination("");
  }, [agents, initialAgentId, open]);

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) ?? null,
    [agents, selectedAgentId]
  );
  const selectedAgentBattleCount =
    Number(selectedAgent?.wins ?? 0) + Number(selectedAgent?.losses ?? 0) + Number(selectedAgent?.draws ?? 0);
  const selectedAgentWinRate = selectedAgentBattleCount
    ? Math.round((Number(selectedAgent?.wins ?? 0) / selectedAgentBattleCount) * 100)
    : 0;

  const walletQ = useQuery({
    queryKey: ["aiArenaGateway", "walletManager", "wallet", selectedAgentId],
    queryFn: () => aiArenaGatewayApi.getAgentWalletBalance(selectedAgentId!),
    enabled: open && !!selectedAgentId,
    retry: false,
  });

  const transactionsQ = useQuery({
    queryKey: ["aiArenaGateway", "walletManager", "transactions", selectedAgentId],
    queryFn: () => aiArenaGatewayApi.getAgentWalletTransactions(selectedAgentId!, 1, 8),
    enabled: open && !!selectedAgentId,
    retry: false,
  });

  const invalidateAgentWalletQueries = async (agentId: string) => {
    await queryClient.invalidateQueries({
      predicate: (query) =>
        Array.isArray(query.queryKey) &&
        query.queryKey[0] === "aiArenaGateway" &&
        query.queryKey.some((segment) => segment === agentId),
    });
  };

  const copyText = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy");
    }
  };

  const fundMut = useMutation({
    mutationFn: async () => {
      if (!selectedAgentId) throw new Error("Choose an AI agent first.");
      const amount = Number(fundAmount.trim());
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid ARENA amount.");
      return aiArenaGatewayApi.depositToAgentWallet({
        agentId: selectedAgentId,
        amount,
        currency: "ARENA",
        txHash: `manual_deposit_${selectedAgentId}_${Date.now()}`,
      });
    },
    onSuccess: async () => {
      const currentAgentId = selectedAgentId;
      if (!currentAgentId) return;
      await invalidateAgentWalletQueries(currentAgentId);
      await Promise.resolve(onWalletUpdated?.(currentAgentId));
      setFundAmount("");
      toast.success("Agent wallet deposit recorded.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not record the deposit.");
    },
  });

  const withdrawMut = useMutation({
    mutationFn: async () => {
      if (!selectedAgentId) throw new Error("Choose an AI agent first.");
      const amount = Number(withdrawAmount.trim());
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid ARENA amount.");
      const destination = withdrawDestination.trim();
      if (!destination) throw new Error("Enter a Solana destination address.");
      return aiArenaGatewayApi.requestWithdrawal({
        agentId: selectedAgentId,
        amount,
        destination,
      });
    },
    onSuccess: async (response) => {
      const currentAgentId = selectedAgentId;
      if (!currentAgentId) return;
      await invalidateAgentWalletQueries(currentAgentId);
      await Promise.resolve(onWalletUpdated?.(currentAgentId));
      setWithdrawAmount("");
      setWithdrawDestination("");
      const withdrawalId = response?.result?.withdrawalId;
      toast.success(withdrawalId ? `Withdrawal queued (${withdrawalId.slice(0, 8)}…)` : "Withdrawal queued");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not queue the withdrawal.");
    },
  });

  const wallet = walletQ.data?.wallet ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ArenaDialogContent size="xl" className="max-w-[1180px]">
        <ArenaDialogHeader>
          <ArenaDialogTitle className="font-display text-left text-xl sm:text-2xl">Agent Wallet</ArenaDialogTitle>
          <ArenaDialogDescription className="text-left text-xs sm:text-sm">
            Manage balances, fund an agent wallet, and queue withdrawals in the same arena theme as the rest of the app.
          </ArenaDialogDescription>
        </ArenaDialogHeader>

        <ArenaDialogBody className="space-y-4">
          {!agentsLoading && agents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/12 bg-[#02070d]/90 px-5 py-10 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-[#03070d]/90 text-neon-cyan">
                <WalletCards className="h-5 w-5" />
              </div>
              <p className="mt-4 font-display text-lg text-foreground">No agent wallet yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Create an AI agent first to unlock its custodial wallet, balance tracking, deposits, and withdrawals.
              </p>
              {onCreateAgent ? (
                <Button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onCreateAgent();
                  }}
                  className="mt-5 rounded-xl font-display text-xs font-bold tracking-wider"
                >
                  Create AI Agent
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <section className="rounded-2xl border border-white/10 bg-[#03070d]/95 p-4 sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-neon-cyan">Selected Agent</p>
                    <p className="mt-1 text-xs text-muted-foreground">Funds stay isolated to the fighter chosen here.</p>
                  </div>
                  <div className="w-full xl:max-w-[360px]">
                    <label
                      htmlFor="wallet-agent-select"
                      className="mb-2 block text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground"
                    >
                      Choose fighter
                    </label>
                    <Select value={selectedAgentId ?? undefined} onValueChange={(value) => setSelectedAgentId(value || null)}>
                      <SelectTrigger
                        id="wallet-agent-select"
                        className="h-11 rounded-xl border-white/10 bg-background/70 text-left text-sm text-foreground focus:border-neon-cyan/40 focus:ring-neon-cyan/20 focus:ring-offset-0"
                      >
                        <SelectValue placeholder="Choose an AI agent" />
                      </SelectTrigger>
                      <SelectContent className="z-[120] border-white/10 bg-[#060b13] text-foreground">
                        {agents.map((agent) => (
                          <SelectItem
                            key={agent.id}
                            value={agent.id}
                            className="text-sm focus:bg-white/10 focus:text-foreground"
                          >
                            {formatAgentSelectLabel(agent)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedAgent ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-[#05070d]/95 p-4">
                    <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] xl:grid-cols-[auto_minmax(0,1fr)_184px]">
                      <ArenaAgentThumbnail
                        agent={selectedAgent}
                        size="md"
                        className="mx-auto h-24 w-24 rounded-[28px] border border-white/10 sm:mx-0"
                      />

                      <div className="min-w-0 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="truncate text-lg font-bold text-foreground">{selectedAgent.name}</h3>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                            {selectedAgent.archetype}
                          </span>
                          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-200">
                            Agent scoped
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full border border-white/10 bg-[#02070d]/90 px-3 py-1.5">
                            Clan <span className="ml-1 text-foreground">{selectedAgent.clan}</span>
                          </span>
                          <span className="rounded-full border border-white/10 bg-[#02070d]/90 px-3 py-1.5">
                            Stage <span className="ml-1 text-foreground">{selectedAgent.evolutionStage}</span>
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <WalletMetric label="ELO" accentClassName="text-neon-cyan">
                            <div className="font-display text-xl font-black tabular-nums text-foreground">
                              {Number(selectedAgent.eloRating ?? 0).toLocaleString()}
                            </div>
                          </WalletMetric>
                          <WalletMetric label="Win Rate" accentClassName="text-neon-purple">
                            <div className="font-display text-xl font-black tabular-nums text-foreground">
                              {selectedAgentWinRate}%
                            </div>
                          </WalletMetric>
                          <WalletMetric label="Battles" accentClassName="text-emerald-300">
                            <div className="font-display text-xl font-black tabular-nums text-foreground">
                              {selectedAgentBattleCount.toLocaleString()}
                            </div>
                          </WalletMetric>
                        </div>
                      </div>

                      <div className="min-w-0 rounded-2xl border border-white/10 bg-[#02070d]/90 px-3 py-3 sm:col-span-2 xl:col-span-1">
                        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Agent ID</div>
                        <div className="mt-2 break-words font-mono text-sm text-foreground">{shortHash(selectedAgent.id)}</div>
                        <div className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                          Used for wallet deposits, withdrawal queueing, and balance sync.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#02070d]/90 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-neon-purple">Wallet Actions</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {tab === "fund"
                        ? "Record a confirmed top-up for this agent."
                        : "Queue a withdrawal to a valid Solana address."}
                    </p>
                  </div>
                  <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-background/75">
                    {tab === "fund" ? (
                      <ArrowDownToLine className="h-4 w-4 text-neon-cyan" />
                    ) : (
                      <ArrowUpToLine className="h-4 w-4 text-orange-200" />
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-[#02070d]/90 p-1">
                  {(["fund", "withdraw"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTab(mode)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        tab === mode
                          ? mode === "fund"
                            ? "border border-neon-cyan/35 bg-neon-cyan/15 text-neon-cyan"
                            : "border border-orange-500/35 bg-orange-500/15 text-orange-200"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {mode === "fund" ? "Fund wallet" : "Withdraw"}
                    </button>
                  ))}
                </div>

                {tab === "fund" ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-neon-cyan/15 bg-neon-cyan/5 px-4 py-3 text-sm text-muted-foreground">
                      Credit this agent wallet directly with an ARENA amount.
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="agent-wallet-fund-amount" className="text-xs font-medium text-muted-foreground">
                        Amount (ARENA)
                      </label>
                      <input
                        id="agent-wallet-fund-amount"
                        type="number"
                        min={0}
                        step="0.01"
                        inputMode="decimal"
                        value={fundAmount}
                        onChange={(event) => setFundAmount(event.target.value)}
                        placeholder="e.g. 100"
                        disabled={fundMut.isPending}
                        className="h-11 w-full rounded-xl border border-input bg-background/70 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-neon-cyan/40 disabled:opacity-50"
                      />
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {[10, 50, 200, 500].map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            disabled={fundMut.isPending}
                            onClick={() => setFundAmount(String(amount))}
                            className="rounded-lg border border-white/10 bg-background/70 px-2 py-1.5 text-[11px] font-semibold text-muted-foreground transition hover:border-neon-cyan/30 hover:text-neon-cyan disabled:opacity-50"
                          >
                            {amount}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fundMut.mutate()}
                      disabled={fundMut.isPending || !selectedAgentId || !fundAmount.trim()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neon-cyan/40 bg-neon-cyan/12 px-4 py-3 text-sm font-semibold text-neon-cyan transition hover:bg-neon-cyan/20 disabled:opacity-50"
                    >
                      {fundMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
                      Record deposit
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-orange-500/15 bg-orange-500/5 px-4 py-3 text-sm text-muted-foreground">
                      Withdrawals are queued from the custodial wallet. Double-check the destination first.
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="agent-wallet-withdraw-amount" className="text-xs font-medium text-muted-foreground">
                        Amount (ARENA)
                      </label>
                      <input
                        id="agent-wallet-withdraw-amount"
                        type="number"
                        min={0}
                        step="0.01"
                        inputMode="decimal"
                        value={withdrawAmount}
                        onChange={(event) => setWithdrawAmount(event.target.value)}
                        placeholder="e.g. 50"
                        disabled={withdrawMut.isPending}
                        className="h-11 w-full rounded-xl border border-input bg-background/70 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-orange-500/30 disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="agent-wallet-withdraw-destination"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Solana destination
                      </label>
                      <input
                        id="agent-wallet-withdraw-destination"
                        value={withdrawDestination}
                        onChange={(event) => setWithdrawDestination(event.target.value)}
                        placeholder="Base58 address"
                        disabled={withdrawMut.isPending}
                        className="h-11 w-full rounded-xl border border-input bg-background/70 px-3 font-mono text-xs text-foreground placeholder:text-muted-foreground outline-none transition focus:border-orange-500/30 disabled:opacity-50"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => withdrawMut.mutate()}
                      disabled={withdrawMut.isPending || !selectedAgentId || !withdrawAmount.trim() || !withdrawDestination.trim()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/12 px-4 py-3 text-sm font-semibold text-orange-200 transition hover:bg-orange-500/20 disabled:opacity-50"
                    >
                      {withdrawMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpToLine className="h-4 w-4" />}
                      Queue withdrawal
                    </button>
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#03070d]/95 p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-neon-cyan">Wallet Overview</p>
                    <p className="mt-1 text-xs text-muted-foreground">Balance and custody details for the selected fighter.</p>
                  </div>
                  {walletQ.isFetching ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
                </div>

                {walletQ.isLoading ? (
                  <div className="space-y-3">
                    <div className="h-16 animate-pulse rounded-xl border border-white/8 bg-white/5" />
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="h-16 animate-pulse rounded-xl border border-white/8 bg-white/5" />
                      <div className="h-16 animate-pulse rounded-xl border border-white/8 bg-white/5" />
                      <div className="h-16 animate-pulse rounded-xl border border-white/8 bg-white/5" />
                    </div>
                  </div>
                ) : walletQ.isError ? (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-4 text-sm text-amber-100/90">
                    Wallet details are not available right now for this agent.
                  </div>
                ) : wallet ? (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-white/10 bg-[#05070d]/95 p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">Live Balance</div>
                          <div className="mt-2">
                            <ArenaTokenAmount amount={Number(wallet.balanceArena ?? 0)} size="md" />
                          </div>
                        </div>
                        <div
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${
                            wallet.isFrozen
                              ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
                              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                          }`}
                        >
                          <ShieldCheck className="h-3 w-3" />
                          {wallet.isFrozen ? "Frozen" : "Active"}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <WalletMetric label="ARENA" accentClassName="text-neon-cyan">
                        <div className="font-display text-lg font-black tabular-nums text-foreground">
                          {Number(wallet.balanceArena ?? 0).toLocaleString()}
                        </div>
                      </WalletMetric>
                      <WalletMetric label="SOL" accentClassName="text-neon-purple">
                        <div className="font-display text-lg font-black tabular-nums text-foreground">
                          {Number(wallet.balanceSol ?? 0).toLocaleString()}
                        </div>
                      </WalletMetric>
                      <WalletMetric label="State" accentClassName="text-emerald-300">
                        <div className="font-display text-sm font-bold text-foreground">{wallet.isFrozen ? "Paused" : "Ready"}</div>
                      </WalletMetric>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-[#05070d]/95 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">Solana Address</div>
                        {isRealSolanaAddress(wallet.solanaAddress) ? (
                          <a
                            href={solanaExplorerUrl(wallet.solanaAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-neon-cyan/20 bg-neon-cyan/8 px-2 py-0.5 text-[10px] font-mono text-neon-cyan transition hover:bg-neon-cyan/15"
                          >
                            <ExternalLink className="h-2.5 w-2.5" />
                            Devnet Explorer
                          </a>
                        ) : null}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="min-w-0 flex-1 break-all font-mono text-xs text-foreground">{wallet.solanaAddress}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 rounded-lg border-white/10 bg-background/75 px-2 text-[10px]"
                          onClick={() => void copyText("Solana address", wallet.solanaAddress)}
                        >
                          <Copy className="h-3 w-3" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#03070d]/95 p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-neon-purple">Recent Wallet Activity</p>
                    <p className="mt-1 text-xs text-muted-foreground">Deposits, withdrawals, and other ledger movement for this agent.</p>
                  </div>
                  {transactionsQ.isFetching ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
                </div>

                {transactionsQ.isLoading ? (
                  <div className="space-y-3">
                    <div className="h-16 animate-pulse rounded-xl border border-white/8 bg-white/5" />
                    <div className="h-16 animate-pulse rounded-xl border border-white/8 bg-white/5" />
                    <div className="h-16 animate-pulse rounded-xl border border-white/8 bg-white/5" />
                  </div>
                ) : transactionsQ.data?.transactions?.length ? (
                  <div className="space-y-2.5">
                    {transactionsQ.data.transactions.map((tx) => (
                      <WalletTransactionRow key={tx.id} tx={tx} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-[#05070d]/95 px-4 py-5 text-sm text-muted-foreground">
                    No wallet transactions have been recorded for this agent yet.
                  </div>
                )}
              </section>
            </div>
          )}
        </ArenaDialogBody>

        <ArenaDialogFooter>
          <Button type="button" variant="outline" className="border-white/10 bg-background/50" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </ArenaDialogFooter>
      </ArenaDialogContent>
    </Dialog>
  );
}
