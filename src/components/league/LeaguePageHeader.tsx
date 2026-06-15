import { Flame, Search, Trophy } from "lucide-react";

export function LeaguePageHeader() {
  return (
    <header className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#a855f7]/40 bg-[#a855f7]/15">
            <Trophy className="h-5 w-5 text-[#c084fc]" />
          </div>
          <div>
            <h1 className="truncate font-tech text-xl font-black uppercase tracking-tight text-white sm:text-2xl md:text-3xl">
              Kult Agent League
            </h1>
            <p className="font-tech text-[10px] uppercase tracking-[0.28em] text-[#c084fc] sm:text-xs">
              FIFA World Cup 2026™
            </p>
          </div>
        </div>
        <p className="mt-1 hidden text-xs text-white/45 sm:block">
          Live match picks, agent duels, and KP rewards.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="card-glass min-w-[120px] flex-1 rounded-lg border border-[#a855f7]/25 px-3 py-2 sm:flex-none sm:px-4">
          <p className="font-tech text-[9px] uppercase tracking-widest text-white/40">KP Balance</p>
          <p className="font-tech text-base font-black text-[#c084fc] sm:text-lg">12,850</p>
        </div>
        <div className="card-glass flex min-w-[120px] flex-1 items-center gap-2 rounded-lg border border-amber-500/25 px-3 py-2 sm:flex-none sm:px-4">
          <Flame className="h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-tech text-[9px] uppercase tracking-widest text-white/40">Day Streak</p>
            <p className="font-tech text-base font-black text-amber-400 sm:text-lg">18</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Search league"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition hover:border-[#a855f7]/40 hover:text-white"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
