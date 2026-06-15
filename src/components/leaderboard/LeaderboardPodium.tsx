import { Hexagon, Trophy } from "lucide-react";
import { ClanIcon } from "./ClanIcon";
import type { DisplayPlayer } from "./leaderboardUtils";
import { getRankFromElo } from "@/utils/rankSystem";

function AgentAvatar({ src, alt, className }: { src: string; alt: string; className: string }) {
  if (src.endsWith(".mp4")) {
    return (
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className={className}
      />
    );
  }
  return <img src={src} alt={alt} className={className} />;
}

type PodiumSlot = "first" | "second" | "third";

function PodiumCard({
  player,
  slot,
}: {
  player: DisplayPlayer;
  slot: PodiumSlot;
}) {
  const styles =
    slot === "first"
      ? {
          height: "h-[260px]",
          border: "border-[#ffc000]/30 shadow-[0_0_20px_rgba(255,192,0,0.1),inset_0_1px_0_rgba(255,255,255,0.05)]",
          rankBg: "bg-[#1c190f] border-[#ffc000]/40 text-[#ffc000]",
          avatarBorder: "border-2 border-[#ffc000] shadow-[0_0_15px_rgba(255,192,0,0.25)]",
          avatarSize: "h-[4.5rem] w-[4.5rem]",
          gradient: "from-[#ffc000]/10",
          rank: "1",
          glowColor: "#ffc000",
        }
      : slot === "second"
        ? {
            height: "h-[240px]",
            border: "border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
            rankBg: "bg-[#0a1526] border-blue-500/30 text-blue-400",
            avatarBorder: "border-2 border-blue-500/40",
            avatarSize: "h-16 w-16",
            gradient: "from-blue-950/20",
            rank: "2",
            glowColor: "#3b82f6",
          }
        : {
            height: "h-[240px]",
            border: "border-orange-900/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
            rankBg: "bg-[#1d140e] border-amber-600/30 text-amber-500",
            avatarBorder: "border-2 border-amber-600/40",
            avatarSize: "h-16 w-16",
            gradient: "from-orange-950/20",
            rank: "3",
            glowColor: "#d97706",
          };

  return (
    <div
      className={`arena-panel relative flex flex-col items-center justify-between overflow-hidden p-5 text-center bg-[#04080f] ${styles.height} ${styles.border} podium-glow-border`}
      style={{ "--podium-glow-color": styles.glowColor } as React.CSSProperties}
    >
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-20">
        <AgentAvatar src={player.avatar} alt="" className="h-full w-full scale-105 object-cover object-[center_12%] blur-[0.5px]" />
        <div className={`absolute inset-0 bg-gradient-to-b ${styles.gradient} via-transparent to-[#04080f]`} />
      </div>

      <div
        className={`absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border font-tech text-sm font-black ${styles.rankBg}`}
      >
        {styles.rank}
      </div>

      <div className="relative z-10 mt-2">
        <div className={`overflow-hidden rounded-full ${styles.avatarSize} ${styles.avatarBorder}`}>
          <AgentAvatar src={player.avatar} alt={player.name} className="h-full w-full object-cover object-[center_12%]" />
        </div>
      </div>

      <div className="relative z-10 mt-2">
        <div className="flex items-center justify-center gap-1.5 font-semibold text-white">
          <span>{player.name}</span>
          <Hexagon className="h-3.5 w-3.5 fill-[#9a35ff] text-[#9a35ff]" />
        </div>
        <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-white/50">
          <ClanIcon type={player.clanIconType} className="h-3 w-3" />
          <span>{player.clanName}</span>
        </div>
      </div>

      <div className="relative z-10 mt-2 flex flex-col items-center gap-1">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
          <Trophy className="h-4 w-4 text-[#ffc000]" />
          <span>{player.points} PTS</span>
        </div>
        {player.eloRating != null ? (
          <div className="flex items-center gap-1.5">
            <img
              src={getRankFromElo(player.eloRating).image}
              alt={getRankFromElo(player.eloRating).name}
              className="h-5 w-5 object-contain"
            />
            <span
              className="font-tech text-[9px] uppercase tracking-wider"
              style={{ color: getRankFromElo(player.eloRating).color }}
            >
              {getRankFromElo(player.eloRating).shortName}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function LeaderboardPodium({ top3 }: { top3: [DisplayPlayer, DisplayPlayer, DisplayPlayer] | null }) {
  if (!top3) return null;

  const [first, second, third] = top3;

  return (
    <div className="grid items-end gap-4 pt-4 sm:grid-cols-3">
      <PodiumCard player={second} slot="second" />
      <PodiumCard player={first} slot="first" />
      <PodiumCard player={third} slot="third" />
    </div>
  );
}
