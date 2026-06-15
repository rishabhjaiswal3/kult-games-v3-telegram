import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronRight, Radio } from "lucide-react";

export function AutonomousPanel() {
  return (
    <section className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#04080f]/60 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 hover:border-[#00f080]/30 hover:shadow-[0_8px_40px_rgba(0,240,128,0.1)]">
      <div className="flex items-center justify-between relative z-10">
        <h3 className="font-tech text-xs font-bold uppercase tracking-wider text-white drop-shadow-sm">Autonomous Status</h3>
        <span className="flex items-center gap-1 font-tech text-[10px] text-[#00f080] drop-shadow-[0_0_8px_rgba(0,240,128,0.5)]">
          ACTIVE <Radio className="h-3.5 w-3.5 animate-pulse" />
        </span>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-white/70 relative z-10">
        Your agent is operating autonomously.
        <br />
        Earning, training, and competing while you&apos;re away.
      </p>
      <div className="mt-4 grid grid-cols-2 rounded-lg border border-white/10 bg-[#0a0f1b]/50 p-4 text-xs backdrop-blur-sm relative z-10">
        <div className="border-r border-white/10 pr-4">
          <div className="text-white/50">Current Strategy</div>
          <div className="mt-1 flex items-center justify-between font-semibold text-white">
            Balanced Growth <ChevronRight className="h-4 w-4 text-[#8b29ff]" />
          </div>
        </div>
        <div className="pl-4">
          <div className="text-white/50">Risk Level</div>
          <div className="mt-1 flex items-center justify-between font-semibold text-white">
            Medium <span className="text-[#f4b400] drop-shadow-[0_0_5px_rgba(244,180,0,0.5)]">▮▮▮▮▯</span>
          </div>
        </div>
      </div>
      <Link
        to="/autonomous"
        className="mt-4 relative flex h-10 w-full items-center justify-center gap-3 rounded-md border border-[#8b29ff]/60 bg-[#46136f]/70 font-tech text-xs uppercase tracking-wider text-white transition-all duration-300 hover:border-[#c78aff]/80 hover:bg-[#5b1499]/80 hover:shadow-[0_4px_15px_rgba(154,53,255,0.3)] z-10"
      >
        MANAGE AUTONOMOUS <ArrowUpRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
