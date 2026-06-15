import { Activity, ArrowUpRight, Download, Gamepad2, MessageSquare, Radio, Star, Volume2 } from "lucide-react";
import type { Game } from "@/types/api";

type GameListingCardProps = {
  game: Game;
  name: string;
  image: string;
  description: string;
  downloadable: boolean;
  onOpen: () => void;
};

function getCategoryBadgeStyle(category: string | undefined) {
  const key = (category ?? "").toLowerCase();
  if (key.includes("action")) return "bg-red-950/80 border-red-500/35 text-red-400";
  if (key.includes("arcade")) return "bg-purple-950/80 border-purple-500/35 text-[#d6acff]";
  if (key.includes("puzzle")) return "bg-blue-950/80 border-blue-500/35 text-blue-400";
  if (key.includes("racing")) return "bg-emerald-950/80 border-emerald-500/35 text-emerald-400";
  return "bg-purple-950/80 border-purple-500/35 text-[#d6acff]";
}

function getHoverPersona(name: string, category: string | undefined) {
  const seed = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const trashTalk = [
    "Your agent thinks this lobby is free.",
    "Enemy AI is already adapting.",
    "Trash talk module armed.",
    "Rival squad detected. No warmup.",
    "Prediction: messy win, loud finish.",
  ];
  const voiceLines = [
    "Agent voice: target locked.",
    "Agent voice: I learned your opener.",
    "Agent voice: run the simulation again.",
    "Agent voice: their pattern is breaking.",
    "Agent voice: send me into the next round.",
  ];

  const categoryKey = (category ?? "Arena").toUpperCase();

  return {
    trashTalk: trashTalk[seed % trashTalk.length],
    voiceLine: voiceLines[(seed + 2) % voiceLines.length],
    winRate: `${58 + (seed % 31)}%`,
    liveAgents: `${120 + (seed % 760)}`,
    heat: categoryKey.includes("RACING") ? "BOOST" : categoryKey.includes("PUZZLE") ? "MIND" : "WAR",
  };
}

function getTrailerUrl(game: Game): string | null {
  const metadata = game.metadata ?? {};
  const candidates = [
    metadata.trailerUrl,
    metadata.trailer_url,
    metadata.previewVideo,
    metadata.preview_video,
    metadata.videoUrl,
    metadata.video_url,
  ];

  const trailer = candidates.find((value): value is string => typeof value === "string" && value.length > 0);
  return trailer ?? null;
}

