import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  ChevronRight,
  Download,
  Gamepad2,
  Info,
  Layers,
  Search,
  Smartphone,
  Volume2,
  Zap,
} from "lucide-react";
import { ArenaPageLayout } from "@/components/arena/ArenaPageLayout";
import { GameListingCard, GameListingCardSkeleton } from "@/components/games/GameListingCard";
import { gamesApi } from "@/api/gamesApi";
import { isGameDownloadable } from "@/lib/gameDownload";
import { getGameDescription, getGameImage, getGameKey, getGameName } from "@/lib/gameDisplay";
import type { Game } from "@/types/api";

const GAME_TYPE_FILTERS = ["All", "Action", "Arcade", "Puzzle", "Racing"] as const;

const GAME_TYPE_GAME_KEYS: Record<(typeof GAME_TYPE_FILTERS)[number], string[]> = {
  All: [],
  Action: ["robowars", "warzonewarriors"],
  Arcade: ["zerogpool", "zerodash"],
  Puzzle: ["guesstheai"],
  Racing: ["highwayhustle"],
};

const Games = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<(typeof GAME_TYPE_FILTERS)[number]>("All");
  const navigate = useNavigate();

  const { data: gamesData, isLoading: gamesLoading } = useQuery({
    queryKey: ["games", "all"],
    queryFn: () => gamesApi.getAll(1, 50),
    staleTime: 5 * 60_000,
  });

  const allGames = gamesData?.games ?? [];

  const filtered = useMemo(() => {
    return allGames.filter((game) => {
      const name = getGameName(game.name).toLowerCase();
      const matchSearch = name.includes(search.toLowerCase());
      const key = getGameKey(game);
      const allowedKeys = GAME_TYPE_GAME_KEYS[selectedCategory];
      const matchCat = selectedCategory === "All" || allowedKeys.includes(key);
      return matchSearch && matchCat;
    });
  }, [allGames, search, selectedCategory]);

  const featuredGames = useMemo(() => filtered.slice(0, 2), [filtered]);

  const instantPlayCount = useMemo(
    () => allGames.filter((g) => !isGameDownloadable(g)).length,
    [allGames],
  );
  const downloadableCount = allGames.length - instantPlayCount;

  const openGame = (game: Game) => {
    const gameId = game.identification ?? game.slug ?? game._id;
    if (gameId) navigate(`/game/${gameId}`);
  };

  return (
    <ArenaPageLayout>
      <div>
        <h1 className="font-tech text-3xl font-bold uppercase tracking-tight text-white">GAMES</h1>
        <p className="mt-1 text-[11px] font-medium text-white/55">
          Browse and play on-chain games across the Kult platform.
        </p>
      </div>

      <div className="arena-panel grid grid-cols-2 divide-x divide-white/8 overflow-hidden md:grid-cols-4">
        {[
          { label: "TOTAL GAMES", value: String(allGames.length), icon: Gamepad2, color: "#0089ff" },
          { label: "VISIBLE", value: String(filtered.length), icon: Layers, color: "#b338ff" },
          { label: "INSTANT PLAY", value: String(instantPlayCount), icon: Zap, color: "#00f080" },
          { label: "DOWNLOADABLE", value: String(downloadableCount), icon: Download, color: "#ffc000" },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 p-4">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-white/[0.04]">
              <stat.icon className="h-6 w-6" style={{ color: stat.color }} />
            </div>
            <div>
              <div className="font-tech text-[9px] text-white/48">{stat.label}</div>
              <div className="mt-1 text-2xl font-semibold text-white">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="arena-panel flex flex-wrap items-center justify-between gap-3 border-white/8 bg-[#04080f]/95 p-3">
        <div className="flex flex-wrap items-center gap-1">
          {GAME_TYPE_FILTERS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded px-3 py-1.5 font-tech text-[10px] font-bold uppercase tracking-wider transition ${
                selectedCategory === cat
                  ? "bg-[#9a35ff] text-white"
                  : "text-white/40 hover:bg-white/5 hover:text-white"
              }`}
            >
              {cat === "All" ? "ALL GAMES" : cat.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="relative max-sm:w-full sm:min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded border border-white/8 bg-[#0a0f1b]/80 pl-9 pr-3 font-tech text-[10px] uppercase tracking-wider text-white placeholder:text-white/30 focus:border-[#9a35ff]/45 focus:outline-none"
          />
        </div>
      </div>

      {!gamesLoading && featuredGames.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">Featured titles</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {featuredGames.map((game) => {
              const name = getGameName(game.name);
              const image = getGameImage(game);
              const downloadable = isGameDownloadable(game);
              return (
                <article
                  key={game._id ?? game.identification}
                  className="arena-panel group relative min-h-[240px] overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-[#9a35ff]/50 hover:shadow-[0_0_46px_rgba(154,53,255,0.2)]"
                >
                  {image ? (
                    <img
                      src={image}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-700 group-hover:scale-105 group-hover:opacity-85"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#050913]/95 via-[#050913]/75 to-[#050913]/35 transition group-hover:via-[#050913]/58" />
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,transparent,transparent_6px,rgba(0,240,255,0.06)_7px)]" />
                    <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#c084fc] to-transparent" />
                  </div>
                  <div className="relative z-10 flex h-full min-h-[240px] flex-col justify-between p-6">
                    <div>
                      <span className="inline-flex rounded border border-[#9f2dff]/50 bg-[#5b1499]/35 px-2 py-0.5 font-tech text-[9px] font-bold uppercase tracking-wider text-[#d773ff]">
                        {game.category ?? "Arena Game"}
                      </span>
                      <h3 className="mt-3 font-tech text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                        {name}
                      </h3>
                      <p className="mt-2 line-clamp-2 max-w-md text-xs text-white/65">
                        {getGameDescription(game.description) || "Jump in and compete on the Kult leaderboard."}
                      </p>
                      <div className="mt-4 grid max-w-sm grid-cols-3 gap-2 opacity-0 transition duration-300 group-hover:opacity-100">
                        {[
                          ["AI Win", "74%"],
                          ["Heat", downloadable ? "BUILD" : "LIVE"],
                          ["Rivals", "32"],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded border border-white/8 bg-black/35 px-2 py-1.5">
                            <div className="font-tech text-[8px] uppercase tracking-wider text-white/34">{label}</div>
                            <div className="mt-0.5 font-tech text-[10px] font-bold text-white/80">{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openGame(game)}
                        className="flex h-10 w-fit items-center gap-2 rounded border border-[#9b32ff]/70 bg-[#170d26]/75 px-4 font-tech text-[10px] font-bold uppercase tracking-wider text-[#d6acff] transition hover:border-[#9a35ff]"
                      >
                        {downloadable ? "View & Download" : "Enter Game"}
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                      <span className="flex translate-y-1 items-center gap-2 rounded border border-white/8 bg-black/35 px-3 py-2 text-[10px] text-white/58 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <Volume2 className="h-3.5 w-3.5 text-[#00f080]" />
                        AI voice line armed
                        <Activity className="h-3.5 w-3.5 text-[#9a35ff]" />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between pt-1">
        <h2 className="font-tech text-xs font-semibold uppercase tracking-wider text-white/86">All games</h2>
        <span className="font-tech text-[10px] text-white/40">{filtered.length} titles</span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {gamesLoading
          ? Array.from({ length: 8 }).map((_, i) => <GameListingCardSkeleton key={i} />)
          : filtered.map((game) => (
              <GameListingCard
                key={game._id ?? game.identification}
                game={game}
                name={getGameName(game.name)}
                image={getGameImage(game)}
                description={getGameDescription(game.description)}
                downloadable={isGameDownloadable(game)}
                onOpen={() => openGame(game)}
              />
            ))}
      </div>

      {!gamesLoading && filtered.length === 0 ? (
        <div className="arena-panel border-white/8 px-6 py-14 text-center">
          <p className="font-tech text-sm uppercase tracking-wider text-white/55">No games found</p>
          <p className="mt-2 text-xs text-white/40">Try another category or search term.</p>
        </div>
      ) : null}

      <div className="arena-panel flex flex-wrap items-center justify-between gap-3 border-white/8 bg-[#04080f]/95 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-400">
            <Info className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-tech text-[10px] font-bold uppercase tracking-wider text-white">
              Every game connects to the AI Arena ecosystem.
            </h4>
            <p className="text-[9px] font-semibold leading-none text-white/40">
              Train agents, battle rivals, and climb leaderboards across titles.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded border border-white/8 bg-[#0a0f1b]/60 px-3 py-2 font-tech text-[9px] font-bold uppercase tracking-wider text-white/50 sm:inline-flex">
            <Smartphone className="h-3.5 w-3.5" />
            Cross-platform
          </span>
          <button
            type="button"
            onClick={() => navigate("/leaderboard")}
            className="flex cursor-pointer items-center gap-1.5 rounded border border-white/8 bg-[#0a0f1b]/60 px-5 py-2.5 font-tech text-[9px] font-bold uppercase tracking-wider text-purple-400 transition hover:border-purple-500/35 hover:bg-purple-950/10"
          >
            <span>View Leaderboard</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </ArenaPageLayout>
  );
};

export default Games;
