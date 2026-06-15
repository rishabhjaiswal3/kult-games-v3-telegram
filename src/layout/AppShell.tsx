import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "@/layout/AppSidebar";
import { AppTopbar } from "@/layout/AppTopbar";
import { MobileBottomNav } from "@/layout/MobileBottomNav";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { navLabelForPath } from "@/layout/navConfig";
import { usesArenaLayout } from "@/layout/arenaRoutes";
import { cn } from "@/lib/utils";

export type AppShellOutletContext = {
  isGameChromeVisible: boolean;
  toggleGameChrome: () => void;
};

export function AppShell() {
  const { pathname } = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isGameChromeVisible, setIsGameChromeVisible] = useState(true);
  const activeLabel = navLabelForPath(pathname);
  const isMoments = pathname === "/moments";
  const isAIArenaLanding = pathname === "/ai-arena";
  const isArenaLayout = usesArenaLayout(pathname);
  const isHome = pathname === "/";
  const isLeaderboard = pathname === "/leaderboard";
  const isAutonomous = pathname === "/autonomous";
  const isAchievements = pathname === "/achievements";
  const isGamePlay = /^\/game\/[^/]+\/play$/.test(pathname);

  useEffect(() => {
    if (!isGamePlay) {
      setIsGameChromeVisible(true);
    }
  }, [isGamePlay]);

  const showDashboardTopbar = isHome || isAIArenaLanding || isLeaderboard || isAutonomous || isAchievements || isMoments;
  const hideAppTopbar = isArenaLayout || showDashboardTopbar;
  const isFullBleedRoute = isAIArenaLanding || isArenaLayout || showDashboardTopbar || isGamePlay;
  const showSidebar = !isGamePlay || isGameChromeVisible;
  const showTopbar = !hideAppTopbar && (!isGamePlay || isGameChromeVisible);
  const shellOutletContext = useMemo<AppShellOutletContext>(
    () => ({
      isGameChromeVisible,
      toggleGameChrome: () => setIsGameChromeVisible((current) => !current),
    }),
    [isGameChromeVisible]
  );

  return (
    <div className="arena-app-shell h-dvh min-h-0 overflow-hidden bg-[#03070d] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(139,37,255,0.18),transparent_28%),radial-gradient(circle_at_18%_90%,rgba(33,144,255,0.12),transparent_32%)]" />
      <div className="relative flex h-dvh min-h-0 overflow-hidden">
        {showSidebar ? (
          <AppSidebar activeLabel={activeLabel} isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />
        ) : null}
        <main
          className={cn(
            "flex h-full min-h-0 min-w-0 flex-1 flex-col transition-[margin] duration-300",
            showSidebar ? (isCollapsed ? "lg:ml-[72px]" : "lg:ml-[225px]") : "lg:ml-0"
          )}
        >
          {isFullBleedRoute ? (
            <div
              className={cn(
                "arena-scroll flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden",
                isGamePlay ? "pb-0" : "pb-24 sm:pb-0"
              )}
            >
              {showDashboardTopbar ? <DashboardTopbar /> : null}
              {showTopbar ? <AppTopbar /> : null}
              <Outlet context={shellOutletContext} />
            </div>
          ) : (
            <div className="arena-scroll mx-auto min-h-0 w-full max-w-full flex-1 flex-col overflow-y-auto overflow-x-hidden pb-24 sm:pb-0">
              {showDashboardTopbar ? <DashboardTopbar /> : null}
              {showTopbar ? <AppTopbar /> : null}
              <div className="px-4 py-5 sm:px-6 lg:px-8">
                <Outlet context={shellOutletContext} />
              </div>
            </div>
          )}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
