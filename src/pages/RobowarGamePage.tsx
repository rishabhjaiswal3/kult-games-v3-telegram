/**
 * RobowarGamePage — simulation battle page for Robowar (no Unity build yet).
 *
 * Shows:
 *   1. Same VS header as ArenaGamePage, fully red-themed
 *   2. "Redirecting to local game build…" screen for 120 seconds (no timer shown)
 *   3. Random battle result overlay after 120s (red-themed)
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Swords, Cpu, Trophy, Shield, Zap } from "lucide-react";
import { aiArenaGatewayApi } from "@/api/aiArenaGatewayApi";
import { getArenaAgentPortrait } from "@/constants/arenaAgentArchetypes";

// ── red palette ──────────────────────────────────────────────────────────────
const R = {
  primary:   "#dc2626",   // red-600
  bright:    "#ef4444",   // red-500
  dim:       "#991b1b",   // red-800
  glow:      "rgba(220,38,38,0.5)",
  glowSoft:  "rgba(220,38,38,0.15)",
  bg:        "#0a0202",
  card:      "rgba(20,4,4,0.95)",
  border:    "rgba(220,38,38,0.3)",
};

// ── helpers ──────────────────────────────────────────────────────────────────
function shortId(v?: string | null) {
  if (!v) return "—";
  return v.length > 14 ? `${v.slice(0, 6)}…${v.slice(-4)}` : v;
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── Agent portrait card ───────────────────────────────────────────────────────
function RoboAgentCard({
  agent,
  side,
}: {
  agent: { name: string; archetype?: string; eloRating?: number; wins?: number; losses?: number; clan?: string } | null;
  side: "left" | "right";
}) {
  const portrait = agent ? getArenaAgentPortrait(agent as any) : null;

  return (
    <div className="flex flex-col items-center gap-3" style={{ width: 160 }}>
      {/* portrait */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          width: 160, height: 200,
          border: `2px solid ${R.border}`,
          boxShadow: `0 0 40px ${R.glow}, 0 0 80px ${R.glowSoft}`,
        }}
      >
        {portrait ? (
          <img
            src={portrait}
            alt={agent?.name ?? "agent"}
            className={`h-full w-full object-cover object-top ${side === "right" ? "-scale-x-100" : ""}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ background: R.glowSoft }}>
            <Cpu className="h-12 w-12" style={{ color: R.primary }} />
          </div>
        )}
        {/* name bar */}
        <div
          className="absolute inset-x-0 bottom-0 px-3 pb-3 pt-8"
          style={{ background: `linear-gradient(to top, ${R.dim}ee 0%, transparent 100%)` }}
        >
          <div className="font-display text-sm font-black text-white truncate">{agent?.name ?? "???"}</div>
          <div className="font-tech text-[9px] uppercase tracking-widest text-white/60 mt-0.5">
            {agent?.archetype ?? "—"}
          </div>
        </div>
      </div>
      {/* stats strip */}
      <div
        className="w-full rounded-xl px-4 py-2 text-center"
        style={{ background: R.card, border: `1px solid ${R.border}` }}
      >
        <div className="font-tech text-base font-bold" style={{ color: R.bright }}>
          {agent?.eloRating?.toLocaleString() ?? "—"}
          <span className="text-[9px] text-white/30 font-normal ml-1">ELO</span>
        </div>
        <div className="flex justify-center gap-3 mt-0.5">
          <span className="font-mono text-[9px] text-white/35">{agent?.wins ?? 0}W</span>
          <span className="text-white/15">·</span>
          <span className="font-mono text-[9px] text-white/35">{agent?.losses ?? 0}L</span>
        </div>
        {agent?.clan && (
          <div className="font-tech text-[8px] uppercase tracking-wider mt-1" style={{ color: R.primary }}>
            {agent.clan}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Battle result overlay ─────────────────────────────────────────────────────
function RoboResultOverlay({
  winnerId,
  winnerName,
  winnerArchetype,
  winnerElo,
  winnerHp,
  loserId,
  loserName,
  loserArchetype,
  loserElo,
  onHome,
}: {
  winnerId: string;
  winnerName: string;
  winnerArchetype: string;
  winnerElo: number;
  winnerHp: number;
  loserId: string;
  loserName: string;
  loserArchetype: string;
  loserElo: number;
  onHome: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-50 flex flex-col overflow-y-auto"
      style={{ background: R.bg }}
    >
      {/* Red glow top */}
      <div className="absolute inset-x-0 top-0 h-64 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, ${R.glow} 0%, transparent 70%)` }} />

      <div className="relative z-10 flex flex-col items-center gap-6 px-4 py-10 min-h-full">

        {/* Result badge */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="font-display text-6xl font-black tracking-widest"
            style={{ color: R.bright, textShadow: `0 0 60px ${R.glow}, 0 0 120px ${R.glowSoft}` }}
          >
            BATTLE END
          </div>
          <div
            className="font-tech text-[10px] uppercase tracking-[0.4em] px-4 py-1 rounded-full"
            style={{ color: R.bright, background: R.glowSoft, border: `1px solid ${R.border}` }}
          >
            Robowar · Simulation Complete
          </div>
        </div>

        {/* Winner / Loser cards */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {/* Winner */}
          <div
            className="rounded-2xl p-4"
            style={{ background: `linear-gradient(135deg, ${R.glowSoft}, rgba(0,0,0,0.6))`, border: `1px solid ${R.primary}` }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <Trophy className="h-3.5 w-3.5" style={{ color: R.bright }} />
              <span className="font-tech text-[9px] uppercase tracking-widest" style={{ color: R.bright }}>Winner</span>
            </div>
            <div className="font-display text-lg font-black text-white">{winnerName}</div>
            <div className="font-tech text-[9px] text-white/50 uppercase tracking-wider mt-0.5">{winnerArchetype}</div>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between font-mono text-[9px]">
                <span className="text-white/40">HP remaining</span>
                <span style={{ color: R.bright }}>{winnerHp}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full" style={{ width: `${winnerHp}%`, background: `linear-gradient(to right, ${R.dim}, ${R.bright})` }} />
              </div>
              <div className="font-mono text-[9px] text-white/25 text-right">{winnerElo.toLocaleString()} ELO</div>
            </div>
          </div>

          {/* Loser */}
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <Shield className="h-3 w-3 text-white/20" />
              <span className="font-tech text-[9px] uppercase tracking-widest text-white/40">Loser</span>
            </div>
            <div className="font-display text-sm font-bold text-white/40">{loserName}</div>
            <div className="font-tech text-[9px] text-white/25 uppercase tracking-wider mt-0.5">{loserArchetype}</div>
            <div className="mt-3">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="h-full w-0 rounded-full bg-white/15" />
              </div>
              <div className="font-mono text-[9px] text-white/20 text-right mt-1">{loserElo.toLocaleString()} ELO</div>
            </div>
          </div>
        </div>

        {/* Note */}
        <p className="font-mono text-[10px] text-white/30 text-center max-w-xs leading-relaxed">
          Result generated by Robowar simulation engine.
          Full on-chain integration coming soon.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onHome}
            className="rounded-xl px-6 py-3 font-tech text-xs uppercase tracking-widest text-white transition hover:opacity-80"
            style={{ background: R.primary, boxShadow: `0 0 24px ${R.glow}` }}
          >
            Back to Arena
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RobowarGamePage() {
  const { battleId } = useParams<{ battleId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const myAgentId      = searchParams.get("myAgentId");
  const opponentIdParam = searchParams.get("opponentId");
  const mode           = searchParams.get("mode") ?? "RANKED";

  // Agent queries
  const myAgentQ = useQuery({
    queryKey: ["robowar", "myAgent", myAgentId],
    queryFn:  () => aiArenaGatewayApi.getAgentById(myAgentId!),
    enabled:  !!myAgentId,
    staleTime: 60_000,
    retry: 1,
  });

  const opponentQ = useQuery({
    queryKey: ["robowar", "opponent", opponentIdParam],
    queryFn:  () => aiArenaGatewayApi.getAgentById(opponentIdParam!),
    enabled:  !!opponentIdParam,
    staleTime: 60_000,
    retry: 1,
  });

  const myAgent  = myAgentQ.data  ?? null;
  const opponent = opponentQ.data ?? null;

  // Simulation state
  const [phase, setPhase] = useState<"redirect" | "running" | "result">("redirect");
  const [progress, setProgress] = useState(0); // 0-100 over 120s
  const [result, setResult] = useState<{
    winnerId: string; winnerName: string; winnerArchetype: string; winnerElo: number; winnerHp: number;
    loserId: string;  loserName: string;  loserArchetype: string;  loserElo: number;
  } | null>(null);

  const startTimeRef = useRef<number | null>(null);
  const rafRef       = useRef<number | null>(null);
  const SIM_DURATION = 120_000; // 120 seconds

  const generateResult = useCallback(() => {
    const myWins = Math.random() > 0.5;
    const winner = myWins ? myAgent : opponent;
    const loser  = myWins ? opponent : myAgent;
    setResult({
      winnerId:        winner?.id        ?? "agent-a",
      winnerName:      winner?.name      ?? "Robo-A",
      winnerArchetype: winner?.archetype ?? "—",
      winnerElo:       winner?.eloRating ?? 1000,
      winnerHp:        rand(12, 72),
      loserId:         loser?.id         ?? "agent-b",
      loserName:       loser?.name       ?? "Robo-B",
      loserArchetype:  loser?.archetype  ?? "—",
      loserElo:        loser?.eloRating  ?? 1000,
    });
    setPhase("result");
  }, [myAgent, opponent]);

  // Redirect message for 3s, then start the 120s simulation
  useEffect(() => {
    const t = setTimeout(() => setPhase("running"), 3_000);
    return () => clearTimeout(t);
  }, []);

  // Progress animation over 120s
  useEffect(() => {
    if (phase !== "running") return;

    startTimeRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - (startTimeRef.current ?? now);
      const pct = Math.min((elapsed / SIM_DURATION) * 100, 100);
      setProgress(pct);
      if (elapsed >= SIM_DURATION) {
        generateResult();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase, generateResult]);

  return (
    <div
      className="flex h-dvh min-h-0 flex-col overflow-hidden"
      style={{ background: R.bg, color: "#fff" }}
    >
      {/* ── Top nav ──────────────────────────────────────────────────────── */}
      <div
        className="flex shrink-0 items-center justify-between gap-3 px-3 sm:px-5 py-2 z-30 relative"
        style={{ background: "rgba(10,2,2,0.97)", borderBottom: `1px solid ${R.border}` }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-tech text-[9px] uppercase tracking-widest text-white/45 hover:text-white transition"
          style={{ border: `1px solid ${R.border}` }}
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-white/25 hidden sm:block">BATTLE</span>
          <span className="font-mono text-[10px] text-white/50">{shortId(battleId)}</span>
          <span
            className="rounded-full px-2 py-0.5 font-tech text-[8px] uppercase tracking-widest"
            style={{ background: R.glowSoft, color: R.bright, border: `1px solid ${R.border}` }}
          >
            {mode}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full animate-pulse"
            style={{ background: R.bright }}
          />
          <span className="font-tech text-[9px] uppercase tracking-widest" style={{ color: R.bright }}>
            Robowar
          </span>
        </div>
      </div>

      {/* ── Agent header strip ────────────────────────────────────────────── */}
      <div
        className="flex shrink-0 items-center justify-between gap-4 px-4 sm:px-8 py-3"
        style={{ background: "rgba(10,2,2,0.9)", borderBottom: `1px solid ${R.border}` }}
      >
        {/* Left agent */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="h-10 w-10 rounded-xl overflow-hidden shrink-0"
            style={{ border: `1px solid ${R.border}` }}
          >
            {myAgent ? (
              <img src={getArenaAgentPortrait(myAgent as any)} alt="" className="h-full w-full object-cover object-top" />
            ) : (
              <div className="h-full w-full" style={{ background: R.glowSoft }} />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-display text-sm font-bold text-white truncate">{myAgent?.name ?? "—"}</div>
            <div className="font-tech text-[9px] uppercase tracking-wider" style={{ color: R.bright }}>
              {myAgent?.archetype ?? "—"}
            </div>
            <div className="font-mono text-[9px] text-white/30">{myAgent?.eloRating ?? "—"} ELO</div>
          </div>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ border: `1px solid ${R.primary}`, background: R.glowSoft, boxShadow: `0 0 20px ${R.glow}` }}
          >
            <Swords className="h-4 w-4" style={{ color: R.bright }} />
          </div>
          <span className="font-display text-xs font-black" style={{ color: R.bright }}>VS</span>
          <span className="font-tech text-[8px] uppercase tracking-widest text-white/25">{mode}</span>
        </div>

        {/* Right agent */}
        <div className="flex items-center gap-3 min-w-0 flex-row-reverse">
          <div
            className="h-10 w-10 rounded-xl overflow-hidden shrink-0"
            style={{ border: `1px solid ${R.border}` }}
          >
            {opponent ? (
              <img src={getArenaAgentPortrait(opponent as any)} alt="" className="h-full w-full object-cover object-top -scale-x-100" />
            ) : (
              <div className="h-full w-full" style={{ background: R.glowSoft }} />
            )}
          </div>
          <div className="min-w-0 text-right">
            <div className="font-display text-sm font-bold text-white truncate">{opponent?.name ?? "—"}</div>
            <div className="font-tech text-[9px] uppercase tracking-wider" style={{ color: R.bright }}>
              {opponent?.archetype ?? "—"}
            </div>
            <div className="font-mono text-[9px] text-white/30">{opponent?.eloRating ?? "—"} ELO</div>
          </div>
        </div>
      </div>

      {/* ── Main canvas area ──────────────────────────────────────────────── */}
      <div className="relative flex flex-1 min-h-0 items-center justify-center overflow-hidden">

        {/* Red ambient glow background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-72" style={{ background: `radial-gradient(ellipse at 50% 0%, ${R.glowSoft} 0%, transparent 70%)` }} />
          <div className="absolute inset-x-0 bottom-0 h-48" style={{ background: `radial-gradient(ellipse at 50% 100%, rgba(220,38,38,0.08) 0%, transparent 70%)` }} />
        </div>

        {/* Redirect phase */}
        {phase === "redirect" && (
          <div className="flex flex-col items-center gap-6 px-6 text-center z-10">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full"
              style={{ background: R.glowSoft, border: `2px solid ${R.primary}`, boxShadow: `0 0 60px ${R.glow}` }}
            >
              <Cpu className="h-10 w-10 animate-pulse" style={{ color: R.bright }} />
            </div>
            <div>
              <div className="font-display text-2xl font-black text-white mb-2">
                You will be redirecting to your local game build.
              </div>
              <div className="font-tech text-xs text-white/40 uppercase tracking-widest">
                Robowar · Launching...
              </div>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block h-2 w-2 rounded-full animate-bounce"
                  style={{ background: R.bright, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Running phase — 120s simulation, no seconds shown */}
        {phase === "running" && (
          <div className="flex flex-col items-center gap-8 px-6 w-full max-w-md z-10">

            {/* Agent portraits */}
            <div className="flex items-center gap-6 sm:gap-12">
              <RoboAgentCard agent={myAgent} side="left" />

              <div className="flex flex-col items-center gap-2 shrink-0">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full font-display text-2xl font-black"
                  style={{
                    border: `2px solid ${R.primary}`,
                    color: R.bright,
                    background: R.glowSoft,
                    boxShadow: `0 0 40px ${R.glow}`,
                    textShadow: `0 0 20px ${R.glow}`,
                  }}
                >
                  VS
                </div>
                <Zap className="h-4 w-4 animate-pulse" style={{ color: R.bright }} />
              </div>

              <RoboAgentCard agent={opponent} side="right" />
            </div>

            {/* Status */}
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="font-display text-xl font-black text-white">Battle Ongoing</div>
              <div className="font-tech text-xs text-white/40 uppercase tracking-widest">
                Robowar simulation in progress
              </div>
            </div>

            {/* Progress bar — no numbers, just fills */}
            <div className="w-full space-y-2">
              <div
                className="h-3 w-full rounded-full overflow-hidden"
                style={{ background: "rgba(220,38,38,0.12)", border: `1px solid ${R.border}` }}
              >
                <div
                  className="h-full rounded-full transition-none"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(to right, ${R.dim}, ${R.bright})`,
                    boxShadow: `0 0 12px ${R.glow}`,
                  }}
                />
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: R.bright }} />
                <span className="font-tech text-[9px] uppercase tracking-[0.3em] text-white/40">
                  Syncing battle state…
                </span>
              </div>
            </div>

          </div>
        )}

        {/* Result overlay */}
        {phase === "result" && result && (
          <RoboResultOverlay
            winnerId={result.winnerId}
            winnerName={result.winnerName}
            winnerArchetype={result.winnerArchetype}
            winnerElo={result.winnerElo}
            winnerHp={result.winnerHp}
            loserId={result.loserId}
            loserName={result.loserName}
            loserArchetype={result.loserArchetype}
            loserElo={result.loserElo}
            onHome={() => navigate("/ai-arena")}
          />
        )}

      </div>
    </div>
  );
}
