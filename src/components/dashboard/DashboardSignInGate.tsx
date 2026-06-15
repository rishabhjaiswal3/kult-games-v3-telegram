import { Link } from "react-router-dom";
import { UserRound } from "lucide-react";
import { ArenaPageLayout } from "@/components/arena/ArenaPageLayout";
import { useAuth } from "@/contexts/AuthContext";

type DashboardSignInGateProps = {
  title?: string;
  description?: string;
};

export function DashboardSignInGate({
  title = "Dashboard",
  description = "Sign in with your wallet to view your profile, agents, arena stats, and progress. Privy handles login and session restore automatically.",
}: DashboardSignInGateProps) {
  const { login } = useAuth();

  return (
    <ArenaPageLayout>
      <div className="arena-panel flex flex-col items-center justify-center border-white/8 bg-[#04080f]/95 px-8 py-16 text-center">
        <div className="mb-6 grid h-16 w-16 place-items-center rounded-full border border-[#9a35ff]/30 bg-[#9a35ff]/15 text-[#c78aff]">
          <UserRound className="h-8 w-8" />
        </div>
        <h1 className="font-tech text-2xl font-bold uppercase tracking-tight text-white">{title}</h1>
        <p className="mt-2 max-w-md text-sm text-white/55">{description}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={login}
            className="btn-primary rounded-md px-6 py-2.5 font-tech text-[10px] font-bold uppercase tracking-wider"
          >
            Connect wallet
          </button>
          <Link
            to="/"
            className="rounded-md border border-white/8 bg-[#0a0f1b]/60 px-6 py-2.5 font-tech text-[10px] font-bold uppercase tracking-wider text-white/55 hover:text-white"
          >
            Back home
          </Link>
        </div>
      </div>
    </ArenaPageLayout>
  );
}