export function GameListingCard({
  game,
  name,
  image,
  description,
  downloadable,
  onOpen,
}: GameListingCardProps) {
  const badgeClass = getCategoryBadgeStyle(game.category);
  const platforms = game.platform ?? [];
  const hover = getHoverPersona(name, game.category);
  const trailerUrl = getTrailerUrl(game);

  return (
    <article className="group relative flex min-h-full flex-col overflow-hidden rounded-lg border border-white/8 bg-[#04080f]/95 transition duration-300 hover:-translate-y-1 hover:border-[#9a35ff]/60 hover:shadow-[0_0_42px_rgba(154,53,255,0.22),0_18px_48px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_10%,rgba(154,53,255,0.22),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(0,240,128,0.13),transparent_28%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c084fc]/90 to-transparent" />
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="relative aspect-[16/10] w-full cursor-pointer overflow-hidden bg-[#0a0f18] text-left"
      >
        {image ? (
          <img
            src={image}
            alt={name}
            className={`h-full w-full object-cover object-top transition duration-500 group-hover:scale-105 ${trailerUrl ? "group-hover:opacity-0" : ""}`}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-tech text-[9px] uppercase tracking-wider text-white/35">
            No preview
          </div>
        )}
        {trailerUrl ? (
          <video
            src={trailerUrl}
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover object-top opacity-0 transition duration-300 group-hover:opacity-100"
            onMouseEnter={(event) => {
              void event.currentTarget.play();
            }}
            onMouseLeave={(event) => {
              event.currentTarget.pause();
              event.currentTarget.currentTime = 0;
            }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/10 to-transparent transition group-hover:via-black/45" />
        <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,transparent,transparent_5px,rgba(0,240,255,0.07)_6px)]" />
          <div className="absolute -left-1/2 top-0 h-full w-1/2 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/18 to-transparent transition-transform duration-700 group-hover:translate-x-[320%]" />
        </div>
        {game.category ? (
          <div
            className={`absolute left-3 top-3 rounded border px-2 py-0.5 font-tech text-[9px] font-black uppercase tracking-wide ${badgeClass}`}
          >
            {game.category}
          </div>
        ) : null}
        {game.rating != null ? (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded border border-white/10 bg-[#03070d]/80 px-1.5 py-0.5">
            <Star className="h-3 w-3 fill-[#ffc000] text-[#ffc000]" />
            <span className="font-tech text-[9px] font-bold text-white">{game.rating}</span>
          </div>
        ) : null}
        <div className="absolute bottom-3 right-3 rounded border border-white/10 bg-[#03070d]/80 px-2 py-0.5 font-tech text-[9px] font-bold uppercase tracking-wide text-white/85">
          {downloadable ? "Download" : "Instant Play"}
        </div>
        <div className="absolute bottom-3 left-3 flex translate-y-2 items-center gap-1.5 rounded border border-cyan-300/20 bg-black/60 px-2 py-1 font-tech text-[9px] uppercase tracking-wider text-cyan-200 opacity-0 backdrop-blur-sm transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <Radio className="h-3 w-3" />
          {trailerUrl ? "Trailer autoplay" : "Preview"}
        </div>
        <div className="absolute left-3 right-3 top-12 translate-y-2 rounded border border-[#9a35ff]/30 bg-black/70 p-2 opacity-0 shadow-[0_0_28px_rgba(154,53,255,0.18)] backdrop-blur-sm transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="mb-1 flex items-center gap-1.5 font-tech text-[9px] uppercase tracking-wider text-[#d6acff]">
            <MessageSquare className="h-3 w-3" />
            AI trash talk
          </div>
          <p className="line-clamp-2 text-[11px] leading-snug text-white/78">{hover.trashTalk}</p>
        </div>
      </button>

      <div className="flex flex-1 flex-col p-4">
        <button
          type="button"
          onClick={onOpen}
          className="truncate text-left text-base font-semibold text-white/90 transition hover:text-[#c78aff]"
        >
          {name}
        </button>
        {description ? (
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/45">{description}</p>
        ) : null}
        {platforms.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {platforms.slice(0, 3).map((p) => (
              <span
                key={p}
                className="rounded border border-white/8 bg-white/[0.03] px-1.5 py-0.5 font-tech text-[8px] uppercase text-white/40"
              >
                {p}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-3 grid grid-cols-3 gap-1.5 opacity-75 transition duration-300 group-hover:opacity-100">
          {[
            { label: "Win AI", value: hover.winRate },
            { label: "Agents", value: hover.liveAgents },
            { label: "Heat", value: hover.heat },
          ].map((stat) => (
            <div key={stat.label} className="rounded border border-white/8 bg-white/[0.025] px-2 py-1.5">
              <div className="font-tech text-[8px] uppercase tracking-wider text-white/32">{stat.label}</div>
              <div className="mt-0.5 truncate font-tech text-[10px] font-bold text-white/80">{stat.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex translate-y-1 items-center gap-2 rounded border border-white/8 bg-white/[0.025] px-2.5 py-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <Volume2 className="h-3.5 w-3.5 shrink-0 text-[#00f080]" />
          <span className="min-w-0 truncate text-[10px] font-medium text-white/55">{hover.voiceLine}</span>
          <Activity className="ml-auto h-3.5 w-3.5 shrink-0 text-[#9a35ff]" />
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-white/6 pt-3">
          <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-[#00f080]">Free</span>
          <button
            type="button"
            onClick={onOpen}
            className="flex items-center gap-1.5 rounded border border-[#9b32ff]/70 bg-[#170d26]/65 px-3 py-1.5 font-tech text-[9px] font-bold uppercase tracking-wider text-[#d6acff] transition hover:border-[#9a35ff] hover:bg-[#230b35]/90"
          >
            {downloadable ? (
              <>
                <Download className="h-3.5 w-3.5" />
                Get Game
              </>
            ) : (
              <>
                <Gamepad2 className="h-3.5 w-3.5" />
                Play
              </>
            )}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

export function GameListingCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-white/8 bg-[#04080f]/95">
      <div className="aspect-[16/10] animate-pulse bg-white/5" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-4/5 animate-pulse rounded bg-white/5" />
        <div className="h-3 w-full animate-pulse rounded bg-white/5" />
        <div className="mt-3 flex justify-between border-t border-white/6 pt-3">
          <div className="h-3 w-10 animate-pulse rounded bg-white/5" />
          <div className="h-8 w-24 animate-pulse rounded bg-white/5" />
        </div>
      </div>
    </div>
  );
}
