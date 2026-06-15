import kultLogo from "@/assets/Kult Logo.png";
import zeroGLogo from "@/assets/0G Logo.png";
import { BrainCircuit, BriefcaseBusiness, Gamepad2, Trophy, Video } from "lucide-react";
import { Link } from "react-router-dom";
import sceneVideo from "@/assets/Scene 1.mp4";

const platformLinks = [
  { label: "Games", href: "/", icon: Gamepad2 },
  { label: "Inventory", href: "/inventory", icon: BriefcaseBusiness },
  { label: "AI Arena", href: "/ai-arena", icon: BrainCircuit },
  { label: "Moments", href: "/moments", icon: Video },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
];

const socials = [
  {
    key: "x",
    label: "X",
    href: "https://x.com/_KultGames",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    key: "discord",
    label: "Discord",
    href: "https://discord.com/invite/Cge7rrCyUB",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.001.024.017.043.037.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
  {
    key: "telegram",
    label: "Telegram",
    href: "https://t.me/KultGamesOfficial",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
];

const Footer = () => {
  return (
    <footer className="arena-panel relative mb-6 border border-white/8 bg-[#04080f] overflow-hidden">
      <div className="absolute inset-0 ai-grid-overlay pointer-events-none opacity-[0.09]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(278_100%_74%/0.85)] to-transparent" />
      <div className="pointer-events-none absolute -left-28 top-8 h-56 w-56 rounded-full bg-[hsl(278_100%_60%/0.16)] blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-[hsl(190_100%_55%/0.11)] blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(278_100%_70%/0.12),transparent_34%),linear-gradient(180deg,rgba(7,10,22,0.92),rgba(2,5,12,0.98))]" />

      <div className="container relative mx-auto px-4 sm:px-6">
        <div className="grid gap-8 py-10 lg:grid-cols-[1.15fr_0.85fr_0.7fr] lg:items-center lg:py-12">
          <div className="group/brand relative w-full max-w-[390px] overflow-hidden rounded-[1.1rem] border border-[#5a35ff]/38 bg-[linear-gradient(140deg,rgba(31,21,78,0.82),rgba(4,7,18,0.97)_58%)] p-5 shadow-[0_0_34px_rgba(104,62,255,0.16),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-[#8f73ff]/70 hover:shadow-[0_0_48px_rgba(104,62,255,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_6%_0%,rgba(130,91,255,0.28),transparent_32%)] transition duration-300 group-hover/brand:opacity-80" />
            <div className="relative flex min-w-0 flex-col items-start gap-5 text-left">
              <div className="flex h-[72px] w-full max-w-[300px] shrink-0 items-center justify-center gap-5 rounded-lg bg-black/48 px-4 shadow-[0_0_26px_rgba(112,73,255,0.16)] transition duration-300 group-hover/brand:bg-black/65 group-hover/brand:shadow-[0_0_34px_rgba(112,73,255,0.28)]">
                <img src={kultLogo} alt="Kult Games" className="h-9 w-auto max-w-[132px] object-contain transition duration-300 group-hover/brand:scale-105 group-hover/brand:drop-shadow-[0_0_12px_rgba(255,255,255,0.45)]" />
                <span className="h-10 w-px bg-white/16 transition duration-300 group-hover/brand:bg-[#a790ff]/55" aria-hidden />
                <img src={zeroGLogo} alt="0G" className="h-9 w-auto max-w-[78px] object-contain transition duration-300 group-hover/brand:scale-105 group-hover/brand:drop-shadow-[0_0_12px_rgba(255,255,255,0.45)]" />
              </div>
              <div className="min-w-0 max-w-[320px]">
                <h2 className="font-tech text-[15px] font-black uppercase leading-[1.5] tracking-[0.22em] text-[#dce5ff] transition duration-300 group-hover/brand:text-white">
                  THE OPERATING LAYER FOR <span className="text-[#a790ff] transition duration-300 group-hover/brand:text-[#cbbcff]">INTELLIGENT GAMING.</span>
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/56 transition duration-300 group-hover/brand:text-white/78">
                  Autonomous agents. Persistent identities. Connected worlds.
                </p>
              </div>
            </div>
          </div>

          <nav
            className="group/explore flex flex-col justify-center border-white/8 transition duration-300 hover:border-[#7d5cff]/35 lg:min-h-[168px] lg:border-x lg:px-6"
            aria-label="Footer navigation"
          >
            <p className="mb-5 font-tech text-[12px] font-black uppercase tracking-[0.46em] text-[#a790ff] transition duration-300 group-hover/explore:text-[#d8c7ff] group-hover/explore:drop-shadow-[0_0_10px_rgba(167,144,255,0.55)]">EXPLORE</p>
            <div className="flex flex-wrap gap-3">
              {platformLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="group inline-flex h-11 items-center justify-start gap-2.5 rounded-[1.25rem] border border-white/10 bg-black/25 px-4 text-[13px] font-medium text-white/86 shadow-[inset_0_0_0_1px_rgba(130,98,255,0.08)] transition hover:-translate-y-0.5 hover:border-[#7d5cff]/55 hover:bg-[#120d2d] hover:text-white hover:shadow-[0_0_20px_rgba(112,73,255,0.2)]"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[#8b6dff] transition group-hover:scale-110 group-hover:text-[#cbbcff]" />
                    <span className="whitespace-nowrap transition group-hover:text-white">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="group/social flex flex-col justify-center gap-7 lg:min-h-[168px] lg:items-start">
            <div>
              <p className="mb-5 font-tech text-[12px] font-black uppercase tracking-[0.46em] text-[#a790ff] transition duration-300 group-hover/social:text-[#d8c7ff] group-hover/social:drop-shadow-[0_0_10px_rgba(167,144,255,0.55)]">
                FOLLOW KULT GAMES
              </p>
              <div className="flex flex-wrap gap-3">
                {socials.map((s) => (
                  <a
                    key={s.key}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-12 w-12 items-center justify-center rounded-full border border-[#6645ff]/48 bg-black/20 text-[#a790ff] transition hover:-translate-y-0.5 hover:border-[#9d86ff] hover:bg-[#140f35] hover:text-white hover:shadow-[0_0_24px_rgba(112,73,255,0.32)]"
                    aria-label={s.label}
                    title={s.label}
                  >
                    <span className="transition-transform group-hover:scale-110">{s.icon}</span>
                  </a>
                ))}
              </div>
            </div>


            <div className="group/video relative overflow-hidden rounded-[1.1rem] border border-[#5a35ff]/30 shadow-[0_0_24px_rgba(104,62,255,0.12)] transition duration-300 hover:border-[#8f73ff]/60 hover:shadow-[0_0_36px_rgba(104,62,255,0.25)] hover:-translate-y-1 mt-2 w-full max-w-[250px]">
              <video
                src={sceneVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto object-cover opacity-80 mix-blend-screen transition duration-300 group-hover/video:opacity-100"
              />
            </div>
          </div>
        </div>

        <div className="group/legal flex flex-col items-center justify-between gap-3 border-t border-white/10 py-5 transition duration-300 hover:border-[#7d5cff]/30 sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11px] text-white/42 font-mono">
            <span className="transition group-hover/legal:text-white/68">© 2026</span>
            <img src={kultLogo} alt="Kult Games" className="h-3.5 w-auto object-contain opacity-60 transition group-hover/legal:opacity-100" />
            <span className="text-white/20 transition group-hover/legal:text-[#a790ff]/60">·</span>
            <span className="transition group-hover/legal:text-white/68">Powered by</span>
            <img src={zeroGLogo} alt="0G" className="h-3.5 w-auto object-contain opacity-60 transition group-hover/legal:opacity-100" />
          </div>
          <span className="text-center text-[9px] font-mono tracking-[0.28em] text-[hsl(278_100%_82%/0.58)] transition group-hover/legal:text-[#d8c7ff]">
            BUILT ON-CHAIN · AI-NATIVE · DECENTRALIZED
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
