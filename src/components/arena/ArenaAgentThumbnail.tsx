import { getArenaAgentPortrait } from "@/constants/arenaAgentArchetypes";
import { cn } from "@/lib/utils";

type ArenaAgentThumbnailProps = {
  agent: { id: string; archetype?: string | null; name?: string };
  className?: string;
  size?: "sm" | "md";
};

const sizeClass = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
} as const;

export function ArenaAgentThumbnail({ agent, className, size = "sm" }: ArenaAgentThumbnailProps) {
  const src = getArenaAgentPortrait(agent);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[hsl(268_32%_8%/0.65)]",
        sizeClass[size],
        className
      )}
    >
      {src.endsWith(".mp4") ? (
        <video
          src={src}
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover object-center"
        />
      ) : (
        <img
          src={src}
          alt={agent.name ? `${agent.name} portrait` : "Agent portrait"}
          className="h-full w-full object-contain object-center p-0.5"
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}
