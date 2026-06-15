import type { PlayerGameScoreEntry } from "@/types/api";

type DashboardGameScoresPanelProps = {
  rows: PlayerGameScoreEntry[];
};

export function DashboardGameScoresPanel({ rows }: DashboardGameScoresPanelProps) {
  if (rows.length === 0) return null;

  return (
    <section className="arena-panel overflow-hidden border-white/8 bg-[#04080f]/95">
      <div className="border-b border-white/8 px-4 py-3">
        <h2 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">Scores by game</h2>
        <p className="mt-0.5 text-[10px] text-white/45">Weighted leaderboard contributions</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-xs">
          <thead>
            <tr className="font-tech text-[9px] uppercase tracking-wider text-white/40">
              <th className="px-4 py-2.5">Game</th>
              <th className="px-4 py-2.5">Score</th>
              <th className="px-4 py-2.5">Weight</th>
              <th className="px-4 py-2.5">Weighted</th>
              <th className="px-4 py-2.5">Rank</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.identification} className="border-t border-white/6 text-white/75">
                <td className="px-4 py-3 font-medium text-white/90">{row.identification}</td>
                <td className="px-4 py-3 tabular-nums">{row.score.toLocaleString()}</td>
                <td className="px-4 py-3 tabular-nums">{row.weight}</td>
                <td className="px-4 py-3 tabular-nums text-[#c78aff]">
                  {row.weightedScore.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 tabular-nums">{row.rank != null ? `#${row.rank}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
