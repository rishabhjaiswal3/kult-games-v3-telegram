/**
 * ArenaGamePage — Full-screen AI Arena battle experience.
 *
 * Unity WebGL is loaded *directly* in this React component (ZeroDash pattern):
 *   • Dynamic <script> injection of WarzoneV4.loader.js from R2
 *   • window.createUnityInstance() called with R2 absolute file URLs
 *   • React loading screen (agent cards, rain, progress bar) shown while Unity loads
 *   • battleId sent via SendMessage('GameManager','SetBattleId', battleId) after load
 *   • unityInstance.Quit() called on unmount
 *
 * Set VITE_UNITY_BUILD_URL to the R2 base path (no trailing slash, no /index.html):
 *   e.g. https://pub-xxxx.r2.dev/v4/WarzoneV4
 */

import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type KeyboardEvent,
} from "react";
// Note: useCallback kept for addSystem / addResult helpers below
import {
  Swords,
  Trophy,
  ExternalLink,
  Send,
  Share2,
  Loader2,
  ArrowLeft,
  Crown,
  Shield,
  Zap,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { aiArenaGatewayApi } from "@/api/aiArenaGatewayApi";
import { buildTrashTalkMomentPath } from "@/lib/battleTrashTalkMoment";
import { getRankFromElo } from "@/utils/rankSystem";
import { ArenaAgentThumbnail } from "@/components/arena/ArenaAgentThumbnail";
import { getArenaAgentPortrait } from "@/constants/arenaAgentArchetypes";
import type {
  AiArenaAgent,
  AiArenaBattle,
  AiArenaBattleResult,
} from "@/types/aiArenaGateway";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

/** Base R2 path — no trailing slash, no /index.html.
 *  e.g. https://pub-2c48e58780b648b7a2a77316f7b0aa2c.r2.dev/v4/WarzoneV4 */
const UNITY_BASE_URL: string = import.meta.env.VITE_UNITY_BUILD_URL ?? "";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type GamePhase = "live" | "ended";

/** Shape of the CustomEvent fired by Unity when the match ends. */
type UnityBattleResult = {
  battleId: string;
  myAgentWon: boolean;
  winnerId: string;
  winnerName: string;
  winnerArchetype: string;
  winnerClan: string;
  winnerElo: number;
  winnerHpPercent: number; // 0-100
  loserId: string;
  loserName: string;
  loserArchetype: string;
  loserClan: string;
  loserElo: number;
  loserHpPercent: number; // 0-100
  durationSeconds: number;
  endReason: string; // "death" | "timeout"
  /** Per-agent action stats keyed by agentId. Forwarded to POST /v1/battles/:id/end. */
  playerStats?: Record<string, {
    jumps: number;
    shotsAttempted: number;
    shotsConnected: number;
    timesHit: number;
    distanceCovered: number;
  }>;
};

type ChatMsg =
  | { id: string; kind: "system"; text: string; ts: Date }
  | {
      id: string;
      kind: "player";
      agentId: string;
      agentName: string;
      color: string;
      text: string;
      ts: Date;
    }
  | {
      id: string;
      kind: "result";
      result: AiArenaBattleResult;
      battle: AiArenaBattle;
      myAgentId: string | null;
      myAgent: AiArenaAgent | null;
      opponent: AiArenaAgent | null;
      ts: Date;
    };

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function shortId(v?: string | null) {
  if (!v) return "—";
  return v.length > 14 ? `${v.slice(0, 6)}…${v.slice(-4)}` : v;
}

function clanColor(clan?: string): string {
  const c = (clan ?? "").toUpperCase();
  if (c === "ZEROG") return "#00e68a";
  if (c === "BASE") return "#0052ff";
  if (c === "SOLANA") return "#9945ff";
  return "#8b6dff";
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function eloSign(delta?: number) {
  if (delta == null) return null;
  return delta >= 0 ? `+${delta}` : `${delta}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading screen sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Portrait + stats card shown in the Unity loading overlay */
function AgentLoadingCard({
  agent,
  side,
}: {
  agent: AiArenaAgent | null;
  side: "left" | "right";
}) {
  const portrait = agent ? getArenaAgentPortrait(agent) : null;
  const isVideo = portrait?.endsWith(".mp4");
  const color = agent ? clanColor(agent.clan) : "#8b6dff";

  return (
    <div className="flex flex-col items-center gap-3" style={{ width: 180 }}>
      {/* Portrait frame */}
      <div
        className="relative overflow-hidden rounded-2xl border border-white/20"
        style={{
          width: 180,
          height: 220,
          boxShadow: `0 0 48px ${color}55, 0 12px 40px rgba(0,0,0,0.7)`,
        }}
      >
        {portrait ? (
          isVideo ? (
            <video
              src={portrait}
              autoPlay
              loop
              muted
              playsInline
              className={cn(
                "h-full w-full object-cover object-top",
                side === "right" && "-scale-x-100"
              )}
            />
          ) : (
            <img
              src={portrait}
              alt={agent?.name ?? "agent"}
              className={cn(
                "h-full w-full object-cover object-top",
                side === "right" && "-scale-x-100"
              )}
              loading="eager"
            />
          )
        ) : (
          <div className="h-full w-full animate-pulse bg-white/5" />
        )}

        {/* Bottom name overlay */}
        <div
          className="absolute inset-x-0 bottom-0 px-3 pb-3 pt-10"
          style={{ background: `linear-gradient(to top, ${color}cc 0%, ${color}40 60%, transparent 100%)` }}
        >
          <div className="font-display text-base font-black leading-tight text-white drop-shadow-lg truncate">
            {agent?.name ?? "???"}
          </div>
          <div className="font-tech text-[9px] uppercase tracking-widest text-white/70 mt-0.5">
            {agent?.archetype ?? "—"}
          </div>
        </div>
      </div>

      {/* Stats panel — glassmorphism */}
      <div
        className="w-full rounded-xl border border-white/10 px-4 py-2.5 text-center"
        style={{ background: "rgba(10,10,20,0.65)", backdropFilter: "blur(12px)" }}
      >
        <div className="font-tech text-lg font-bold" style={{ color }}>
          {agent?.eloRating?.toLocaleString() ?? "—"}
          <span className="text-[9px] text-white/30 font-normal ml-1">ELO</span>
        </div>
        <div className="flex justify-center gap-3 mt-0.5">
          <span className="font-mono text-[9px] text-white/35">{agent?.wins ?? 0}W</span>
          <span className="text-white/15">·</span>
          <span className="font-mono text-[9px] text-white/35">{agent?.losses ?? 0}L</span>
        </div>
        {agent?.clan && (
          <div className="font-tech text-[8px] uppercase tracking-wider mt-1" style={{ color }}>
            {agent.clan}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-match overlay
// ─────────────────────────────────────────────────────────────────────────────

const MAP_META: Record<string, { bg: string; name: string; accentColor: string }> = {
  "1": { bg: "/Warzone/Desert_Storm.png",      name: "Desert Storm",      accentColor: "#f59e0b" },
  "2": { bg: "/Warzone/Research_Facility.png", name: "Research Facility", accentColor: "#06b6d4" },
  "3": { bg: "/Warzone/Mystical_Forest.png",   name: "Mystical Forest",   accentColor: "#10b981" },
};

function PreMatchOverlay({
  mapId,
  myAgentName,
  opponentName,
  countdown,
}: {
  mapId: string;
  myAgentName: string;
  opponentName: string;
  countdown: number;
}) {
  const meta     = MAP_META[mapId] ?? MAP_META["1"];
  const maxSecs  = mapId === "1" ? 10 : mapId === "2" ? 15 : 17;
  const pct      = Math.max(0, (countdown / maxSecs) * 100);

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col overflow-hidden"
      style={{ background: "#05080f" }}
    >
      {/* ── Full-bleed map image — bright, clearly visible ── */}
      <img
        src={meta.bg}
        alt={meta.name}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 0.9 }}
        draggable={false}
      />

      {/* ── Single solid dark overlay — just enough contrast for text ── */}
      <div className="absolute inset-0" style={{ background: "rgba(5,8,15,0.72)" }} />

      {/* ══════════════════════════════════════════════════════════════════
          Content — 3-row layout: header / fighters / footer
      ══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex h-full flex-col">

        {/* ── ROW 1: header strip ─────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-3 shrink-0"
          style={{ background: "rgba(5,8,15,0.85)", borderBottom: `2px solid ${meta.accentColor}` }}
        >
          <div className="flex items-center gap-3">
            <span
              className="font-tech text-[10px] uppercase tracking-[0.35em] font-bold"
              style={{ color: meta.accentColor }}
            >
              ⚡ Arena · Ranked
            </span>
          </div>
          <div className="font-display text-base font-black text-white tracking-widest uppercase">
            {meta.name}
          </div>
          <div
            className="font-tech text-[10px] uppercase tracking-widest font-bold"
            style={{ color: meta.accentColor }}
          >
            Match Starting
          </div>
        </div>

        {/* ── ROW 2: fighters — takes all remaining space ─────────────── */}
        <div className="flex flex-1 min-h-0 items-stretch">

          {/* Left fighter panel */}
          <div
            className="flex flex-col items-center justify-end gap-0 flex-1"
            style={{ background: `linear-gradient(to right, rgba(5,8,15,0.7) 0%, transparent 100%)` }}
          >
            {/* Agent name above */}
            <div className="text-center mb-2 px-4">
              <div className="font-display text-2xl font-black text-white uppercase tracking-wide drop-shadow-lg">
                {myAgentName || "Agent A"}
              </div>
              <div className="flex items-center justify-center gap-2 mt-1.5">
                <img src="/Warzone/Uzi.png" alt="Uzi" className="h-6 object-contain drop-shadow-lg" draggable={false} />
                <span className="font-tech text-xs text-white font-bold uppercase tracking-widest">Uzi</span>
              </div>
            </div>
            {/* Character */}
            <img
              src="/Warzone/Character1-A.png"
              alt="Fighter A"
              className="object-contain object-bottom drop-shadow-2xl"
              style={{ maxHeight: "55%", width: "auto" }}
              draggable={false}
            />
          </div>

          {/* Centre VS column */}
          <div className="flex flex-col items-center justify-center shrink-0 px-4 gap-3">
            <div
              className="font-display text-5xl font-black"
              style={{
                color: "#fff",
                textShadow: `0 0 40px ${meta.accentColor}, 0 0 80px ${meta.accentColor}80`,
                WebkitTextStroke: `2px ${meta.accentColor}`,
              }}
            >
              VS
            </div>
            {/* Countdown ring */}
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full font-display text-3xl font-black"
              style={{
                border: `3px solid ${meta.accentColor}`,
                color: meta.accentColor,
                background: "rgba(5,8,15,0.9)",
                boxShadow: `0 0 30px ${meta.accentColor}80, inset 0 0 20px ${meta.accentColor}20`,
              }}
            >
              {countdown}
            </div>
          </div>

          {/* Right fighter panel */}
          <div
            className="flex flex-col items-center justify-end gap-0 flex-1"
            style={{ background: `linear-gradient(to left, rgba(5,8,15,0.7) 0%, transparent 100%)` }}
          >
            <div className="text-center mb-2 px-4">
              <div className="font-display text-2xl font-black text-white uppercase tracking-wide drop-shadow-lg">
                {opponentName || "Agent B"}
              </div>
              <div className="flex items-center justify-center gap-2 mt-1.5">
                <img src="/Warzone/Uzi.png" alt="Uzi" className="h-6 object-contain drop-shadow-lg" draggable={false} />
                <span className="font-tech text-xs text-white font-bold uppercase tracking-widest">Uzi</span>
              </div>
            </div>
            <img
              src="/Warzone/Character1-B.png"
              alt="Fighter B"
              className="object-contain object-bottom drop-shadow-2xl"
              style={{ maxHeight: "55%", width: "auto" }}
              draggable={false}
            />
          </div>

        </div>

        {/* ── ROW 3: footer — rules + sync bar ────────────────────────── */}
        <div
          className="shrink-0 flex flex-col items-center gap-2 px-6 py-4"
          style={{ background: "rgba(5,8,15,0.9)", borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Rules */}
          <p className="font-mono text-xs text-center text-white leading-relaxed max-w-lg">
            ⏱ <span className="text-white font-bold">90 second</span> match ·
            Kill the opponent to win early ·
            Your agent can <span className="font-bold" style={{ color: meta.accentColor }}>shoot</span>,{" "}
            <span className="font-bold" style={{ color: meta.accentColor }}>jump</span> &amp;{" "}
            <span className="font-bold" style={{ color: meta.accentColor }}>hide</span> based on trained behaviour ·
            Winner earns <span className="text-white font-bold">ARENA rewards</span>
          </p>

          {/* Progress bar */}
          <div className="w-full max-w-sm">
            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div
                className="h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${pct}%`, background: `linear-gradient(to right, ${meta.accentColor}, #8b6dff)` }}
              />
            </div>
          </div>

          {/* Sync text */}
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full animate-pulse"
              style={{ background: meta.accentColor }}
            />
            <span className="font-tech text-[10px] uppercase tracking-[0.35em] text-white font-bold">
              Syncing with 0G Network...
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

/** Full-screen Unity loading overlay — video background, agent cards, progress bar */
function UnityLoadingScreen({
  progress,
  myAgent,
  opponent,
  mode,
}: {
  progress: number;
  myAgent: AiArenaAgent | null;
  opponent: AiArenaAgent | null;
  mode: string;
}) {
  const myColor = myAgent ? clanColor(myAgent.clan) : "#8b6dff";
  const oppColor = opponent ? clanColor(opponent.clan) : "#06b6d4";

  return (
    <div className="absolute inset-0 z-20 overflow-hidden">
      {/* ── Background video ── */}
      <video
        src="/videos/SC_2-3.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 0.55 }}
      />

      {/* ── Dark + blur overlay (sits between video and cards) ── */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(3,7,16,0.55) 0%, rgba(3,7,16,0.45) 50%, rgba(3,7,16,0.75) 100%)", backdropFilter: "blur(2px)" }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-8 px-6">

        {/* Title */}
        <div className="text-center">
          <div className="font-display text-[10px] uppercase tracking-[0.35em] text-white/40 mb-1.5">
            ⚡ &nbsp;AI Battle&nbsp; ⚡
          </div>
          <div className="font-display text-4xl font-black tracking-[0.1em] text-gradient drop-shadow-[0_0_24px_rgba(139,92,246,0.8)]">
            AI ARENA
          </div>
        </div>

        {/* Agent cards + VS */}
        <div className="flex items-center gap-10 sm:gap-16">

          {/* My agent */}
          <AgentLoadingCard agent={myAgent} side="left" />

          {/* VS center — single column, perfectly centred */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full border border-primary/60"
              style={{
                background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(139,92,246,0.05) 100%)",
                boxShadow: "0 0 28px rgba(139,92,246,0.5), inset 0 0 16px rgba(139,92,246,0.1)",
              }}
            >
              <Swords className="h-7 w-7 text-primary" />
            </div>
            <span className="font-display text-3xl font-black text-gradient leading-none">VS</span>
            <span className="font-tech text-[9px] uppercase tracking-widest text-white/35 mt-0.5">
              {mode}
            </span>
          </div>

          {/* Opponent */}
          <AgentLoadingCard agent={opponent} side="right" />
        </div>

        {/* Progress bar */}
        <div className="w-[420px] max-w-[90vw]">
          <div className="flex justify-between font-tech text-[10px] text-white/40 mb-2 uppercase tracking-wider">
            <span>{progress < 100 ? "Loading Arena…" : "Launching…"}</span>
            <span className="font-mono">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${myColor}, #8b5cf6 50%, ${oppColor})`,
                boxShadow: progress > 0 ? "0 0 14px rgba(139,92,246,0.8)" : "none",
              }}
            />
          </div>
          <p className="text-center font-mono text-[9px] text-white/25 mt-2">
            {progress === 0
              ? "Connecting to 0G network…"
              : `Loading game assets — ${progress}%`}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Existing sub-components (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

/** Single agent card inside the top banner */
function AgentCard({
  agent,
  side,
  isWinner,
  isLoser,
}: {
  agent: AiArenaAgent | null;
  side: "left" | "right";
  isWinner?: boolean;
  isLoser?: boolean;
}) {
  const rankInfo = agent ? getRankFromElo(agent.eloRating) : null;
  const color = agent ? clanColor(agent.clan) : "#8b6dff";
  const isRight = side === "right";

  if (!agent) {
    return (
      <div className="flex flex-1 items-center gap-3 px-2 sm:px-4">
        <div className="h-14 w-14 sm:h-16 sm:w-16 animate-pulse rounded-xl bg-white/5" />
        <div className="space-y-1.5">
          <div className="h-3 w-24 animate-pulse rounded bg-white/8" />
          <div className="h-2 w-16 animate-pulse rounded bg-white/5" />
        </div>
      </div>
    );
  }

  const inner = (
    <>
      <div className="relative shrink-0">
        <div
          className="absolute -inset-1.5 rounded-xl blur-md opacity-50"
          style={{ background: `${color}40` }}
        />
        <ArenaAgentThumbnail
          agent={agent}
          className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl border-white/15"
        />
        {isWinner && (
          <Crown
            className="absolute -top-2 -right-2 h-4 w-4 drop-shadow-lg"
            style={{ color: "#fbbf24" }}
          />
        )}
      </div>

      <div className={`min-w-0 ${isRight ? "text-right" : "text-left"}`}>
        <div className="font-display text-base sm:text-lg font-bold leading-tight truncate max-w-[120px] sm:max-w-[160px]">
          {agent.name}
        </div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-white/45 mt-0.5">
          {agent.archetype}
        </div>
        <div
          className="flex items-center gap-2 mt-1.5"
          style={{ justifyContent: isRight ? "flex-end" : "flex-start" }}
        >
          <span
            className="font-tech text-sm font-bold"
            style={{ color }}
          >
            {agent.eloRating.toLocaleString()}
          </span>
          <span className="text-[9px] text-white/30 font-tech">ELO</span>
          {rankInfo && (
            <img
              src={rankInfo.image}
              alt={rankInfo.name}
              title={rankInfo.name}
              className="h-5 w-5 object-contain"
            />
          )}
        </div>
        <div
          className="flex items-center gap-2 mt-0.5"
          style={{ justifyContent: isRight ? "flex-end" : "flex-start" }}
        >
          <span className="text-[9px] text-white/30 font-tech">{agent.wins}W</span>
          <span className="text-[9px] text-white/20">·</span>
          <span className="text-[9px] text-white/30 font-tech">{agent.losses}L</span>
        </div>
      </div>
    </>
  );

  return (
    <div
      className={`flex flex-1 items-center gap-2 sm:gap-3 px-2 sm:px-4 transition-all duration-500 ${
        isLoser ? "opacity-40 grayscale" : ""
      } ${isRight ? "flex-row-reverse" : ""}`}
    >
      {inner}
    </div>
  );
}

/** Top banner: both agents + VS center */
function AgentBanner({
  myAgent,
  opponent,
  battle,
  gamePhase,
  mode,
}: {
  myAgent: AiArenaAgent | null;
  opponent: AiArenaAgent | null;
  battle?: AiArenaBattle;
  gamePhase: GamePhase;
  mode: string;
}) {
  const result = battle?.result;
  const myId = myAgent?.id;
  const myWon = result?.winnerId === myId;
  const oppWon =
    result?.loserId !== myId && result?.winnerId !== myId
      ? null
      : result?.winnerId !== myId;

  return (
    <div className="relative border-b border-white/8 bg-[#04080f]/95 backdrop-blur overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.5) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#8b5cf620] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-[#06b6d420] to-transparent" />

      <div className="relative flex items-center min-h-[80px] sm:min-h-[96px]">
        <AgentCard
          agent={myAgent}
          side="left"
          isWinner={gamePhase === "ended" && myWon}
          isLoser={gamePhase === "ended" && !myWon && !!result}
        />

        <div className="flex shrink-0 flex-col items-center justify-center px-2 sm:px-4">
          <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
            <div className="relative flex h-full w-full items-center justify-center rounded-full border border-primary/50 bg-primary/15 shadow-[0_0_20px_hsl(268_100%_70%/0.3)]">
              <Swords className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          </div>
          <span className="font-display text-base sm:text-xl font-black mt-1 text-gradient">
            VS
          </span>
          <span className="font-tech text-[8px] uppercase tracking-widest text-white/30 mt-0.5">
            {mode}
          </span>
        </div>

        <AgentCard
          agent={opponent}
          side="right"
          isWinner={gamePhase === "ended" && !!oppWon}
          isLoser={gamePhase === "ended" && oppWon === false && !!result}
        />
      </div>
    </div>
  );
}

/** Result card shown in the chat panel after battle ends */
function ResultCard({
  result,
  battle,
  myAgentId,
  myAgent,
  opponent,
  onShareMoment,
}: {
  result: AiArenaBattleResult;
  battle: AiArenaBattle;
  myAgentId: string | null;
  myAgent: AiArenaAgent | null;
  opponent: AiArenaAgent | null;
  onShareMoment?: () => void;
}) {
  const winner =
    result.winnerId === myAgent?.id
      ? myAgent
      : result.winnerId === opponent?.id
      ? opponent
      : null;
  const loser =
    result.loserId === myAgent?.id
      ? myAgent
      : result.loserId === opponent?.id
      ? opponent
      : null;
  const iWon = result.winnerId === myAgentId;

  const zgLink = battle.id
    ? `https://storagescan.0g.ai/tx/${battle.id}`
    : null;

  const winnerColor = winner ? clanColor(winner.clan) : "#fbbf24";
  const loserColor = loser ? clanColor(loser.clan) : "#6b7280";

  return (
    <div className="mx-2 my-1 overflow-hidden rounded-xl border border-white/10 bg-[#0d1020] shadow-[0_0_32px_rgba(0,0,0,0.6)]">
      <div
        className="flex items-center gap-2 px-3 py-2.5"
        style={{
          background: `linear-gradient(135deg, ${winnerColor}18, transparent)`,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Trophy
          className="h-3.5 w-3.5 shrink-0"
          style={{ color: winnerColor }}
        />
        <span
          className="font-tech text-[10px] uppercase tracking-widest font-bold"
          style={{ color: winnerColor }}
        >
          {iWon ? "VICTORY" : "DEFEAT"}
        </span>
        <span className="ml-auto font-mono text-[9px] text-white/25">
          {shortId(battle.id)}
        </span>
      </div>

      <div className="px-3 py-3 space-y-2">
        {winner && (
          <div className="flex items-center gap-2">
            <Crown className="h-3 w-3 shrink-0 text-yellow-400" />
            <span className="font-tech text-[10px] text-white/40 uppercase">
              Winner
            </span>
            <span
              className="font-tech text-[11px] font-bold ml-auto truncate max-w-[100px]"
              style={{ color: winnerColor }}
            >
              {winner.name}
            </span>
            {result.eloChange?.[winner.id] != null && (
              <span className="font-mono text-[10px] text-green-400 shrink-0">
                {eloSign(result.eloChange[winner.id])} ELO
              </span>
            )}
          </div>
        )}

        {loser && (
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3 shrink-0 text-white/25" />
            <span className="font-tech text-[10px] text-white/40 uppercase">
              Loser
            </span>
            <span
              className="font-tech text-[11px] font-bold ml-auto truncate max-w-[100px]"
              style={{ color: loserColor }}
            >
              {loser.name}
            </span>
            {result.eloChange?.[loser.id] != null && (
              <span className="font-mono text-[10px] text-red-400 shrink-0">
                {eloSign(result.eloChange[loser.id])} ELO
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1.5 border-t border-white/6">
          {result.rounds != null && (
            <div className="text-center">
              <div className="font-display text-sm font-bold text-white/80">
                {result.rounds}
              </div>
              <div className="font-tech text-[8px] uppercase text-white/30">
                Rounds
              </div>
            </div>
          )}
          {Array.isArray(result.log) && (
            <div className="text-center">
              <div className="font-display text-sm font-bold text-white/80">
                {result.log.length}
              </div>
              <div className="font-tech text-[8px] uppercase text-white/30">
                Actions
              </div>
            </div>
          )}
          <div className="text-center">
            <div className="font-display text-sm font-bold text-white/80">
              {battle.status}
            </div>
            <div className="font-tech text-[8px] uppercase text-white/30">
              Status
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-white/6 bg-white/[0.02]">
        {zgLink ? (
          <a
            href={zgLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[9px] font-mono text-white/35 hover:text-neon-cyan transition"
          >
            <ExternalLink className="h-2.5 w-2.5" />
            View on 0G
          </a>
        ) : (
          <span className="text-[9px] font-mono text-white/20">
            Stored on 0G
          </span>
        )}
        <button
          type="button"
          onClick={onShareMoment}
          disabled={!onShareMoment}
          title="Share this battle as a Kult Moment"
          className={`ml-auto flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-tech uppercase tracking-wider transition ${
            onShareMoment
              ? "border-[#9a35ff]/40 bg-[#9a35ff]/12 text-[#d6acff] hover:bg-[#9a35ff]/22"
              : "border-white/10 bg-white/5 text-white/30 cursor-not-allowed"
          }`}
        >
          <Share2 className="h-2.5 w-2.5" />
          Kult Moment
        </button>
      </div>
    </div>
  );
}

/** Individual chat message row */
function ChatBubble({
  msg,
  onShareMoment,
}: {
  msg: ChatMsg;
  onShareMoment?: () => void;
}) {
  const time = msg.ts.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (msg.kind === "result") {
    return (
      <div className="py-1">
        <ResultCard
          result={msg.result}
          battle={msg.battle}
          myAgentId={msg.myAgentId}
          myAgent={msg.myAgent}
          opponent={msg.opponent}
          onShareMoment={onShareMoment}
        />
      </div>
    );
  }

  if (msg.kind === "system") {
    return (
      <div className="px-3 py-1">
        <span className="text-[10px] text-white/30 italic font-mono">
          {msg.text}
        </span>
      </div>
    );
  }

  return (
    <div className="px-3 py-1 hover:bg-white/[0.025] transition">
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span
          className="font-tech text-[10px] font-bold shrink-0"
          style={{ color: msg.color }}
        >
          {msg.agentName}
        </span>
        <span className="font-mono text-[8px] text-white/20 shrink-0">
          {time}
        </span>
      </div>
      <p className="text-[11px] text-white/75 leading-snug mt-0.5 break-words">
        {msg.text}
      </p>
    </div>
  );
}

/** Right-side live chat panel */
function GameChatPanel({
  messages,
  chatInput,
  onInputChange,
  onSend,
  chatEndRef,
  myAgent,
  observerCount,
  onShareMoment,
}: {
  messages: ChatMsg[];
  chatInput: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  chatEndRef: React.RefObject<HTMLDivElement>;
  myAgent: AiArenaAgent | null;
  observerCount: number;
  onShareMoment?: () => void;
}) {
  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex w-[280px] sm:w-[300px] lg:w-[320px] shrink-0 flex-col border-l border-white/8 bg-[#04080f]/90">
      <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2.5">
        <MessageSquare className="h-3.5 w-3.5 text-primary/70" />
        <span className="font-tech text-[10px] uppercase tracking-widest text-white/60 font-bold">
          LIVE CHAT
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="font-mono text-[9px] text-white/30">
            {observerCount} watching
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} msg={msg} onShareMoment={onShareMoment} />
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="border-t border-white/8 p-2">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 focus-within:border-primary/40 transition">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder={
              myAgent ? `Chat as ${myAgent.name}…` : "Send a message…"
            }
            maxLength={200}
            className="flex-1 min-w-0 bg-transparent text-[11px] text-white/80 placeholder:text-white/25 outline-none"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!chatInput.trim()}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/20 text-primary hover:bg-primary/35 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <Send className="h-3 w-3" />
          </button>
        </div>
        <p className="mt-1 text-center font-mono text-[8px] text-white/15">
          Enter to send · observers can chat
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Battle Result Overlay — shown when Unity fires arenaBattleEnd
// ─────────────────────────────────────────────────────────────────────────────

function BattleResultOverlay({
  result,
  commentary,
  storageHashes,
  onHome,
  onShareMoment,
}: {
  result: UnityBattleResult;
  commentary?: string | null;
  storageHashes?: string[];
  onHome: () => void;
  onShareMoment?: () => void;
}) {
  const winnerColor = clanColor(result.winnerClan);
  const loserColor  = clanColor(result.loserClan);

  const durationMin = Math.floor(result.durationSeconds / 60);
  const durationSec = result.durationSeconds % 60;
  const durationStr = `${String(durationMin).padStart(2, "0")}:${String(durationSec).padStart(2, "0")}`;

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: "rgba(3,7,16,0.90)", backdropFilter: "blur(10px)" }}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.85)]"
        style={{ background: "rgba(8,12,24,0.97)" }}
      >
        {/* ── Header ── */}
        <div
          className="relative px-8 pt-8 pb-5 text-center overflow-hidden"
          style={{
            background: result.myAgentWon
              ? `linear-gradient(135deg, ${winnerColor}20 0%, transparent 60%)`
              : "linear-gradient(135deg, rgba(239,68,68,0.10) 0%, transparent 60%)",
          }}
        >
          {/* top accent line */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background: result.myAgentWon
                ? `linear-gradient(90deg, transparent, ${winnerColor}, transparent)`
                : "linear-gradient(90deg, transparent, #ef4444, transparent)",
            }}
          />

          <div
            className="font-display text-5xl font-black tracking-[0.08em]"
            style={{
              color: result.myAgentWon ? winnerColor : "#ef4444",
              textShadow: `0 0 40px ${result.myAgentWon ? winnerColor : "#ef4444"}88`,
            }}
          >
            {result.myAgentWon ? "VICTORY" : "DEFEAT"}
          </div>

          <div className="flex items-center justify-center gap-3 mt-3">
            <span
              className="rounded-full border px-3 py-0.5 font-tech text-[9px] uppercase tracking-widest"
              style={{
                borderColor: result.myAgentWon ? `${winnerColor}50` : "rgba(239,68,68,0.4)",
                color: result.myAgentWon ? winnerColor : "#f87171",
                background: result.myAgentWon ? `${winnerColor}12` : "rgba(239,68,68,0.08)",
              }}
            >
              {result.endReason === "timeout" ? "⏱ Timeout" : "💀 KO"}
            </span>
            <span className="font-mono text-[10px] text-white/25">{durationStr}</span>
          </div>
        </div>

        {/* ── Fighter Cards ── */}
        <div className="grid grid-cols-2 gap-3 px-6 py-4">
          {/* Winner */}
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: `${winnerColor}35`, background: `${winnerColor}09` }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <Crown className="h-3 w-3 text-yellow-400 shrink-0" />
              <span className="font-tech text-[9px] uppercase tracking-widest text-white/40">
                Winner
              </span>
            </div>
            <div
              className="font-display text-sm font-bold leading-tight truncate"
              style={{ color: winnerColor }}
            >
              {result.winnerName}
            </div>
            <div className="font-tech text-[9px] text-white/35 uppercase tracking-wider mt-0.5">
              {result.winnerArchetype}
            </div>
            {result.winnerClan && (
              <div
                className="font-tech text-[8px] uppercase tracking-widest mt-1"
                style={{ color: winnerColor }}
              >
                {result.winnerClan}
              </div>
            )}
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between font-mono text-[9px]">
                <span className="text-white/30">HP</span>
                <span style={{ color: winnerColor }}>{result.winnerHpPercent}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden bg-white/8">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${result.winnerHpPercent}%`, background: winnerColor }}
                />
              </div>
              <div className="font-mono text-[9px] text-white/25 text-right">
                {result.winnerElo.toLocaleString()} ELO
              </div>
            </div>
          </div>

          {/* Loser */}
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <Shield className="h-3 w-3 text-white/20 shrink-0" />
              <span className="font-tech text-[9px] uppercase tracking-widest text-white/40">
                Loser
              </span>
            </div>
            <div className="font-display text-sm font-bold leading-tight truncate text-white/45">
              {result.loserName}
            </div>
            <div className="font-tech text-[9px] text-white/25 uppercase tracking-wider mt-0.5">
              {result.loserArchetype}
            </div>
            {result.loserClan && (
              <div
                className="font-tech text-[8px] uppercase tracking-widest mt-1"
                style={{ color: `${loserColor}60` }}
              >
                {result.loserClan}
              </div>
            )}
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between font-mono text-[9px]">
                <span className="text-white/30">HP</span>
                <span className="text-white/30">{result.loserHpPercent}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden bg-white/8">
                <div
                  className="h-full rounded-full bg-white/20"
                  style={{ width: `${result.loserHpPercent}%` }}
                />
              </div>
              <div className="font-mono text-[9px] text-white/25 text-right">
                {result.loserElo.toLocaleString()} ELO
              </div>
            </div>
          </div>
        </div>

        {/* ── 0G Compute Commentary ── */}
        {commentary && (
          <div className="mx-6 mb-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <MessageSquare className="h-3 w-3 text-primary/60 shrink-0" />
              <span className="font-tech text-[9px] uppercase tracking-widest text-white/35">
                0G Compute · AI Commentator
              </span>
            </div>
            <p className="font-mono text-[10px] leading-relaxed text-white/60 italic">
              "{commentary}"
            </p>
            {storageHashes && storageHashes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {storageHashes.map((h) => (
                  <a
                    key={h}
                    href={`https://storagescan.0g.ai/tx/${h}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-lg border border-white/6 bg-white/[0.03] px-2 py-0.5 font-mono text-[8px] text-white/25 hover:text-primary/60 transition"
                  >
                    <ExternalLink className="h-2 w-2 shrink-0" />
                    {h.slice(0, 8)}…{h.slice(-4)}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Loading commentary indicator (while waiting for 0G Compute) ── */}
        {!commentary && (
          <div className="mx-6 mb-3 flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin text-white/15 shrink-0" />
            <span className="font-tech text-[9px] text-white/20 uppercase tracking-widest">
              AI commentator generating…
            </span>
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div className="flex flex-col gap-2.5 px-6 pb-7">
          <button
            type="button"
            onClick={onShareMoment}
            disabled={!onShareMoment}
            className={`flex w-full items-center justify-center gap-2.5 rounded-2xl border py-3.5 font-tech text-[11px] uppercase tracking-widest transition ${
              onShareMoment
                ? "border-[#9a35ff]/45 bg-[#9a35ff]/15 text-white hover:bg-[#9a35ff]/25 hover:border-[#9a35ff]/60"
                : "border-white/8 bg-white/[0.04] text-white/25 cursor-not-allowed"
            }`}
          >
            <Share2 className="h-4 w-4" />
            Share with Kult Moments
          </button>

          {/* Home Page */}
          <button
            type="button"
            onClick={onHome}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/15 bg-white/[0.06] py-3.5 font-tech text-[11px] uppercase tracking-widest text-white/65 hover:bg-white/10 hover:text-white hover:border-white/25 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Home Page
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ArenaGamePage() {
  const { battleId } = useParams<{ battleId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const myAgentId = searchParams.get("myAgentId");
  const opponentIdParam = searchParams.get("opponentId");
  const mode = searchParams.get("mode") ?? "RANKED";

  // ── State ────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: uid(),
      kind: "system",
      text: "Arena lobby opened. Loading battle…",
      ts: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [gamePhase, setGamePhase] = useState<GamePhase>("live");
  const [observerCount] = useState(() => Math.floor(Math.random() * 80) + 12);

  // Unity loading state
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [unityLoaded, setUnityLoaded] = useState(false);
  const [unityLoadError, setUnityLoadError] = useState<string | null>(null);

  // Battle result — populated when Unity fires arenaBattleEnd CustomEvent
  const [battleResult, setBattleResult] = useState<UnityBattleResult | null>(null);
  // 0G Compute commentary — generated after battle ends
  const [battleCommentary, setBattleCommentary] = useState<string | null>(null);
  // 0G Storage root hashes from memory-service
  const [memoryRootHashes, setMemoryRootHashes] = useState<string[]>([]);

  // Pre-match overlay — shown when Unity fires arenaMultiplayerStart
  const [preMatchData, setPreMatchData] = useState<{
    mapId: string;
    myAgentName: string;
    opponentName: string;
  } | null>(null);
  const [preMatchCountdown, setPreMatchCountdown] = useState(0);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const unityInstanceRef = useRef<any>(null);
  const unityLoadingRef = useRef(false); // guard against double-load
  const prevStatusRef = useRef<string | null>(null);
  const resultPostedRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Queries ──────────────────────────────────────────────────────────────

  const battleQ = useQuery({
    queryKey: ["arenaGame", "battle", battleId],
    queryFn: () => aiArenaGatewayApi.getBattle(battleId!),
    enabled: !!battleId,
    refetchInterval: (q) => {
      const s = q.state.data?.battle?.status;
      if (!s || s === "PENDING" || s === "INITIALIZING" || s === "IN_PROGRESS")
        return 2_000;
      return false;
    },
    staleTime: 500,
    retry: 2,
  });

  const myAgentQ = useQuery({
    queryKey: ["arenaGame", "myAgent", myAgentId],
    queryFn: () => aiArenaGatewayApi.getAgentById(myAgentId!),
    enabled: !!myAgentId,
    staleTime: 60_000,
    retry: 1,
  });

  const battle = battleQ.data?.battle;

  const resolvedOpponentId =
    opponentIdParam ?? battle?.agentIds?.find((id) => id !== myAgentId) ?? null;

  const opponentQ = useQuery({
    queryKey: ["arenaGame", "opponent", resolvedOpponentId],
    queryFn: () => aiArenaGatewayApi.getAgentById(resolvedOpponentId!),
    enabled: !!resolvedOpponentId,
    staleTime: 60_000,
    retry: 1,
  });

  const myAgent = myAgentQ.data ?? null;
  const opponent = opponentQ.data ?? null;

  // ── Unity loading ─────────────────────────────────────────────────────────

  /**
   * Diagnose R2 CORS setup before handing off to Unity.
   *
   * Returns:
   *   'ok'          – CORS headers present, files accessible
   *   'cors'        – file exists but no CORS headers (R2 bucket not configured)
   *   'not-found'   – file not reachable at all (wrong URL / private bucket)
   */
  const diagnoseBuildFiles = async (buildUrl: string): Promise<'ok' | 'cors' | 'not-found'> => {
    const testUrl = `${buildUrl}/WarzoneV4.data`;
    try {
      // First try with strict CORS — what Unity will actually do
      const res = await fetch(testUrl, { method: 'HEAD', mode: 'cors', cache: 'no-store' });
      if (res.ok || res.status === 206) return 'ok';
      return 'not-found';
    } catch (_corsErr) {
      // CORS blocked — confirm the file actually exists with no-cors (opaque response)
      try {
        await fetch(testUrl, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' });
        // Got here = file exists but R2 didn't send Access-Control-Allow-Origin
        return 'cors';
      } catch (_netErr) {
        return 'not-found';
      }
    }
  };

  /**
   * Banner function passed to Unity — surfaces Unity-internal warnings/errors
   * as console logs and toast notifications.
   */
  const unityShowBanner = (msg: string, type: 'error' | 'warning' | string) => {
    console.log(`[Unity ${type}]`, msg);
    if (type === 'error') {
      toast.error(`Unity: ${msg}`, { duration: 8000 });
    } else if (type === 'warning') {
      console.warn('[Unity warning]', msg);
    }
  };

  // Load Unity once both agents are resolved (so we can write full data to localStorage)
  useEffect(() => {
    if (!battleId || !UNITY_BASE_URL) return;
    if (myAgentQ.isLoading || opponentQ.isLoading) return;   // wait for agent data
    if (unityLoadingRef.current || !canvasRef.current) return;

    unityLoadingRef.current = true;

    // ── Store all battle/agent data in localStorage so Unity can read it ──
    // (same pattern ZeroDash uses for JWT: localStorage → SendMessage after load)
    const arenaPayload = {
      battleId,
      myAgentId:         myAgentId ?? '',
      myAgentName:       myAgent?.name ?? '',
      myAgentArchetype:  myAgent?.archetype ?? '',
      myAgentElo:        myAgent?.eloRating ?? 1000,
      myAgentClan:       myAgent?.clan ?? '',
      opponentId:        resolvedOpponentId ?? '',
      opponentName:      opponent?.name ?? '',
      opponentArchetype: opponent?.archetype ?? '',
      opponentElo:       opponent?.eloRating ?? 1000,
      opponentClan:      opponent?.clan ?? '',
      mode,
    };
    localStorage.setItem('arenaBattlePayload', JSON.stringify(arenaPayload));

    const buildUrl = `${UNITY_BASE_URL}/Arena1`;

    const script = document.createElement("script");
    script.src = `${buildUrl}/WarzoneV4.loader.js`;

    script.onload = async () => {
      // Guard — loader might fire after unmount
      if (!canvasRef.current) return;

      if (typeof (window as any).createUnityInstance !== 'function') {
        console.error("[Arena] createUnityInstance not found after loader script");
        toast.error("Game loader failed. Please refresh.");
        unityLoadingRef.current = false;
        return;
      }

      // ── CORS preflight — diagnose R2 bucket BEFORE handing off to Unity ──
      const diagnosis = await diagnoseBuildFiles(buildUrl);
      if (diagnosis === 'cors') {
        const msg =
          "R2 CORS not configured. Fix: Cloudflare R2 dashboard → your bucket → " +
          "Settings → CORS Policy → add rule: AllowedOrigins=[\"*\"], " +
          "AllowedMethods=[\"GET\",\"HEAD\"], MaxAgeSeconds=86400";
        console.error("[Arena]", msg);
        setUnityLoadError('cors');
        unityLoadingRef.current = false;
        return;
      }
      if (diagnosis === 'not-found') {
        console.error("[Arena] Build files not reachable at:", buildUrl);
        setUnityLoadError('not-found');
        unityLoadingRef.current = false;
        return;
      }

      // ── Stuck-at-0% watchdog — fires if CORS slips past the preflight ──
      const stuckTimer = setTimeout(() => {
        if (!unityInstanceRef.current) {
          console.error(
            "[Arena] Unity stuck at 0% — CORS issue on R2.\n" +
            "Open DevTools → Network tab and look for blocked requests to r2.dev"
          );
          setUnityLoadError('cors');
        }
      }, 18_000);

      try {
        const instance = await (window as any).createUnityInstance(
          canvasRef.current,
          {
            arguments: [],
            dataUrl:       `${buildUrl}/WarzoneV4.data`,
            frameworkUrl:  `${buildUrl}/WarzoneV4.framework.js`,
            codeUrl:       `${buildUrl}/WarzoneV4.wasm`,
            streamingAssetsUrl: "StreamingAssets",
            companyName:   "Kult Games",
            productName:   "WarzoneV4",
            productVersion: "1.0",
            // ── Critical: prevents Unity from resizing the canvas
            //    (omitting this causes the 0% stuck bug)
            matchWebGLToCanvasSize: false,
            devicePixelRatio: 1,
            showBanner: unityShowBanner,
          },
          (progress: number) => {
            setLoadingProgress(Math.round(progress * 100));
          }
        );

        clearTimeout(stuckTimer);
        unityInstanceRef.current = instance;
        setUnityLoaded(true);

        // Send battle data to Unity after 1500ms delay
        // (same pattern as ZeroDash: give Unity time to finish internal boot)
        setTimeout(() => {
          try {
            instance.SendMessage("GameManager", "SetBattleId", battleId ?? '');
            console.log("[Arena] ✅ battleId sent to Unity");
          } catch (err) {
            console.warn("[Arena] SendMessage failed (Unity may not have GameManager):", err);
          }
        }, 1500);

      } catch (err) {
        clearTimeout(stuckTimer);
        console.error("[Arena] createUnityInstance failed:", err);
        toast.error("Failed to load game. Please refresh.");
        unityLoadingRef.current = false;
      }
    };

    script.onerror = () => {
      console.error("[Arena] Failed to load loader from:", script.src);
      toast.error("Game assets unavailable. Check your connection.");
      unityLoadingRef.current = false;
    };

    document.body.appendChild(script);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleId, myAgentQ.isLoading, opponentQ.isLoading]);
  // ↑ intentionally omit myAgent/opponent — the guard ref means this only runs once,
  //   but we read the latest values at execution time via the closure.

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unityInstanceRef.current) {
        unityInstanceRef.current.Quit?.().catch(() => {});
        unityInstanceRef.current = null;
      }
      localStorage.removeItem('arenaBattlePayload');
    };
  }, []);

  // Listen for Unity's battle-end CustomEvent ("arenaBattleEnd")
  // When received:
  //   1. Show result popup immediately
  //   2. POST /v1/battles/:id/end  (official result with playerStats)
  //   3. POST /v1/inference/battle-commentary  (0G Compute AI commentator)
  //   4. POST /v1/memory/:agentId/memory/episode  (store to 0G Storage for winner + loser)
  useEffect(() => {
    const handler = async (e: Event) => {
      const detail = (e as CustomEvent<UnityBattleResult>).detail;
      if (!detail || typeof detail !== "object") return;

      // 1. Show popup immediately — don't gate on API calls.
      setBattleResult(detail);
      setGamePhase("ended");

      const bid = detail.battleId;
      if (!bid) {
        console.warn("[Arena] arenaBattleEnd — no battleId in payload, skipping API calls.");
        return;
      }

      // 2. Official result submission (ELO computed server-side, archived to 0G DA)
      try {
        await aiArenaGatewayApi.endBattle(bid, {
          winnerId:    detail.winnerId,
          loserId:     detail.loserId,
          playerStats: detail.playerStats,
        });
        console.log("[Arena] ✅ endBattle submitted for:", bid);
      } catch (err) {
        console.warn("[Arena] endBattle API failed (may already be ended):", err);
      }

      // ── Trait evolution + training (fire-and-forget, parallel) ──────────────
      // These run async after the popup is visible. No await needed.
      // Unity reads the updated traits on the NEXT match load via GET /v1/agents/:id.
      const winnerStats = detail.playerStats?.[detail.winnerId];
      const loserStats  = detail.playerStats?.[detail.loserId];

      void (async () => {
        try {
          // Evolve winner traits
          if (detail.winnerId && winnerStats) {
            await aiArenaGatewayApi.evolveAgentTraits(detail.winnerId, {
              outcome:         "WIN",
              jumps:           winnerStats.jumps,
              shotsAttempted:  winnerStats.shotsAttempted,
              shotsConnected:  winnerStats.shotsConnected,
              timesHit:        winnerStats.timesHit,
              distanceCovered: winnerStats.distanceCovered,
              durationSeconds: detail.durationSeconds,
            });
            console.log("[Arena] ✅ Winner traits evolved:", detail.winnerId);
          }
          // Evolve loser traits
          if (detail.loserId && loserStats) {
            await aiArenaGatewayApi.evolveAgentTraits(detail.loserId, {
              outcome:         "LOSS",
              jumps:           loserStats.jumps,
              shotsAttempted:  loserStats.shotsAttempted,
              shotsConnected:  loserStats.shotsConnected,
              timesHit:        loserStats.timesHit,
              distanceCovered: loserStats.distanceCovered,
              durationSeconds: detail.durationSeconds,
            });
            console.log("[Arena] ✅ Loser traits evolved:", detail.loserId);
          }
        } catch (err) {
          console.warn("[Arena] Trait evolution failed (non-fatal):", err);
        }
      })();

      // Trigger LoRA training for both agents from this battle's data
      void (async () => {
        try {
          if (detail.winnerId && winnerStats) {
            await aiArenaGatewayApi.triggerTrainingFromBattle(detail.winnerId, {
              ...winnerStats,
              outcome:         "WIN",
              durationSeconds: detail.durationSeconds,
            });
            console.log("[Arena] ✅ Training job queued for winner:", detail.winnerId);
          }
          if (detail.loserId && loserStats) {
            await aiArenaGatewayApi.triggerTrainingFromBattle(detail.loserId, {
              ...loserStats,
              outcome:         "LOSS",
              durationSeconds: detail.durationSeconds,
            });
            console.log("[Arena] ✅ Training job queued for loser:", detail.loserId);
          }
        } catch (err) {
          console.warn("[Arena] Training trigger failed (non-fatal):", err);
        }
      })();

      // 3. 0G Compute commentary — ask the AI commentator for a paragraph
      let commentary = "";
      try {
        const commentaryRes = await aiArenaGatewayApi.generateBattleCommentary({
          battleId:        bid,
          winnerName:      detail.winnerName,
          winnerArchetype: detail.winnerArchetype,
          winnerClan:      detail.winnerClan,
          winnerElo:       detail.winnerElo,
          winnerHpPercent: detail.winnerHpPercent,
          loserName:       detail.loserName,
          loserArchetype:  detail.loserArchetype,
          loserClan:       detail.loserClan,
          loserElo:        detail.loserElo,
          loserHpPercent:  detail.loserHpPercent,
          durationSeconds: detail.durationSeconds,
          endReason:       detail.endReason,
          playerStats:     detail.playerStats,
        });
        commentary = commentaryRes.commentary ?? "";
        if (commentary) {
          setBattleCommentary(commentary);
          console.log("[Arena] ✅ 0G Compute commentary generated:", commentary.slice(0, 60), "…");
        }
      } catch (err) {
        console.warn("[Arena] Commentary generation failed:", err);
      }

      // 4. Store battle memory for winner + loser on 0G Storage via memory-service
      const memContent = commentary ||
        `${detail.winnerName} defeated ${detail.loserName} in a ${detail.durationSeconds}s clash (${detail.endReason}).`;

      const hashes: string[] = [];

      // Winner memory
      if (detail.winnerId) {
        try {
          const winRes = await aiArenaGatewayApi.storeBattleMemory(detail.winnerId, {
            battleId: bid,
            outcome:  "WIN",
            content:  memContent,
          });
          if (winRes.snapshotRootHash) {
            hashes.push(winRes.snapshotRootHash);
            console.log("[Arena] ✅ Winner memory stored, 0G hash:", winRes.snapshotRootHash);
          }
        } catch (err) {
          console.warn("[Arena] Winner memory storage failed:", err);
        }
      }

      // Loser memory
      if (detail.loserId) {
        try {
          const loseRes = await aiArenaGatewayApi.storeBattleMemory(detail.loserId, {
            battleId: bid,
            outcome:  "LOSS",
            content:  memContent,
          });
          if (loseRes.snapshotRootHash) {
            hashes.push(loseRes.snapshotRootHash);
            console.log("[Arena] ✅ Loser memory stored, 0G hash:", loseRes.snapshotRootHash);
          }
        } catch (err) {
          console.warn("[Arena] Loser memory storage failed:", err);
        }
      }

      if (hashes.length) setMemoryRootHashes(hashes);
    };

    window.addEventListener("arenaBattleEnd", handler);
    return () => window.removeEventListener("arenaBattleEnd", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pre-match overlay: listen for Unity's arenaMultiplayerStart event ─────
  useEffect(() => {
    const MAP_DURATIONS: Record<string, number> = { "1": 10, "2": 15, "3": 17 };

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        mapId?: string;
        myAgentName?: string;
        opponentName?: string;
      };
      const mapId = (detail?.mapId ?? "1").charAt(0);
      const duration = MAP_DURATIONS[mapId] ?? 10;
      setPreMatchData({
        mapId,
        myAgentName: detail?.myAgentName ?? "",
        opponentName: detail?.opponentName ?? "",
      });
      setPreMatchCountdown(duration);
    };

    window.addEventListener("arenaMultiplayerStart", handler);
    return () => window.removeEventListener("arenaMultiplayerStart", handler);
  }, []);

  // Countdown tick — each second, decrement; at 0, hide the overlay
  useEffect(() => {
    if (preMatchCountdown <= 0 || !preMatchData) return;
    const t = setTimeout(() => {
      setPreMatchCountdown((c) => {
        if (c <= 1) { setPreMatchData(null); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [preMatchCountdown, preMatchData]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const addSystem = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: uid(), kind: "system" as const, text, ts: new Date() },
    ]);
  }, []);

  const navigateToTrashTalkMoment = useCallback(() => {
    if (!battleId || !myAgentId) return;
    navigate(buildTrashTalkMomentPath(battleId, myAgentId));
  }, [battleId, myAgentId, navigate]);

  const addResult = useCallback(
    (result: AiArenaBattleResult, b: AiArenaBattle) => {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          kind: "result" as const,
          result,
          battle: b,
          myAgentId,
          myAgent,
          opponent,
          ts: new Date(),
        },
      ]);
    },
    [myAgentId, myAgent, opponent]
  );

  // ── Battle status transitions ─────────────────────────────────────────────

  useEffect(() => {
    const status = battle?.status ?? null;
    if (status === prevStatusRef.current) return;
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (!status) return;

    if ((status === "PENDING" || status === "INITIALIZING") && prev === null) {
      addSystem("⏳  Battle created — arena loading…");
    }

    if (status === "IN_PROGRESS" && prev !== "IN_PROGRESS") {
      addSystem("⚔️  Battle is LIVE! Agents are fighting.");
    }

    if (status === "COMPLETED" && battle?.result && !resultPostedRef.current) {
      resultPostedRef.current = true;
      setGamePhase("ended");
      addSystem("🏁  Battle concluded. Final results below.");
      addResult(battle.result, battle);
    }

    if (status === "CANCELLED") {
      setGamePhase("ended");
      addSystem("❌  Battle was cancelled.");
    }

    if (status === "DISPUTED") {
      setGamePhase("ended");
      addSystem("⚠️  Battle result is disputed — under review.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle?.status]);

  // ── Auto-scroll chat ──────────────────────────────────────────────────────

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const isError = battleQ.isError;
  const isLoading = battleQ.isLoading && !battle;

  const isBattleComplete = Boolean(
    (battle?.status === "COMPLETED" && battle?.result) || battleResult,
  );
  const canShareMoment = Boolean(battleId && myAgentId && isBattleComplete);
  const shareMomentHandler = canShareMoment ? navigateToTrashTalkMoment : undefined;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-[#030710] text-white overflow-hidden">

      {/* ── Top Nav ───────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/8 bg-[#04080f]/95 px-3 sm:px-5 py-2 backdrop-blur z-30">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1.5 font-tech text-[9px] uppercase tracking-widest text-white/45 hover:text-white hover:border-white/20 transition"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-white/25 hidden sm:block">
            BATTLE
          </span>
          <span className="font-mono text-[10px] text-white/50">
            {shortId(battleId)}
          </span>

          {gamePhase === "live" && (
            <span className="flex items-center gap-1 rounded-full border border-red-400/40 bg-red-500/15 px-2 py-0.5 font-tech text-[8px] uppercase tracking-wider text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
              LIVE
            </span>
          )}
          {gamePhase === "ended" && (
            <span className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 font-tech text-[8px] uppercase tracking-wider text-white/40">
              ENDED
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-tech text-[9px] uppercase tracking-widest text-white/30">
            {mode}
          </span>
          {canShareMoment ? (
            <button
              type="button"
              onClick={navigateToTrashTalkMoment}
              className="flex items-center gap-1.5 rounded-lg border border-[#9a35ff]/40 bg-[#9a35ff]/12 px-2.5 py-1 font-tech text-[8px] uppercase tracking-wider text-[#d6acff] hover:bg-[#9a35ff]/22 transition"
              title="Share as Kult Moment"
            >
              <Share2 className="h-3 w-3" />
              Kult Moment
            </button>
          ) : null}
          {battleQ.isFetching && (
            <Loader2 className="h-3 w-3 animate-spin text-white/25" />
          )}
        </div>
      </div>

      {/* ── Agent VS Banner ───────────────────────────────────────────────── */}
      <AgentBanner
        myAgent={myAgent}
        opponent={opponent}
        battle={battle}
        gamePhase={gamePhase}
        mode={mode}
      />

      {/* ── Main: Canvas + Chat ───────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* Canvas area */}
        <div className="relative min-h-0 flex-1 bg-[#040810] overflow-hidden">

          {/* Error state — centred */}
          {isError && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="font-tech text-sm text-red-400/80 mb-2">
                  Failed to load battle
                </div>
                <button
                  onClick={() => battleQ.refetch()}
                  className="font-tech text-xs text-primary hover:text-primary/80 underline"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* No build URL configured — centred */}
          {!isError && !UNITY_BASE_URL && (
            <div className="flex h-full items-center justify-center px-4">
              <div className="text-center">
                <p className="font-tech text-xs text-white/40 uppercase tracking-wider">
                  Unity Build URL not configured
                </p>
                <p className="font-mono text-[9px] text-white/20 mt-1">
                  Set VITE_UNITY_BUILD_URL in .env to load the game
                </p>
                {myAgent && opponent && (
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <span className="font-tech text-[10px] font-bold" style={{ color: clanColor(myAgent.clan) }}>
                      {myAgent.name}
                    </span>
                    <Swords className="h-3 w-3 text-white/20" />
                    <span className="font-tech text-[10px] font-bold" style={{ color: clanColor(opponent.clan) }}>
                      {opponent.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Unity canvas — fills entire game area ── */}
          {!isError && UNITY_BASE_URL && (
            <div className="absolute inset-0">
              {/* Unity renders directly into this canvas; CSS fills the space,
                  width/height attrs set the render resolution */}
              <canvas
                ref={canvasRef}
                id="unity-canvas"
                width={1280}
                height={720}
                style={{ width: "100%", height: "100%", display: "block", background: "#030710" }}
              />

              {/* React loading screen (shown until Unity finishes loading) */}
              {!unityLoaded && !unityLoadError && (
                <UnityLoadingScreen
                  progress={loadingProgress}
                  myAgent={myAgent}
                  opponent={opponent}
                  mode={mode}
                />
              )}

              {/* Pre-match overlay — covers canvas while AI agents walk to centre.
                  Game is NOT paused; this is purely a cosmetic React layer. */}
              {preMatchData && unityLoaded && (
                <PreMatchOverlay
                  mapId={preMatchData.mapId}
                  myAgentName={preMatchData.myAgentName}
                  opponentName={preMatchData.opponentName}
                  countdown={preMatchCountdown}
                />
              )}

              {/* Load-error overlay — CORS or missing files */}
              {unityLoadError && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#030710]/95 p-6">
                  <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#0d0812] p-6 shadow-[0_0_60px_rgba(239,68,68,0.15)]">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">⚠️</span>
                      <span className="font-display text-base font-bold text-red-400 uppercase tracking-wider">
                        {unityLoadError === 'cors' ? 'CORS Blocked' : 'Files Not Found'}
                      </span>
                    </div>

                    {unityLoadError === 'cors' ? (
                      <>
                        <p className="font-tech text-[11px] text-white/60 leading-relaxed mb-4">
                          The game build files exist on R2 but the browser is blocking cross-origin
                          requests. You need to add a CORS rule to your Cloudflare R2 bucket.
                        </p>
                        <div className="rounded-xl border border-white/8 bg-black/40 p-4 mb-4">
                          <p className="font-mono text-[9px] text-primary/70 mb-2 uppercase tracking-wider">
                            Cloudflare R2 Dashboard → your bucket → Settings → CORS Policy
                          </p>
                          <pre className="font-mono text-[10px] text-white/70 leading-relaxed whitespace-pre-wrap">{`[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]`}</pre>
                        </div>
                        <p className="font-mono text-[9px] text-white/30">
                          After saving the CORS rule, refresh this page.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-tech text-[11px] text-white/60 leading-relaxed mb-3">
                          Build files not reachable. Check that{" "}
                          <code className="font-mono text-[10px] text-primary/80">VITE_UNITY_BUILD_URL</code>{" "}
                          points to the correct R2 folder and the bucket is public.
                        </p>
                        <p className="font-mono text-[10px] text-white/30 break-all">
                          Looking for: {UNITY_BASE_URL}/Arena1/WarzoneV4.data
                        </p>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setUnityLoadError(null);
                        unityLoadingRef.current = false;
                        window.location.reload();
                      }}
                      className="mt-4 w-full rounded-xl border border-primary/40 bg-primary/15 py-2 font-tech text-[11px] uppercase tracking-wider text-primary hover:bg-primary/25 transition"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {/* ── Battle Result Overlay — replaces "GAME OVER" ── */}
              {battleResult && (
                <BattleResultOverlay
                  result={battleResult}
                  commentary={battleCommentary}
                  storageHashes={memoryRootHashes}
                  onHome={() => navigate(-1)}
                  onShareMoment={shareMomentHandler}
                />
              )}

              {/* Bottom battle-ID hint */}
              {gamePhase === "live" && !unityLoadError && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
                  <div className="flex items-center gap-1.5 rounded-full border border-white/8 bg-black/50 px-3 py-1 backdrop-blur">
                    <Zap className="h-2.5 w-2.5 text-primary/60" />
                    <span className="font-mono text-[8px] text-white/25">
                      {unityLoaded ? `battle · ${shortId(battleId)}` : `loading · ${loadingProgress}%`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat panel */}
        <GameChatPanel
          messages={messages}
          chatInput={chatInput}
          onInputChange={setChatInput}
          onSend={() => {
            if (!chatInput.trim()) return;
            setMessages((prev) => [
              ...prev,
              {
                id: uid(),
                kind: "player" as const,
                agentId: myAgentId ?? "observer",
                agentName: myAgent?.name ?? "Observer",
                color: myAgent ? clanColor(myAgent.clan) : "#8b6dff",
                text: chatInput.trim(),
                ts: new Date(),
              },
            ]);
            setChatInput("");
          }}
          chatEndRef={chatEndRef}
          myAgent={myAgent}
          observerCount={observerCount}
          onShareMoment={shareMomentHandler}
        />
      </div>
    </div>
  );
}
