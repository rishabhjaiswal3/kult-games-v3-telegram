import type { AiArenaAgent } from "@/types/aiArenaGateway";

type TraitsPanelProps = {
  agent: AiArenaAgent | null;
};

const TRAIT_SLOTS = [
  { key: "aggression",   label: "Aggression"   },
  { key: "patience",     label: "Patience"     },
  { key: "adaptability", label: "Adaptability" },
  { key: "resilience",   label: "Resilience"   },
  { key: "creativity",   label: "Creativity"   },
  { key: "loyalty",      label: "Loyalty"      },
  { key: "deception",    label: "Deception"    },
  { key: "precision",    label: "Precision"    },
] as const;

function clamp(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0;
}

function normalizeTraits(traits: AiArenaAgent["traits"]) {
  const raw = traits && typeof traits === "object" ? (traits as Record<string, unknown>) : {};
  return TRAIT_SLOTS.map((slot) => ({ label: slot.label, value: clamp(raw[slot.key]) }));
}

// ── Radar chart helpers ────────────────────────────────────────────────────────
const CX = 100;
const CY = 100;
const R_MAX = 72;
const N = TRAIT_SLOTS.length;

function angle(i: number) {
  return (i / N) * 2 * Math.PI - Math.PI / 2;
}

function radarPoint(i: number, value: number) {
  const r = (value / 100) * R_MAX;
  return { x: CX + r * Math.cos(angle(i)), y: CY + r * Math.sin(angle(i)) };
}

function gridPoints(scale: number) {
  return Array.from({ length: N }, (_, i) => {
    const r = scale * R_MAX;
    const x = CX + r * Math.cos(angle(i));
    const y = CY + r * Math.sin(angle(i));
    return `${x},${y}`;
  }).join(" ");
}

function valuePoints(traits: { value: number }[]) {
  return traits.map((t, i) => {
    const pt = radarPoint(i, t.value);
    return `${pt.x},${pt.y}`;
  }).join(" ");
}

function labelPos(i: number) {
  const r = R_MAX + 16;
  return { x: CX + r * Math.cos(angle(i)), y: CY + r * Math.sin(angle(i)) };
}

// ── Bar color by value ─────────────────────────────────────────────────────────
function barColor(v: number) {
  if (v >= 75) return "from-[#00e4ff] to-[#9a35ff]";
  if (v >= 50) return "from-[#9a35ff] to-[#6737ff]";
  return "from-[#6737ff] to-[#3b1f8c]";
}

export function TraitsPanel({ agent }: TraitsPanelProps) {
  const traits = normalizeTraits(agent?.traits);

  return (
    <section className="arena-panel overflow-hidden p-4 sm:p-5">
      <div className="flex flex-col gap-2 border-b border-white/8 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-tech text-xs uppercase tracking-wider text-white">Selected Agent Traits</h3>
          <p className="mt-1 text-sm text-white/48">Live trait profile for your selected AI Arena agent.</p>
        </div>
        <div className="font-tech text-[10px] uppercase tracking-[0.18em] text-white/35">
          {agent ? agent.name : "No agent selected"}
        </div>
      </div>

      {!agent ? (
        <div className="mt-4 rounded-md border border-white/8 bg-[#0a0f1b]/50 px-4 py-6 text-center text-sm text-white/45">
          Select or create an agent to view its trait profile here.
        </div>
      ) : (
        <div className="mt-4 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">

          {/* ── Radar chart ── */}
          <div className="flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full max-w-[220px]">
              {/* Grid rings */}
              {[0.25, 0.5, 0.75, 1].map((scale) => (
                <polygon
                  key={scale}
                  points={gridPoints(scale)}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
              ))}

              {/* Axes */}
              {Array.from({ length: N }, (_, i) => {
                const pt = radarPoint(i, 100);
                return (
                  <line
                    key={i}
                    x1={CX} y1={CY}
                    x2={pt.x} y2={pt.y}
                    stroke="rgba(255,255,255,0.07)"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Value fill */}
              <polygon
                points={valuePoints(traits)}
                fill="rgba(154,53,255,0.18)"
                stroke="#9a35ff"
                strokeWidth="1.5"
              />

              {/* Dots */}
              {traits.map((t, i) => {
                const pt = radarPoint(i, t.value);
                return (
                  <circle
                    key={i}
                    cx={pt.x} cy={pt.y} r="2.5"
                    fill="#00e4ff"
                    stroke="#000"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Labels */}
              {traits.map((t, i) => {
                const pos = labelPos(i);
                return (
                  <text
                    key={i}
                    x={pos.x} y={pos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(255,255,255,0.45)"
                    fontSize="7"
                    fontFamily="monospace"
                    style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
                  >
                    {t.label.slice(0, 3)}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* ── Bar chart ── */}
          <div className="flex flex-col justify-center gap-2.5">
            {traits.map((t) => (
              <div key={t.label} className="grid grid-cols-[80px_minmax(0,1fr)_32px] items-center gap-2">
                <span className="font-tech text-[10px] uppercase tracking-[0.12em] text-white/45 truncate">
                  {t.label}
                </span>
                <div className="h-1.5 rounded-full bg-white/8">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${barColor(t.value)} transition-all duration-500`}
                    style={{ width: `${t.value}%` }}
                  />
                </div>
                <span className="text-right font-mono text-[11px] font-semibold text-white">
                  {t.value}
                </span>
              </div>
            ))}
          </div>

        </div>
      )}
    </section>
  );
}
