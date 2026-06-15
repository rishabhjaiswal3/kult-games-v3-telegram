import { useMemo } from "react";
import { useParams, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download } from "lucide-react";
import { gamesApi } from "@/api/gamesApi";
import { HighwayHustleModeModal } from "@/components/highway/HighwayHustleModeModal";
import { StorageKeys } from "@/constants/storageKeys";
import {
  getHighwayAggregateRouteId,
  getHighwayModeByModeId,
  isHighwayHustleFamily,
  type HighwayHustleModeConfig,
} from "@/constants/highwayHustleModes";
import { useAuth } from "@/contexts/AuthContext";
import { gameDownloadUrl, hasGameDownloadUrl, isGameDownloadable } from "@/lib/gameDownload";
import { buildGameIframeUrl } from "@/lib/buildGameIframeUrl";
import { triggerBrowserDownload } from "@/lib/triggerBrowserDownload";
import { GamePlaySkeleton } from "@/components/skeleton";
import type { AppShellOutletContext } from "@/layout/AppShell";
import { cn } from "@/lib/utils";

const GamePlay = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const shellContext = useOutletContext<AppShellOutletContext>();
  const { walletAddress } = useAuth();

  const modeParam = searchParams.get("mode");

  const { data: game, isLoading, isError } = useQuery({
    queryKey: ["game", id],
    queryFn: () => gamesApi.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });

  const isHighwayHustle = isHighwayHustleFamily(id ?? "") || (game ? isHighwayHustleFamily(game) : false);

  const selectedMode = useMemo((): HighwayHustleModeConfig | null => {
    if (!modeParam) return null;
    return getHighwayModeByModeId(modeParam) ?? null;
  }, [modeParam]);

  const rawPlayUrl = useMemo(() => {
    if (selectedMode) return selectedMode.playUrl;
    return (
      (game?.metadata?.play_url as string) ?? (game && !isGameDownloadable(game) ? game.url : "") ?? ""
    );
  }, [selectedMode, game]);

  const token = localStorage.getItem(StorageKeys.local.authToken);
  const playUrl = buildGameIframeUrl(rawPlayUrl, {
    token,
    walletAddress,
    game: selectedMode
      ? {
          ...game!,
          metadata: {
            ...(game?.metadata ?? {}),
            highway_mode: selectedMode.mode,
            play_url: selectedMode.playUrl,
          },
        }
      : game,
  });

  const handleSelectMode = (mode: HighwayHustleModeConfig) => {
    setSearchParams({ mode: mode.mode }, { replace: true });
  };

  const handleCloseModeModal = () => {
    if (id) navigate(`/game/${id}`);
    else navigate(-1);
  };

  if (isLoading) {
    return <GamePlaySkeleton />;
  }

  if (isError || !game) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-5 lg:p-6">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-black/20 p-8 text-center backdrop-blur-sm">
          <p className="font-display text-lg text-white">Game URL not available.</p>
          <button type="button" onClick={() => navigate(-1)} className="mt-4 text-sm text-cyan-300 transition hover:text-cyan-200">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (isGameDownloadable(game)) {
    const href = gameDownloadUrl(game);
    const canDownload = hasGameDownloadUrl(game);
    const title =
      typeof game.name === "string" ? game.name : game.name?.en ?? Object.values(game.name ?? {})[0] ?? "Game";
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-5 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3.5 py-2 text-sm text-white transition hover:border-cyan-400/45 hover:text-cyan-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="button"
            onClick={() => navigate(`/game/${id}`)}
            className="text-sm text-white/55 transition hover:text-cyan-300"
          >
            Open game page
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,12,24,0.96),rgba(4,8,16,0.92))] p-8 text-center shadow-[0_0_60px_rgba(0,0,0,0.28)]">
            <p className="font-display text-lg text-white">{title}</p>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/60">
              {canDownload
                ? "This game runs as a download on your device, not in the browser. Use the button below and keep the rest of the app open."
                : "This game is marked as downloadable, but the download link is not available yet."}
            </p>
            <button
              type="button"
              onClick={() => triggerBrowserDownload(href)}
              disabled={!canDownload}
              className="mx-auto mt-6 flex items-center gap-2 px-8 py-3.5 font-display text-sm font-bold tracking-[0.18em] btn-eye"
            >
              <Download className="h-5 w-5" />
              {canDownload ? "DOWNLOAD" : "DOWNLOAD SOON"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isHighwayHustle && !selectedMode) {
    return (
      <>
        <div className="flex min-h-0 flex-1 items-center justify-center bg-black p-6">
          <p className="font-tech text-xs uppercase tracking-widest text-white/40">Select a mission to launch</p>
        </div>
        <HighwayHustleModeModal
          open
          onClose={handleCloseModeModal}
          onSelectMode={handleSelectMode}
        />
      </>
    );
  }

  if (!rawPlayUrl) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-5 lg:p-6">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-black/20 p-8 text-center backdrop-blur-sm">
          <p className="font-display text-lg text-white">Game URL not available.</p>
          <button type="button" onClick={() => navigate(-1)} className="mt-4 text-sm text-cyan-300 transition hover:text-cyan-200">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const gameTitle = selectedMode
    ? `Highway Hustle — ${selectedMode.name}`
    : typeof game.name === "string"
      ? game.name
      : game.name?.en ?? Object.values(game.name ?? {})[0] ?? "Game";

  const aggregateId = getHighwayAggregateRouteId(game);

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="absolute left-0 top-0 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => shellContext?.toggleGameChrome()}
          aria-label={shellContext?.isGameChromeVisible ? "Hide header and sidebar" : "Show header and sidebar"}
          title={shellContext?.isGameChromeVisible ? "Hide header and sidebar" : "Show header and sidebar"}
          className="group relative h-8 w-8 rounded-none rounded-br-[14px] border-b border-r border-white/14 bg-[linear-gradient(135deg,rgba(5,10,18,0.92),rgba(0,210,255,0.2),rgba(155,50,255,0.24))] shadow-[0_8px_20px_rgba(0,0,0,0.3),0_0_18px_rgba(0,210,255,0.1)] backdrop-blur-md transition duration-200 hover:border-cyan-300/55 hover:shadow-[0_10px_24px_rgba(0,0,0,0.34),0_0_22px_rgba(0,210,255,0.18)]"
        >
          <span className="pointer-events-none absolute inset-0 rounded-none rounded-br-[14px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_45%)] opacity-80" />
          <span
            className={cn(
              "absolute inset-0 transition-transform duration-200",
              shellContext?.isGameChromeVisible ? "rotate-0" : "rotate-180",
            )}
          >
            <span className="absolute left-[7px] top-[7px] h-[2px] w-[10px] rounded-full bg-white/95 shadow-[0_0_8px_rgba(255,255,255,0.32)] transition-colors group-hover:bg-cyan-200" />
            <span className="absolute left-[7px] top-[7px] h-[10px] w-[2px] rounded-full bg-white/95 shadow-[0_0_8px_rgba(255,255,255,0.32)] transition-colors group-hover:bg-cyan-200" />
          </span>
        </button>
        {isHighwayHustle && selectedMode ? (
          <button
            type="button"
            onClick={() => navigate(`/game/${aggregateId}/play`, { replace: true })}
            className="rounded-lg border border-white/15 bg-black/60 px-3 py-1.5 font-tech text-[9px] font-bold uppercase tracking-wider text-white/70 backdrop-blur hover:border-purple-500/40 hover:text-white"
          >
            Change mode
          </button>
        ) : null}
      </div>
      <div className="h-full w-full">
        <iframe
          src={playUrl}
          title={gameTitle}
          className="h-full w-full border-none"
          allow="fullscreen; autoplay; clipboard-write; gamepad"
        />
      </div>
    </div>
  );
};

export default GamePlay;
