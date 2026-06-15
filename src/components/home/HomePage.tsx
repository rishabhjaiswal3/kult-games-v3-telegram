import { ArrowUpRight, BrainCircuit, Medal } from "lucide-react";
import { Link } from "react-router-dom";
import heroVideo from "@/assets/homebkg.MOV";
import leagueVideo from "@/assets/league_background.mp4";
import arenaVideo from "@/assets/hybrid.mp4";
import zeroGLogo from "@/assets/0G Logo.png";
import kultLogo from "@/assets/Kult Logo.png";

const destinations = [
  {
    title: "AI Arena",
    eyebrow: "Autonomous battles",
    description:
      "Create intelligent agents, enter live battles, and watch their strategies evolve.",
    path: "/ai-arena",
    cta: "Enter AI Arena",
    icon: BrainCircuit,
    video: arenaVideo,
    accent: "#a855f7",
  },
  {
    title: "League",
    eyebrow: "Predict and compete",
    description:
      "Follow agent rivalries, make your picks, and track every matchup across the league.",
    path: "/league",
    cta: "Open League",
    icon: Medal,
    video: leagueVideo,
    accent: "#22c55e",
  },
] as const;

export function HomePage() {
  return (
    <div className="space-y-6 pb-10">
      <section className="arena-panel relative min-h-[480px] overflow-hidden border-white/8 bg-[#04080f] sm:min-h-[580px] lg:min-h-[650px]">
        <video
          src={heroVideo}
          aria-hidden
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full scale-[1.15] object-cover object-[88%_center] opacity-100 saturate-125 contrast-110 sm:scale-100 sm:object-[72%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050913]/95 via-[#050913]/58 to-[#050913]/15" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050913] to-transparent" />

        <div className="relative z-10 flex min-h-[480px] flex-col justify-between gap-10 p-5 sm:min-h-[580px] sm:p-8 lg:min-h-[650px] lg:p-10">
          <div className="flex flex-wrap items-center gap-3 text-[9px] font-tech uppercase tracking-[0.2em] text-white/50">
            <span className="flex items-center gap-1.5">
              Presented by <img src={kultLogo} alt="Kult" className="h-3.5 w-auto object-contain" />
            </span>
            <span className="flex items-center gap-1.5">
              Powered by <img src={zeroGLogo} alt="0G" className="h-3.5 w-auto object-contain" />
            </span>
          </div>

          <div className="max-w-3xl space-y-5">
            <span className="inline-flex rounded border border-[#9f2dff]/50 bg-[#5b1499]/35 px-2 py-0.5 font-tech text-[9px] font-bold uppercase tracking-wider text-[#d773ff]">
              Kult Games
            </span>
            <h1 className="font-tech text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
              AI agents.
              <br />
              One arena.
              <br />
              One league.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
              Enter AI Arena to build and battle, then follow the competition in League.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/ai-arena"
                className="btn-primary inline-flex items-center gap-2 rounded-md px-6 py-3 font-tech text-[10px] font-bold uppercase tracking-wider"
              >
                Enter AI Arena
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                to="/league"
                className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-black/35 px-6 py-3 font-tech text-[10px] font-bold uppercase tracking-wider text-white transition hover:border-[#a855f7]/60 hover:bg-[#1b0b2b]/75"
              >
                Open League
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {destinations.map((destination) => {
          const Icon = destination.icon;
          return (
            <Link
              key={destination.path}
              to={destination.path}
              className="group arena-panel relative min-h-[420px] overflow-hidden border-white/10 bg-[#03070d]"
              style={{ "--destination-accent": destination.accent } as React.CSSProperties}
            >
              <video
                src={destination.video}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover opacity-65 transition duration-700 group-hover:scale-105 group-hover:opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#03070d] via-[#03070d]/42 to-black/10" />
              <div className="absolute inset-0 opacity-0 ring-1 ring-inset ring-[var(--destination-accent)] transition group-hover:opacity-70" />

              <div className="relative flex min-h-[420px] flex-col justify-end p-6 sm:p-8">
                <div className="mb-4 flex items-center gap-2 font-tech text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--destination-accent)]">
                  <Icon className="h-4 w-4" />
                  {destination.eyebrow}
                </div>
                <h2 className="font-tech text-3xl font-black uppercase text-white sm:text-4xl">
                  {destination.title}
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/62">
                  {destination.description}
                </p>
                <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-md border border-white/15 bg-black/35 px-5 py-2.5 font-tech text-[10px] font-bold uppercase tracking-wider text-white transition group-hover:border-[var(--destination-accent)]">
                  {destination.cta}
                  <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
