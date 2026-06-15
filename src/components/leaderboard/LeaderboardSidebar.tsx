import { ArrowUpRight, Gift, Hexagon, Swords, Trophy } from "lucide-react";
import rewardAvatar from "@/assets/reward-avatar.png";
import rewardCrate from "@/assets/reward-crate.png";
import rewardWeapon from "@/assets/reward-weapon.png";
import { getRankFromElo } from "@/utils/rankSystem";

type LeaderboardSidebarProps = {
  userRank?: number;
  userPoints?: number;
  seasonProgress?: number;
  /** Raw ELO for deriving rank badge & league name. */
  userElo?: number;
};

export function LeaderboardSidebar({
  userRank,
  userPoints = 0,
  seasonProgress = 62,
  userElo,
}: LeaderboardSidebarProps) {
  const rankLabel = userRank != null ? `#${userRank}` : "UNRANKED";
  const leagueInfo = userElo != null ? getRankFromElo(userElo) : null;

  return (
    <aside className="space-y-4">
      <div className="arena-panel relative overflow-hidden p-5">
        <div className="flex items-center justify-between">
          <span className="font-tech text-sm font-bold tracking-wide">SEASON 1</span>
          <span className="animate-pulse rounded border border-[#9a35ff]/40 bg-[#9a35ff]/20 px-2 py-0.5 font-tech text-[9px] font-bold uppercase text-[#d7a8ff]">
            ● LIVE
          </span>
        </div>
        <p className="mt-1 text-[11px] text-white/45">Season ends in: 12D 14H 25M</p>

        <div className="mt-5 flex items-center justify-between">
          <div>
            <div className="font-tech text-[10px] uppercase tracking-wider text-white/45">YOUR SEASON RANK</div>
            <div className="mt-1 font-tech text-lg font-bold tracking-wide text-[#bf7fff]">{rankLabel}</div>
            <div className="mt-1 text-[11px] text-white/60">
              <strong className="text-white">{userPoints.toLocaleString()}</strong> PTS
            </div>
          </div>
          {leagueInfo ? (
            <div className="flex flex-col items-center gap-1">
              <img
                src={leagueInfo.image}
                alt={leagueInfo.name}
                title={leagueInfo.name}
                className="h-[72px] w-[72px] object-contain drop-shadow-[0_0_12px_rgba(154,53,255,0.25)]"
              />
              <span
                className="font-tech text-[8px] uppercase tracking-widest"
                style={{ color: leagueInfo.color }}
              >
                {leagueInfo.shortName}
              </span>
            </div>
          ) : (
            <div className="h-[76px] w-[80px]" />
          )}
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full border border-white/8 bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#6e22ff] to-[#bd3aff] shadow-[0_0_8px_#9a35ff]"
            style={{ width: `${seasonProgress}%` }}
          />
        </div>
      </div>

      <div className="arena-panel space-y-4 p-5">
        <h3 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">
          SEASON TOP REWARDS
        </h3>

        <div className="space-y-3">
          {[
            { rank: "1", title: "Champion Avatar", sub: "Top 1", img: rewardAvatar, color: "amber" },
            { rank: "2", title: "Legendary Crate", sub: "Top 2 - 3", img: rewardCrate, color: "gray" },
            { rank: "3", title: "Epic Skin", sub: "Top 4 - 10", img: rewardWeapon, color: "amber" },
          ].map((r) => (
            <div
              key={r.rank}
              className="flex items-center justify-between rounded border border-white/6 bg-white/[0.015] p-2.5"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full border font-tech text-[10px] font-black ${
                    r.color === "amber"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                      : "border-gray-400/30 bg-gray-400/10 text-gray-400"
                  }`}
                >
                  {r.rank}
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white">{r.title}</div>
                  <div className="text-[10px] text-white/42">{r.sub}</div>
                </div>
              </div>
              <div className="h-10 w-10 overflow-hidden rounded border border-white/8 bg-white/5">
                <img src={r.img} alt="" className="h-full w-full object-cover" />
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between rounded border border-white/6 bg-white/[0.015] p-2.5">
            <div className="flex items-center gap-3">
              <span className="px-1 font-tech text-[10px] text-white/45">4 - 100</span>
              <div className="text-[11px] font-bold text-[#00f080]">2,500 $ARENA</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded border border-[#ffc000]/25 bg-[#ffc000]/10 text-[#ffc000]">
              <Hexagon className="h-5 w-5 fill-[#ffc000]/10" />
            </div>
          </div>
        </div>

        <button
          type="button"
          className="flex h-9 w-full items-center justify-center gap-2 rounded border border-white/10 bg-white/[0.02] font-tech text-[9px] font-semibold uppercase tracking-wider text-white transition hover:bg-white/[0.05]"
        >
          VIEW ALL REWARDS <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="arena-panel space-y-4 p-5">
        <h3 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">
          LEADERBOARD INFO
        </h3>
        <ul className="space-y-3.5">
          <li className="flex gap-3 text-[11px] leading-relaxed text-white/66">
            <Trophy className="h-4 w-4 shrink-0 text-white/45" />
            <span>Climb the ranks by winning battles and earning points.</span>
          </li>
          <li className="flex gap-3 text-[11px] leading-relaxed text-white/66">
            <Swords className="h-4 w-4 shrink-0 text-white/45" />
            <span>Different game modes have separate leaderboards.</span>
          </li>
          <li className="flex gap-3 text-[11px] leading-relaxed text-white/66">
            <Gift className="h-4 w-4 shrink-0 text-white/45" />
            <span>Rewards are distributed at the end of each season.</span>
          </li>
        </ul>
      </div>
    </aside>
  );
}
