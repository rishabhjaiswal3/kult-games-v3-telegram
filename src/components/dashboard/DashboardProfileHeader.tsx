import { Copy, Wallet } from "lucide-react";
import { toast } from "sonner";
import type { FullPlayerProfile } from "@/types/api";
import { initialsFromName, shortWallet } from "@/components/dashboard/profileAvatars";

type DashboardProfileHeaderProps = {
  profile: FullPlayerProfile | undefined;
  isLoading: boolean;
  walletAddress: string | null;
};

export function DashboardProfileHeader({ profile, isLoading, walletAddress }: DashboardProfileHeaderProps) {
  const displayName = profile?.player.name?.trim() || "Arena Pilot";

  const copyWallet = () => {
    if (!walletAddress) return;
    void navigator.clipboard.writeText(walletAddress);
    toast.success("Wallet copied");
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#04080f]/60 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 hover:border-[#9a35ff]/30 hover:shadow-[0_8px_40px_rgba(154,53,255,0.15)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(154,53,255,0.15),transparent_40%),radial-gradient(circle_at_80%_100%,rgba(0,137,255,0.1),transparent_40%)]" />
      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[#9a35ff]/50 bg-[#1a1030] font-tech text-xl font-bold text-[#c78aff] shadow-[0_0_15px_rgba(154,53,255,0.4)] transition-all duration-300 group-hover:shadow-[0_0_25px_rgba(154,53,255,0.6)]"
            aria-hidden
          >
            {initialsFromName(displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-tech text-[11px] italic text-[#a84cff]">
              {isLoading ? "Loading profile…" : "Welcome back,"}
            </div>
            <h1 className="mt-0.5 max-w-full break-words font-tech text-2xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 [overflow-wrap:anywhere] sm:text-3xl drop-shadow-sm">
              {displayName}
            </h1>
            <p className="mt-1 max-w-full text-sm text-white/55">Your command center — agents, battles, and arena progress.</p>
            {walletAddress ? (
              <button
                type="button"
                onClick={copyWallet}
                className="mt-2 inline-flex max-w-full items-center gap-1.5 font-tech text-[10px] uppercase tracking-wider text-white/45 transition hover:text-[#c78aff]"
              >
                <Wallet className="h-3.5 w-3.5" />
                <span className="truncate">{shortWallet(walletAddress)}</span>
                <Copy className="h-3 w-3 opacity-60" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-xl">
          {[
            { label: "Level", value: profile?.level ?? "—" },
            { label: "Rank", value: profile?.rank != null ? `#${profile.rank}` : "—" },
            { label: "Total score", value: profile ? profile.totalScore.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—" },
            { label: "Games played", value: profile?.totalGamesPlayed ?? "—" },
          ].map((stat) => (
            <div key={stat.label} className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-[#0a0f1b]/50 px-3 py-2.5 text-center backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5 hover:border-[#c78aff]/30 hover:bg-[#111626]/70 hover:shadow-[0_4px_20px_rgba(154,53,255,0.1)]">
              <div className="font-tech text-[9px] uppercase tracking-wider text-white/50">{stat.label}</div>
              <div className="mt-1 text-lg font-black text-white tabular-nums drop-shadow-sm">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
