import kultLogo from "@/assets/kult-logo.png";
import { cn } from "@/lib/utils";

type ArenaTokenAmountProps = {
  amount: number | string;
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Rarely needed — Arena balance uses amount + label only. */
  showLogo?: boolean;
};

const sizeMap = {
  sm: { text: "text-sm font-bold", logo: "h-4 w-4", gap: "gap-1.5" },
  md: { text: "text-2xl font-black", logo: "h-5 w-5", gap: "gap-2" },
  lg: { text: "text-3xl font-black", logo: "h-6 w-6", gap: "gap-2" },
} as const;

/** Arena in-game currency — Kult-branded, not 0G native token. */
export function ArenaTokenAmount({ amount, className, size = "md", showLogo = false }: ArenaTokenAmountProps) {
  const s = sizeMap[size];
  return (
    <span className={cn("inline-flex items-center", s.gap, className)}>
      {showLogo ? (
        <img src={kultLogo} alt="" aria-hidden className={cn(s.logo, "rounded-sm object-contain")} />
      ) : null}
      <span className={cn(s.text, "tabular-nums text-foreground")}>{amount}</span>
      <span className="font-display text-[10px] font-bold tracking-[0.18em] text-neon-cyan sm:text-xs">ARENA</span>
    </span>
  );
}

export function ArenaTokenLabel({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <span className="font-display text-[10px] font-bold tracking-[0.2em] text-neon-cyan">ARENA TOKEN</span>
    </span>
  );
}
