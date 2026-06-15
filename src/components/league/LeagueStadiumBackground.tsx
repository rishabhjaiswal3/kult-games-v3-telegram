import { useCallback, useEffect, useRef } from "react";
import leagueBackgroundVideo from "@/assets/league_background.mp4";

const START_AT_SECONDS = 1;
const INITIAL_HOLD_MS = 1000;

type LeagueStadiumBackgroundProps = {
  /** Lighter overlays when nothing is drawn on top of the video */
  clean?: boolean;
};

/**
 * Stadium broadcast backdrop — holds at 00:01 for 1s, then loops from there.
 */
export function LeagueStadiumBackground({ clean = false }: LeagueStadiumBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const holdTimeoutRef = useRef<number>();

  const holdThenPlay = useCallback((video: HTMLVideoElement) => {
    if (holdTimeoutRef.current) {
      window.clearTimeout(holdTimeoutRef.current);
    }

    video.pause();
    if (Number.isFinite(video.duration) && video.duration > START_AT_SECONDS) {
      video.currentTime = START_AT_SECONDS;
    }

    holdTimeoutRef.current = window.setTimeout(() => {
      void video.play().catch(() => {
        /* autoplay may be blocked until user interaction */
      });
    }, INITIAL_HOLD_MS);
  }, []);

  useEffect(
    () => () => {
      if (holdTimeoutRef.current) {
        window.clearTimeout(holdTimeoutRef.current);
      }
    },
    [],
  );

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) holdThenPlay(video);
  }, [holdThenPlay]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video && video.currentTime < START_AT_SECONDS) {
      video.currentTime = START_AT_SECONDS;
    }
  }, []);

  return (
    <div className="absolute inset-0 size-full overflow-hidden" aria-hidden>
      <video
        ref={videoRef}
        src={leagueBackgroundVideo}
        loop
        muted
        playsInline
        preload="auto"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        className="absolute inset-0 size-full max-w-none object-cover object-center sm:object-[center_35%]"
      />
      {!clean ? (
        <>
          <div className="absolute inset-0 bg-[#0a1628]/20 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05050a]/50 via-[#05050a]/10 via-45% to-[#05050a]/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05050a]/40 via-transparent to-[#05050a]/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_38%,rgba(255,255,255,0.1),transparent_65%)]" />
        </>
      ) : (
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#05050a] to-transparent sm:h-16" />
      )}
    </div>
  );
}
