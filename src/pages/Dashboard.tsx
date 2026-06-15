import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArenaPageLayout } from "@/components/arena/ArenaPageLayout";
import { AutonomousPanel } from "@/components/dashboard/AutonomousPanel";
import { BalancePanel } from "@/components/dashboard/BalancePanel";
import { BattleStrip } from "@/components/dashboard/BattleStrip";
import { DashboardAccountPanel } from "@/components/dashboard/DashboardAccountPanel";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { DashboardGameScoresPanel } from "@/components/dashboard/DashboardGameScoresPanel";
import { DashboardLiveAgentPanel } from "@/components/dashboard/DashboardLiveAgentPanel";
import { DashboardProfileHeader } from "@/components/dashboard/DashboardProfileHeader";
import { DashboardSignInGate } from "@/components/dashboard/DashboardSignInGate";
import { Quests } from "@/components/dashboard/Quests";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { TraitsPanel } from "@/components/dashboard/TraitsPanel";
import { playerApi } from "@/api/playerApi";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateAgent } from "@/contexts/CreateAgentContext";
import { useMyArenaAgents } from "@/hooks/useMyArenaAgents";

const Dashboard = () => {
  const { isAuthenticated, walletAddress } = useAuth();
  const { openCreateAgent } = useCreateAgent();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["player", "full-profile"],
    queryFn: () => playerApi.getFullProfile(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const myAgentsQ = useMyArenaAgents(1, 50);
  const agents = useMemo(() => myAgentsQ.data?.agents ?? [], [myAgentsQ.data?.agents]);

  useEffect(() => {
    if (!agents.length) {
      setSelectedAgentId(null);
      return;
    }

    setSelectedAgentId((current) => {
      if (current && agents.some((agent) => agent.id === current)) return current;
      return agents[0]?.id ?? null;
    });
  }, [agents]);

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) ?? agents[0] ?? null,
    [agents, selectedAgentId]
  );

  if (!isAuthenticated) {
    return <DashboardSignInGate />;
  }

  return (
    <ArenaPageLayout>
      <DashboardProfileHeader
        profile={profile}
        isLoading={profileLoading}
        walletAddress={walletAddress}
      />

      {profileError ? (
        <div className="arena-panel border-red-500/30 bg-red-950/20 px-6 py-8 text-center text-sm text-white/60">
          Could not load profile.{" "}
          <button type="button" className="text-[#c78aff] underline" onClick={() => refetchProfile()}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_376px]">
        <div className="min-w-0 space-y-4">
          <DashboardLiveAgentPanel
            agent={selectedAgent}
            agents={agents}
            selectedAgentId={selectedAgentId}
            onSelectAgent={setSelectedAgentId}
            isLoading={myAgentsQ.isLoading}
            onCreateAgent={openCreateAgent}
          />
          <TraitsPanel agent={selectedAgent} />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.07fr)_minmax(0,0.93fr)]">
            <RecentActivity agentId={selectedAgentId} />
            <Quests agent={selectedAgent} agentId={selectedAgentId} />
          </div>
          <QuickActions />
          {/* <BattleStrip /> */}
          {profile?.gameScoresList?.length ? (
            <DashboardGameScoresPanel rows={profile.gameScoresList} />
          ) : null}
        </div>

        <aside className="space-y-4 self-start xl:sticky xl:top-24">
          {profile ? <DashboardAccountPanel profile={profile} /> : null}
          <BalancePanel agent={selectedAgent} />
          <AutonomousPanel />
        </aside>
      </div>

      <DashboardFooter />
    </ArenaPageLayout>
  );
};

export default Dashboard;
