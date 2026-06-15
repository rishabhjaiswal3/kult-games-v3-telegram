import { ChevronLeft, ChevronRight, Hexagon } from "lucide-react";
import { ClanIcon } from "./ClanIcon";
import type { DisplayPlayer } from "./leaderboardUtils";
import { Button } from "@/components/ui/button";
import AutoPlayVideo from "@/components/AutoPlayVideo";
import leaderboardBackgroundVideo from "@/assets/leaderboard_background.mp4";
import { getRankFromElo } from "@/utils/rankSystem";

function AgentThumb({ src, className }: { src: string; className: string }) {
  if (src.endsWith(".mp4")) {
    return <video src={src} autoPlay loop muted playsInline className={className} />;
  }
  return <img src={src} alt="" className={className} />;
}

type LeaderboardTablePanelProps = {
  rows: DisplayPlayer[];
  userRow: DisplayPlayer | null;
  page: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
};

function TableRow({ player, highlighted }: { player: DisplayPlayer; highlighted?: boolean }) {
  return (
    <tr
      className={
        highlighted
          ? "border border-[#9a35ff]/35 bg-[#9a35ff]/8 shadow-[0_0_15px_rgba(154,53,255,0.08)]"
          : "transition hover:bg-white/[0.02]"
      }
    >
      <td className={`px-5 py-4 font-tech text-[11px] ${highlighted ? "text-[#d6acff]" : ""}`}>
        {player.rank}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-8 w-8 overflow-hidden rounded border bg-white/5 ${
              highlighted ? "border-[#9a35ff]/40 bg-[#9a35ff]/25 shadow-[0_0_8px_rgba(154,53,255,0.2)]" : "border-white/10"
            }`}
          >
            <AgentThumb src={player.avatar} className="h-full w-full object-cover" />
          </div>
          <span className={`font-semibold tracking-wide ${highlighted ? "font-bold text-white" : ""}`}>
            {player.name}
          </span>
          {player.showHexagon ? (
            <Hexagon className="h-3 w-3 fill-[#9a35ff] text-[#9a35ff]" />
          ) : null}
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5 text-white/70">
          <ClanIcon type={player.clanIconType} className="h-3.5 w-3.5" />
          <span className={highlighted ? "font-semibold text-white/90" : ""}>{player.clanName}</span>
        </div>
      </td>
      <td className="px-5 py-4 text-center">{player.wins ?? "—"}</td>
      <td className={`px-5 py-4 text-center ${highlighted ? "text-[#d6acff]" : ""}`}>
        {player.winRate ?? "—"}
      </td>
      <td className="px-5 py-4 text-center">{player.battles ?? "—"}</td>
      <td className={`px-5 py-4 text-right font-semibold ${highlighted ? "font-bold text-[#d6acff]" : ""}`}>
        {player.points} PTS
      </td>
      <td className="px-3 py-4 text-center">
        {player.eloRating != null ? (
          <img
            src={getRankFromElo(player.eloRating).image}
            alt={getRankFromElo(player.eloRating).name}
            title={getRankFromElo(player.eloRating).name}
            className="mx-auto h-7 w-7 object-contain"
          />
        ) : null}
      </td>
    </tr>
  );
}

export function LeaderboardTablePanel({
  rows,
  userRow,
  page,
  totalPages,
  isLoading,
  onPageChange,
}: LeaderboardTablePanelProps) {
  const showUserGap = userRow && !rows.some((r) => r.wallet === userRow.wallet);

  return (
    <div className="arena-panel relative overflow-hidden border border-white/8">
      <AutoPlayVideo
        src={leaderboardBackgroundVideo}
        loop
        className="absolute inset-0 h-full w-full object-cover pointer-events-none opacity-25"
      />
      <div className="absolute inset-0 bg-[#04080f]/15 pointer-events-none" />

      <div className="relative z-10 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-white/8 bg-white/[0.01] font-tech text-[10px] uppercase tracking-wider text-white/45">
              <th className="px-5 py-4 font-semibold">Rank</th>
              <th className="px-5 py-4 font-semibold">Player</th>
              <th className="px-5 py-4 font-semibold">Clan</th>
              <th className="px-5 py-4 text-center font-semibold">Wins</th>
              <th className="px-5 py-4 text-center font-semibold">Win Rate</th>
              <th className="px-5 py-4 text-center font-semibold">Battles</th>
              <th className="px-5 py-4 text-right font-semibold">Points</th>
              <th className="w-12 px-3 py-4 text-center font-semibold">League</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6 font-medium text-white/86">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center font-tech text-white/45">
                  LOADING RANKINGS…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center font-tech text-white/45">
                  NO RANKINGS YET
                </td>
              </tr>
            ) : (
              rows.map((player) => <TableRow key={`${player.rank}-${player.wallet}`} player={player} />)
            )}

            {showUserGap && userRow ? (
              <>
                <tr className="bg-white/[0.005]">
                  <td colSpan={8} className="py-2.5 text-center text-white/20 select-none">
                    •••
                  </td>
                </tr>
                <TableRow player={userRow} highlighted />
              </>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="relative z-10 flex items-center justify-center gap-2 border-t border-white/8 px-4 py-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="h-8 rounded-md border-white/15 bg-transparent px-2 text-white hover:bg-white/5"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[4.5rem] text-center font-tech text-xs text-white/55">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages || isLoading}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="h-8 rounded-md border-white/15 bg-transparent px-2 text-white hover:bg-white/5"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
