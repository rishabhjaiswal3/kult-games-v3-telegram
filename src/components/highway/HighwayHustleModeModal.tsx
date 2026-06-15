import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Flag, Play, Siren, Timer, Trophy, X } from "lucide-react";
import { HighwayHustleGarage } from "@/components/highway/HighwayHustleGarage";
import {
  HIGHWAY_HUSTLE_MODES,
  type HighwayHustleModeConfig,
} from "@/constants/highwayHustleModes";
import { cn } from "@/lib/utils";

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
  const [pendingMode, setPendingMode] = useState<HighwayHustleModeConfig | null>(null);

  useEffect(() => {
    if (open) setPendingMode(null);
  }, [open]);

  if (!open) return null;

  const handleStart = () => {
    if (!pendingMode) return;
    onSelectMode(pendingMode);
  };

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
        className="relative flex max-h-[min(78dvh,640px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,#0a1020,#050913)] shadow-[0_0_60px_rgba(155,50,255,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full shrink-0 bg-[repeating-linear-gradient(-45deg,#9a35ff,#9a35ff_6px,#00d4ff_6px,#00d4ff_12px)] opacity-80" />

        <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg border border-purple-500/30 bg-purple-500/10">
              <Play className="h-4 w-4 fill-purple-400 text-purple-400" />
            </div>
            <div>
              <h2
                id="hh-mode-modal-title"
                className="font-tech text-base font-bold uppercase tracking-wider text-white sm:text-lg"
              >
                Select game mode
              </h2>
              <p className="font-tech text-[8px] uppercase tracking-[0.25em] text-white/45">
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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          <HighwayHustleGarage modal title="Vehicle" className="mb-4 border-white/8" />

          <p className="mb-2 font-tech text-[9px] font-semibold uppercase tracking-wider text-white/50">
            Missions
          </p>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {HIGHWAY_HUSTLE_MODES.map((m) => {
              const Icon = MODE_ICONS[m.mode] ?? Flag;
              const diffClass = DIFFICULTY_STYLES[m.difficulty] ?? DIFFICULTY_STYLES.Easy;
              const isSelected = pendingMode?.mode === m.mode;

              return (
                <button
                  key={m.mode}
                  type="button"
                  onClick={() => setPendingMode(m)}
                  aria-pressed={isSelected}
                  className={cn(
                    "group relative min-w-0 overflow-hidden rounded-lg border bg-[#0a0f1b]/80 p-2 text-center transition sm:rounded-xl sm:p-2.5",
                    isSelected
                      ? "border-purple-400/60 bg-purple-950/30 shadow-[0_0_20px_rgba(154,53,255,0.2)]"
                      : "border-white/8 hover:border-purple-500/35 hover:shadow-[0_0_16px_rgba(155,50,255,0.1)]",
                  )}
                >
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-md border sm:h-8 sm:w-8",
                        isSelected
                          ? "border-purple-400/40 bg-purple-500/15"
                          : "border-cyan-500/25 bg-cyan-500/10",
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isSelected ? "text-purple-300" : "text-cyan-300")} />
                    </div>
                    <div
                      className={cn(
                        "w-full font-tech text-[8px] font-black leading-tight tracking-wide sm:text-[9px]",
                        isSelected ? "text-purple-200" : "text-white group-hover:text-purple-300",
                      )}
                    >
                      {m.name}
                    </div>
                    <span
                      className={cn(
                        "rounded border px-1 py-px font-tech text-[6px] font-bold uppercase tracking-wider sm:text-[7px]",
                        diffClass,
                      )}
                    >
                      {m.difficulty}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/8 bg-[#050913]/95 px-4 py-3 sm:px-5">
          <button
            type="button"
            disabled={!pendingMode}
            onClick={handleStart}
            className={cn(
              "btn-primary flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 font-tech text-[10px] font-bold uppercase tracking-wider",
              !pendingMode && "cursor-not-allowed opacity-45",
            )}
          >
            <Play className="h-4 w-4 fill-current" />
            {pendingMode ? `Start — ${pendingMode.name}` : "Select a mission to start"}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

export default HighwayHustleModeModal;
