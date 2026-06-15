import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Flag, Play, Siren, Timer, Trophy, X } from "lucide-react";
import {
  HIGHWAY_HUSTLE_MODES,
  type HighwayHustleModeConfig,
} from "@/constants/highwayHustleModes";

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
  Medium: "border-amber-500/35 bg-amber-500/10 text-amber-300",
  Hard: "border-orange-500/35 bg-orange-500/10 text-orange-300",
  Expert: "border-rose-500/35 bg-rose-500/10 text-rose-300",
};

const MODE_ICONS = {
  "one-way": Flag,
  "two-way": Trophy,
  "speed-run": Timer,
  "time-bomb": Siren,
} as const;

type HighwayHustleModeModalProps = {
  open: boolean;
  onClose: () => void;
  onSelectMode: (mode: HighwayHustleModeConfig) => void;
};

export function HighwayHustleModeModal({
  open,
  onClose,
  onSelectMode,
}: HighwayHustleModeModalProps) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/88 p-4 backdrop-blur-md"
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hh-mode-modal-title"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="relative w-full max-w-4xl max-h-[90dvh] overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,#0a1020,#050913)] shadow-[0_0_60px_rgba(155,50,255,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-[repeating-linear-gradient(-45deg,#9a35ff,#9a35ff_6px,#00d4ff_6px,#00d4ff_12px)] opacity-80" />

        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-purple-500/30 bg-purple-500/10">
              <Play className="h-5 w-5 fill-purple-400 text-purple-400" />
            </div>
            <div>
              <h2
                id="hh-mode-modal-title"
                className="font-tech text-lg font-bold uppercase tracking-wider text-white sm:text-xl"
              >
                Select game mode
              </h2>
              <p className="font-tech text-[9px] uppercase tracking-[0.25em] text-white/45">
                Highway Hustle — choose your mission
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/60 transition hover:border-white/25 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {HIGHWAY_HUSTLE_MODES.map((m) => {
              const Icon = MODE_ICONS[m.mode] ?? Flag;
              const diffClass = DIFFICULTY_STYLES[m.difficulty] ?? DIFFICULTY_STYLES.Easy;

              return (
                <button
                  key={m.mode}
                  type="button"
                  onClick={() => onSelectMode(m)}
                  className="group relative overflow-hidden rounded-xl border border-white/8 bg-[#0a0f1b]/80 p-5 text-left transition hover:border-purple-500/40 hover:shadow-[0_0_28px_rgba(155,50,255,0.12)]"
                >
                  <div className="absolute -right-6 -top-6 opacity-[0.06] transition group-hover:opacity-10">
                    <Icon className="h-28 w-28 text-white" />
                  </div>
                  <div className="relative z-10 flex flex-col items-center text-center gap-2">
                    <div className="grid h-11 w-11 place-items-center rounded-lg border border-cyan-500/25 bg-cyan-500/10">
                      <Icon className="h-5 w-5 text-cyan-300" />
                    </div>
                    <div className="font-tech text-xl font-black tracking-wider text-white group-hover:text-purple-300">
                      {m.name}
                    </div>
                    <p className="font-tech text-[10px] uppercase tracking-wide text-white/45">
                      {m.slogan}
                    </p>
                    <span
                      className={`mt-2 rounded border px-3 py-1 font-tech text-[9px] font-bold uppercase tracking-[0.3em] ${diffClass}`}
                    >
                      {m.difficulty}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-white/8 px-6 py-3 text-center">
          <p className="font-tech text-[9px] uppercase tracking-[0.35em] text-white/35">
            Prepare for the ultimate hustle
          </p>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

export default HighwayHustleModeModal;
