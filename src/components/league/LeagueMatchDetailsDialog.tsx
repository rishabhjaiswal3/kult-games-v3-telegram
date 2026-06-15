import { Coins, MapPin, Timer, Trophy, Users } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import {
  ArenaDialogBody,
  ArenaDialogContent,
  ArenaDialogDescription,
  ArenaDialogFooter,
  ArenaDialogHeader,
  ArenaDialogTitle,
} from "@/components/ui/arena-dialog";
import { Button } from "@/components/ui/button";
import { FlagHex } from "./FlagHex";
import { FEATURED_MATCH, FEATURED_MATCH_QUESTIONS } from "./leagueData";
import { LeagueFightScene, LeagueQuestionCard } from "./leagueFightUi";

type LeagueMatchDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  countdownLabel: string;
};

export function LeagueMatchDetailsDialog({
  open,
  onOpenChange,
  countdownLabel,
}: LeagueMatchDetailsDialogProps) {
  const match = FEATURED_MATCH;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ArenaDialogContent size="xl" className="z-[200] max-w-4xl">
        <ArenaDialogHeader>
          <ArenaDialogTitle className="font-tech text-lg uppercase tracking-wide text-white sm:text-xl">
            {match.home.label} vs {match.away.label}
          </ArenaDialogTitle>
          <ArenaDialogDescription className="text-white/50">
            World Cup 2026 · {match.stage} · Match {match.matchNumber}
          </ArenaDialogDescription>
        </ArenaDialogHeader>

        <ArenaDialogBody className="space-y-5">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <FlagHex code={match.home.code} size="md" />
              <span className="font-tech text-xs font-bold uppercase text-white/80">{match.home.label}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5">
              <Timer className="h-3.5 w-3.5 text-[#a855f7]" />
              <span className="font-mono text-sm font-bold tabular-nums text-white">{countdownLabel}</span>
            </div>
            <div className="flex items-center gap-3">
              <FlagHex code={match.away.code} size="md" />
              <span className="font-tech text-xs font-bold uppercase text-white/80">{match.away.label}</span>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2.5">
              <div className="flex items-center gap-2 text-white/40">
                <MapPin className="h-3.5 w-3.5" />
                <span className="font-tech text-[9px] uppercase tracking-wider">Venue</span>
              </div>
              <p className="mt-1 font-tech text-[11px] text-white/80">{match.venue}</p>
            </div>
            <div className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2.5">
              <div className="flex items-center gap-2 text-white/40">
                <Coins className="h-3.5 w-3.5" />
                <span className="font-tech text-[9px] uppercase tracking-wider">Prediction Pool</span>
              </div>
              <p className="mt-1 font-tech text-sm font-bold text-[#00f080]">
                {match.predictionPool.toLocaleString()} KP
              </p>
            </div>
            <div className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2.5">
              <div className="flex items-center gap-2 text-white/40">
                <Users className="h-3.5 w-3.5" />
                <span className="font-tech text-[9px] uppercase tracking-wider">Agent Bets</span>
              </div>
              <p className="mt-1 font-tech text-sm font-bold text-white">
                {match.totalAgentBets.toLocaleString()}
              </p>
            </div>
          </div>

          <LeagueFightScene
            leftAgent={match.homeAgent}
            rightAgent={match.awayAgent}
            subtitle="Featured duel"
          />

          <div>
            <h3 className="mb-3 font-tech text-xs font-bold uppercase tracking-wider text-white">
              Prediction Questions
            </h3>
            <div className="space-y-3">
              {FEATURED_MATCH_QUESTIONS.map((q) => (
                <LeagueQuestionCard key={q.id} question={q} />
              ))}
            </div>
          </div>
        </ArenaDialogBody>

        <ArenaDialogFooter>
          <Button
            type="button"
            variant="outline"
            className="border-white/15 bg-transparent font-tech text-xs uppercase tracking-wider"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            type="button"
            className="gap-2 bg-[#a855f7] font-tech text-xs uppercase tracking-wider hover:bg-[#9333ea]"
          >
            <Trophy className="h-4 w-4" />
            Place Your Picks
          </Button>
        </ArenaDialogFooter>
      </ArenaDialogContent>
    </Dialog>
  );
}
