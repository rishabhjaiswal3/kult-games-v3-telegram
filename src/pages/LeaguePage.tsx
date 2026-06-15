import { LeagueFeaturedBanner } from "@/components/league/LeagueFeaturedBanner";
import { LeagueFightCarousel } from "@/components/league/LeagueFightCarousel";
import { LeagueMomentsTicker } from "@/components/league/LeagueMomentsTicker";
import { LeaguePageHeader } from "@/components/league/LeaguePageHeader";
import { LeagueQuestionsCarousel } from "@/components/league/LeagueQuestionsCarousel";
import { LeagueRecentPicks } from "@/components/league/LeagueRecentPicks";
import { LeagueRivalries } from "@/components/league/LeagueRivalries";
import { LeagueStatsSidebar } from "@/components/league/LeagueStatsSidebar";
import { LeagueTodayPredictions } from "@/components/league/LeagueTodayPredictions";
import { LeagueTopAgentsPanel } from "@/components/league/LeagueTopAgentsPanel";
import { LeagueUpcomingCarousel } from "@/components/league/LeagueUpcomingCarousel";
import { LeagueYourLineup } from "@/components/league/LeagueYourLineup";

const LeaguePage = () => {
  return (
    <div className="min-w-0 w-full max-w-full overflow-x-hidden px-3 py-3 sm:px-6 lg:px-8">
      <LeaguePageHeader />

      <div className="grid w-full min-w-0 grid-cols-1 items-start gap-2.5 lg:grid-cols-12 lg:gap-3">
        <div className="min-w-0 w-full lg:col-span-8 xl:col-span-9">
          <LeagueFeaturedBanner />
        </div>
        <div className="flex min-w-0 w-full flex-col gap-2.5 lg:col-span-4 xl:col-span-3">
          <LeagueStatsSidebar />
          <LeagueTopAgentsPanel />
        </div>

        <div className="min-w-0 w-full lg:col-span-12">
          <LeagueUpcomingCarousel />
        </div>

        <div className="min-w-0 w-full lg:col-span-12">
          <LeagueTodayPredictions />
        </div>

        <div className="min-w-0 w-full lg:col-span-4">
          <LeagueRecentPicks />
        </div>
        <div className="min-w-0 w-full lg:col-span-4">
          <LeagueRivalries />
        </div>
        <div className="min-w-0 w-full lg:col-span-4">
          <LeagueYourLineup />
        </div>

        <div className="min-w-0 w-full lg:col-span-12">
          <LeagueFightCarousel />
        </div>

        <div className="min-w-0 w-full lg:col-span-12">
          <LeagueQuestionsCarousel />
        </div>

        <div className="min-w-0 w-full lg:col-span-12">
          <LeagueMomentsTicker />
        </div>
      </div>

      <p className="mt-3 text-center font-tech text-[9px] uppercase tracking-widest text-white/30">
        Picks lock 15 minutes before kickoff · All times in UTC
      </p>
    </div>
  );
};

export default LeaguePage;
