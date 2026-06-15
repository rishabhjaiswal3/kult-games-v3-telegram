import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  Award,
  Zap,
  Target,
  Shield,
  Lock,
  CheckCircle,
  Search,
  ChevronDown,
  Flame,
  Swords,
  Package,
  Hexagon,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Asset Imports
import rewardCrate from "@/assets/reward-crate.png";

import { aiArenaGatewayApi } from "@/api/aiArenaGatewayApi";
import { useMyArenaAgents } from "@/hooks/useMyArenaAgents";
import type {
  AiArenaAchievement,
  AchievementCategory,
  AchievementRarity,
} from "@/types/aiArenaGateway";

// ── Helpers ──────────────────────────────────────────────────────────────────

function StarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

type CategoryMeta = {
  name: AchievementCategory;
  icon: LucideIcon | ((p: { className?: string }) => JSX.Element);
  color: string;
};

const CATEGORY_META: CategoryMeta[] = [
  { name: "BATTLES",    icon: Swords,   color: "border-purple-500/20 text-[#b85eff] bg-purple-950/10" },
  { name: "AGENTS",     icon: Hexagon,  color: "border-blue-500/20 text-blue-400 bg-blue-950/10" },
  { name: "TRAINING",   icon: Zap,      color: "border-emerald-500/20 text-emerald-400 bg-emerald-950/10" },
  { name: "AUTONOMOUS", icon: Flame,    color: "border-amber-500/20 text-amber-400 bg-amber-950/10" },
  { name: "COLLECTION", icon: Package,  color: "border-indigo-500/20 text-indigo-400 bg-indigo-950/10" },
  { name: "SPECIAL",    icon: StarIcon, color: "border-white/10 text-white/40 bg-white/5" },
];

type RarityStyle = { iconBg: string; border: string; textColor: string };

const RARITY_STYLES: Record<AchievementRarity, RarityStyle> = {
  COMMON:    { iconBg: "from-white/5 to-white/10",             border: "border-white/20",        textColor: "text-white/70"    },
  RARE:      { iconBg: "from-blue-500/20 to-blue-950/40",      border: "border-blue-500/40",     textColor: "text-blue-400"    },
  EPIC:      { iconBg: "from-purple-500/20 to-purple-950/40",  border: "border-purple-500/40",   textColor: "text-purple-400"  },
  LEGENDARY: { iconBg: "from-amber-500/20 to-amber-950/40",    border: "border-amber-500/40",    textColor: "text-amber-400"   },
};

const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  first_blood:      Swords,
  warrior:          Swords,
  battle_hardened:  Shield,
  arena_dominator:  Shield,
  centurion:        Trophy,
  survivor:         Shield,
  veteran:          Shield,
  elo_climber:      Target,
  elite:            Target,
  grandmaster:      Trophy,
  first_lesson:     Zap,
  student:          Zap,
  scholar:          Zap,
  master_trainer:   Zap,
  ai_overlord:      Zap,
  born:             Hexagon,
  awakened:         Hexagon,
  ascended:         Hexagon,
  legendary_agent:  Trophy,
  mythic_agent:     Trophy,
  old_timer:        Hexagon,
  autopilot:        Flame,
  self_sufficient:  Flame,
  machine_uprising: Flame,
  inft_owner:       Package,
  battle_scarred:   Package,
  balanced:         Package,
  draw_master:      Award,
  completionist:    Trophy,
};

// Milestone thresholds
const MILESTONES = [
  { pts: 500,   label: "500 Points",   crate: "Bronze Crate" },
  { pts: 1000,  label: "1,000 Points", crate: "Silver Crate" },
  { pts: 2500,  label: "2,500 Points", crate: "Gold Crate"   },
  { pts: 5000,  label: "5,000 Points", crate: "Diamond Crate" },
];

// ── Donut chart ──────────────────────────────────────────────────────────────

const CIRC = 238.76; // 2π × 38

function DonutChart({
  common, rare, epic, legendary,
  totalCommon, totalRare, totalEpic, totalLegendary,
  unlockedCount,
}: {
  common: number; rare: number; epic: number; legendary: number;
  totalCommon: number; totalRare: number; totalEpic: number; totalLegendary: number;
  unlockedCount: number;
}) {
  const total = totalCommon + totalRare + totalEpic + totalLegendary || 1;

  const commonPct   = totalCommon   / total;
  const rarePct     = totalRare     / total;
  const epicPct     = totalEpic     / total;
  const legendaryPct = totalLegendary / total;

  const CIRC = 213.63; // 2 * Math.PI * 34
  const seg = (pct: number) => pct * CIRC;
  const gap = 2;
  const val = (pct: number) => Math.max(0, seg(pct) - (pct > 0 && pct < 1 ? gap : 0));

  const offset1 = 0;
  const offset2 = -(seg(commonPct));
  const offset3 = -(seg(commonPct) + seg(rarePct));
  const offset4 = -(seg(commonPct) + seg(rarePct) + seg(epicPct));

  const pctLabel = (n: number, tot: number) =>
    tot === 0 ? "0%" : `${Math.round((n / tot) * 100)}%`;

  const stars = useMemo(() => Array.from({ length: 120 }).map((_, i) => {
    const x = Math.sin(i * 1234.56) * 120 + 50; 
    const y = Math.cos(i * 3456.78) * 120 + 50;
    const r = (Math.sin(i * 9876.54) + 1) * 0.6 + 0.2;
    const op = (Math.cos(i * 5432.10) + 1) * 0.4 + 0.2;
    return { x, y, r, op };
  }), []);

  return (
    <>
      <div className="flex justify-center items-center py-6 relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-90 scale-[1.35]">
          {/* Nebula clouds */}
          <div className="absolute w-[180px] h-[180px] rounded-full bg-purple-600/30 blur-[35px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute -translate-x-[25%] -translate-y-[20%] w-[120px] h-[100px] rounded-full bg-blue-500/40 blur-[25px] mix-blend-screen" />
          <div className="absolute translate-x-[20%] translate-y-[25%] w-[140px] h-[120px] rounded-full bg-fuchsia-600/30 blur-[30px] mix-blend-screen" />
          <div className="absolute -translate-x-[15%] translate-y-[35%] w-[100px] h-[80px] rounded-full bg-indigo-500/40 blur-[20px] mix-blend-screen" />
        </div>
        <svg className="w-full max-w-[210px] aspect-square overflow-visible z-10 relative drop-shadow-2xl" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="epicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9a35ff" />
              <stop offset="100%" stopColor="#d18eff" />
            </linearGradient>
            <linearGradient id="rareGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#93c5fd" />
            </linearGradient>
            <linearGradient id="legendGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fde68a" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* Stars */}
          <g>
            {stars.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.op} />
            ))}
          </g>

          {/* Thin outer glowing rings */}
          <circle cx="50" cy="50" r="45.5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" style={{ filter: "drop-shadow(0 0 4px rgba(154,53,255,0.9))" }} />
          <circle cx="50" cy="50" r="47.5" fill="none" stroke="rgba(154,53,255,0.25)" strokeWidth="0.8" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" />

          {/* Dark center background */}
          <circle cx="50" cy="50" r="26" fill="#1c1c22" />

          {/* Track */}
          <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="14" />
          
          {commonPct > 0 && (
            <circle cx="50" cy="50" r="34" fill="none" stroke="#64748b" strokeWidth="14"
              strokeDasharray={`${val(commonPct)} ${CIRC}`} strokeDashoffset={offset1}
              transform="rotate(-90 50 50)" className="transition-all duration-1000 ease-out" />
          )}
          {rarePct > 0 && (
            <circle cx="50" cy="50" r="34" fill="none" stroke="url(#rareGrad)" strokeWidth="14"
              strokeDasharray={`${val(rarePct)} ${CIRC}`} strokeDashoffset={offset2}
              transform="rotate(-90 50 50)" className="transition-all duration-1000 ease-out" />
          )}
          {epicPct > 0 && (
            <circle cx="50" cy="50" r="34" fill="none" stroke="url(#epicGrad)" strokeWidth="14"
              strokeDasharray={`${val(epicPct)} ${CIRC}`} strokeDashoffset={offset3}
              transform="rotate(-90 50 50)" className="transition-all duration-1000 ease-out" />
          )}
          {legendaryPct > 0 && (
            <circle cx="50" cy="50" r="34" fill="none" stroke="url(#legendGrad)" strokeWidth="14"
              strokeDasharray={`${val(legendaryPct)} ${CIRC}`} strokeDashoffset={offset4}
              transform="rotate(-90 50 50)" className="transition-all duration-1000 ease-out" />
          )}
          <g>
            <text x="50" y="50" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="900" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>{unlockedCount}</text>
            <text x="50" y="62" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="5.5" fontWeight="800" letterSpacing="0.2em">UNLOCKED</text>
          </g>
        </svg>
      </div>

      <div className="space-y-3 pt-4 px-1 text-[11px] font-semibold text-white/80 relative z-10">
        <div className="flex items-center justify-between group cursor-default">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#64748b] border border-[#64748b]/50 shadow-[0_0_8px_rgba(100,116,139,0.3)] transition-transform group-hover:scale-125" />
            <span className="group-hover:text-white transition drop-shadow-md">Common</span>
          </div>
          <span className="font-tech text-white group-hover:text-white transition">{common} <span className="text-white/60">({pctLabel(common, totalCommon)})</span></span>
        </div>
        <div className="flex items-center justify-between group cursor-default">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] border border-[#3b82f6]/50 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-transform group-hover:scale-125" />
            <span className="group-hover:text-blue-200 transition drop-shadow-md">Rare</span>
          </div>
          <span className="font-tech text-white group-hover:text-blue-200 transition">{rare} <span className="text-white/60">({pctLabel(rare, totalRare)})</span></span>
        </div>
        <div className="flex items-center justify-between group cursor-default">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#9a35ff] to-[#d18eff] border border-[#9a35ff]/50 shadow-[0_0_10px_rgba(154,53,255,0.5)] transition-transform group-hover:scale-125" />
            <span className="group-hover:text-purple-200 transition drop-shadow-md">Epic</span>
          </div>
          <span className="font-tech text-white group-hover:text-purple-200 transition">{epic} <span className="text-white/60">({pctLabel(epic, totalEpic)})</span></span>
        </div>
        <div className="flex items-center justify-between group cursor-default">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#fde68a] border border-[#f59e0b]/50 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-transform group-hover:scale-125" />
            <span className="group-hover:text-amber-200 transition drop-shadow-md">Legendary</span>
          </div>
          <span className="font-tech text-white group-hover:text-amber-200 transition">{legendary} <span className="text-white/60">({pctLabel(legendary, totalLegendary)})</span></span>
        </div>
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const AchievementsPage = () => {
  const [activeTab, setActiveTab]         = useState("OVERVIEW");
  const [searchQuery, setSearchQuery]     = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAll, setShowAll]             = useState(false);

  const tabs = ["OVERVIEW", "ALL ACHIEVEMENTS", "IN PROGRESS", "COMPLETED", "LOCKED"];

  // Load my agents to get the selected agent
  const myAgentsQ = useMyArenaAgents(1, 50);
  const firstAgent = myAgentsQ.data?.agents?.[0] ?? null;

  const achievementsQ = useQuery({
    queryKey: ["aiArenaGateway", "achievements", firstAgent?.id],
    queryFn: () => aiArenaGatewayApi.getAgentAchievements(firstAgent!.id),
    enabled: !!firstAgent?.id,
    staleTime: 60_000,
    retry: false,
  });

  const data = achievementsQ.data;
  const isLoading = myAgentsQ.isLoading || achievementsQ.isLoading;

  // ── Filter achievements ──────────────────────────────────────────────────
  const filteredAchievements = useMemo((): AiArenaAchievement[] => {
    const all = data?.achievements ?? [];
    return all.filter((item) => {
      const matchesTab =
        activeTab === "OVERVIEW" ||
        activeTab === "ALL ACHIEVEMENTS" ||
        (activeTab === "COMPLETED"   && item.unlocked) ||
        (activeTab === "LOCKED"      && !item.unlocked) ||
        (activeTab === "IN PROGRESS" && !item.unlocked && item.progress != null);

      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesTab && matchesSearch && matchesCategory;
    });
  }, [data?.achievements, activeTab, searchQuery, selectedCategory]);

  const visibleAchievements = showAll ? filteredAchievements : filteredAchievements.slice(0, 8);

  // ── Category data ────────────────────────────────────────────────────────
  const categoriesData = useMemo(() => {
    return CATEGORY_META.map((meta) => {
      const found = data?.categories.find((c) => c.name === meta.name);
      return {
        ...meta,
        count: found?.unlockedCount ?? 0,
        total: found?.totalCount ?? 0,
      };
    });
  }, [data?.categories]);

  // ── Recently unlocked ────────────────────────────────────────────────────
  const recentlyUnlocked = useMemo(() => {
    return (data?.achievements ?? [])
      .filter((a) => a.unlocked)
      .slice(0, 5);
  }, [data?.achievements]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = data?.stats;
  const totalPoints     = stats?.totalPoints    ?? 0;
  const unlockedCount   = stats?.unlockedCount  ?? 0;
  const totalCount      = stats?.totalCount     ?? 0;
  const catsCompleted   = stats?.categoriesCompleted ?? 0;
  const totalCats       = stats?.totalCategories    ?? 6;

  const unlockedPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
  const catsPct     = totalCats  > 0 ? Math.round((catsCompleted / totalCats)  * 100) : 0;

  // Next milestone
  const nextMilestone = MILESTONES.find((m) => m.pts > totalPoints) ?? MILESTONES[MILESTONES.length - 1];
  const prevMilestone = MILESTONES[MILESTONES.indexOf(nextMilestone) - 1];
  const milestoneBase = prevMilestone?.pts ?? 0;
  const milestoneRange = nextMilestone.pts - milestoneBase;
  const milestoneProgress = Math.max(0, totalPoints - milestoneBase);
  const milestonePct = milestoneRange > 0 ? Math.round((milestoneProgress / milestoneRange) * 100) : 100;

  return (
    <div className="min-h-full text-foreground bg-transparent">
      {/* Background Glow */}
      <div className="fixed inset-0 z-[-1] pointer-events-none bg-[radial-gradient(circle_at_80%_15%,rgba(155,51,255,0.12),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(33,150,255,0.06),transparent_35%)]" />

      <section className="mx-auto max-w-full px-4 py-5 sm:px-6 lg:px-8 space-y-4">

        {/* Top Title Section */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-tech text-3xl font-bold tracking-tight text-white uppercase">ACHIEVEMENTS</h1>
            <p className="mt-1 text-[11px] text-white/55 font-medium">
              Complete challenges, unlock achievements, and earn exclusive rewards.
            </p>
          </div>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-white/30 mt-1" />}
        </div>

        {/* No agent state */}
        {!isLoading && !firstAgent && (
          <div className="arena-panel p-6 text-center text-sm text-white/45 border-white/8">
            Create an agent to start earning achievements.
          </div>
        )}

        {/* Stats strip */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
          <div className="arena-panel p-4 flex items-center justify-between border-white/8 bg-[#04080f]/90">
            <div className="space-y-1">
              <span className="text-[9px] font-tech font-bold uppercase text-white/40 tracking-wider">ACHIEVEMENT POINTS</span>
              <div className="flex items-center gap-1.5">
                {isLoading ? (
                  <div className="h-7 w-16 animate-pulse rounded bg-white/5" />
                ) : (
                  <span className="font-tech text-xl font-bold text-white">{totalPoints.toLocaleString()}</span>
                )}
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Award className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="arena-panel p-4 flex items-center justify-between border-white/8 bg-[#04080f]/90">
            <div className="space-y-1">
              <span className="text-[9px] font-tech font-bold uppercase text-white/40 tracking-wider">ACHIEVEMENTS UNLOCKED</span>
              <div className="flex items-baseline gap-1">
                {isLoading ? (
                  <div className="h-7 w-20 animate-pulse rounded bg-white/5" />
                ) : (
                  <>
                    <span className="font-tech text-xl font-bold text-white">{unlockedCount} / {totalCount}</span>
                    <span className="text-[10px] text-white/45">{unlockedPct}%</span>
                  </>
                )}
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Trophy className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="arena-panel p-4 flex items-center justify-between border-white/8 bg-[#04080f]/90">
            <div className="space-y-1">
              <span className="text-[9px] font-tech font-bold uppercase text-white/40 tracking-wider">CATEGORIES ACTIVE</span>
              <div className="flex items-baseline gap-1">
                {isLoading ? (
                  <div className="h-7 w-14 animate-pulse rounded bg-white/5" />
                ) : (
                  <>
                    <span className="font-tech text-xl font-bold text-white">{catsCompleted} / {totalCats}</span>
                    <span className="text-[10px] text-white/45">{catsPct}%</span>
                  </>
                )}
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Zap className="h-4.5 w-4.5" />
            </div>
          </div>

          {/* Next Reward Progress */}
          <div className="arena-panel p-4 border-white/8 bg-[#04080f]/90 flex flex-col justify-between">
            <div className="flex justify-between text-[9px] font-tech font-bold uppercase text-white/40 tracking-wider">
              <span>NEXT REWARD</span>
              <span className="text-white/60">{nextMilestone.pts.toLocaleString()} PTS</span>
            </div>
            <div className="space-y-1.5 mt-1.5">
              {isLoading ? (
                <div className="h-5 animate-pulse rounded bg-white/5" />
              ) : (
                <>
                  <div className="flex justify-between items-baseline text-[10px] font-semibold text-white/70">
                    <span>{nextMilestone.crate}</span>
                    <span className="font-tech text-[9px]">{totalPoints.toLocaleString()} / {nextMilestone.pts.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="bg-[#9a35ff] h-full rounded-full transition-all duration-500" style={{ width: `${milestonePct}%` }} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filter Strip */}
        <div className="arena-panel p-3 border-white/8 bg-[#04080f]/95 flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded text-[10px] font-tech font-bold uppercase tracking-wider transition ${
                  activeTab === tab
                    ? "bg-[#9a35ff] text-white"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2 max-sm:w-full">
            <div className="relative max-sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <input
                type="text"
                placeholder="Search achievements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#03070d]/60 border border-white/8 rounded pl-9 pr-4 py-1.5 text-xs text-white placeholder-white/20 focus:border-purple-500/50 outline-none w-[180px] max-sm:w-full transition font-semibold"
              />
            </div>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#03070d]/60 border border-white/8 rounded px-3 py-1.5 text-xs text-white/70 hover:text-white font-semibold outline-none appearance-none pr-8 cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="BATTLES">Battles</option>
                <option value="AGENTS">Agents</option>
                <option value="TRAINING">Training</option>
                <option value="AUTONOMOUS">Autonomous</option>
                <option value="COLLECTION">Collection</option>
                <option value="SPECIAL">Special</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/35 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Main Content Layout Grid */}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_376px]">

          {/* Left Column */}
          <div className="min-w-0 space-y-4">

            {/* Categories progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-tech text-xs uppercase text-white/86 tracking-wider font-semibold">
                  ACHIEVEMENT CATEGORIES
                </h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading
                  ? [0, 1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="arena-panel h-24 animate-pulse border-white/8 bg-[#04080f]/95 rounded-xl" />
                    ))
                  : categoriesData.map((cat) => {
                      const Icon = cat.icon as LucideIcon;
                      const pct = cat.total > 0 ? Math.round((cat.count / cat.total) * 100) : 0;
                      return (
                        <div key={cat.name} className="arena-panel p-4 border-white/8 bg-[#04080f]/95 flex flex-col justify-between space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-tech text-xs font-bold text-white uppercase">{cat.name}</span>
                            <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 ${cat.color}`}>
                              <Icon className="h-3.5 w-3.5 fill-current" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-baseline text-[10px] font-semibold text-white/50">
                              <span className="font-tech font-bold text-white/70">{cat.count} / {cat.total}</span>
                              <span className="font-tech">{pct}%</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className="bg-[#9a35ff] h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
              </div>
            </div>

            {/* Achievements List */}
            <div className="space-y-3">
              <h3 className="font-tech text-xs uppercase text-white/86 tracking-wider font-semibold">
                {activeTab === "OVERVIEW" ? "RECENT ACHIEVEMENTS" : activeTab}
              </h3>

              {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-[#0a0f1b]/95" />
                  ))}
                </div>
              ) : visibleAchievements.length === 0 ? (
                <div className="rounded-xl border border-white/8 bg-[#04080f]/80 px-4 py-8 text-center text-sm text-white/35">
                  {!firstAgent ? "Create an agent to earn achievements." : "No achievements match your filters."}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {visibleAchievements.map((item) => {
                    const Icon = ACHIEVEMENT_ICONS[item.id] ?? Trophy;
                    const style = RARITY_STYLES[item.rarity];
                    const progress = item.progress;
                    const progressPct = progress
                      ? Math.round((progress.current / progress.target) * 100)
                      : item.unlocked ? 100 : 0;

                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl p-5 border bg-gradient-to-br from-[#0a0f1b]/95 to-[#04080f]/95 flex flex-col sm:flex-row items-start gap-4 transition-all duration-300 relative overflow-visible group hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 ${style.border} ${
                          !item.unlocked ? "opacity-60" : ""
                        }`}
                      >
                        {item.unlocked && (
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl pointer-events-none transition group-hover:opacity-100 opacity-50" />
                        )}
                        {!item.unlocked && (
                          <div className="absolute top-3 right-3 bg-black/60 border border-white/10 text-white/50 text-[10px] font-tech font-black px-2 py-1 rounded-md tracking-widest select-none flex items-center gap-1.5 z-10">
                            <Lock className="h-3 w-3" />
                            <span>LOCKED</span>
                          </div>
                        )}

                        <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 relative bg-gradient-to-br shadow-inner ${style.iconBg} ${style.border}`}>
                          <Icon className={`h-7 w-7 fill-current drop-shadow-md ${style.textColor}`} />
                          {item.unlocked && (
                            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 border-4 border-[#04080f] flex items-center justify-center text-white shadow-sm z-10">
                              <CheckCircle className="h-3 w-3 fill-current" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col h-full justify-center">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-bold text-sm text-white leading-tight uppercase truncate drop-shadow-sm">
                              {item.name}
                            </h4>
                            <span className={`text-[9px] font-tech font-bold uppercase tracking-wider ${style.textColor} shrink-0`}>
                              {item.rarity}
                            </span>
                          </div>
                          <p className="text-xs text-white/60 leading-relaxed font-medium mb-2">
                            {item.desc}
                          </p>

                          {/* Progress bar (for locked with progress) */}
                          {!item.unlocked && progress && (
                            <div className="mb-2 space-y-1">
                              <div className="flex justify-between text-[9px] font-tech text-white/40">
                                <span>{progress.current} / {progress.target}</span>
                                <span>{progressPct}%</span>
                              </div>
                              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#9a35ff] h-full rounded-full transition-all duration-500"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="mt-auto flex items-center gap-1.5 text-[11px] font-bold font-tech text-[#b85eff] bg-[#b85eff]/10 self-start px-2.5 py-1 rounded-md border border-[#b85eff]/20">
                            <span className="drop-shadow-sm">+{item.points} PTS</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {filteredAchievements.length > 8 && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="bg-[#0a0f1b]/60 border border-white/8 hover:border-purple-500/35 hover:bg-purple-950/10 text-purple-400 text-[10px] font-tech font-bold uppercase tracking-wider px-6 py-2.5 rounded transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{showAll ? "SHOW LESS" : `VIEW ALL ${filteredAchievements.length} ACHIEVEMENTS`}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAll ? "rotate-180" : ""}`} />
                </button>
              </div>
            )}
          </div>

          {/* Right Column sidebar */}
          <aside className="space-y-4">

            {/* ACHIEVEMENT OVERVIEW Donut Chart */}
            <div className="arena-panel p-5 relative overflow-hidden bg-[#04080f]/95 border-white/8 space-y-4">
              <h3 className="font-tech text-xs uppercase text-white/86 tracking-wider font-semibold">
                ACHIEVEMENT OVERVIEW
              </h3>
              {isLoading ? (
                <div className="h-[150px] animate-pulse rounded-full mx-auto w-[150px] bg-white/5" />
              ) : (
                <DonutChart
                  common={stats?.commonCount ?? 0}
                  rare={stats?.rareCount ?? 0}
                  epic={stats?.epicCount ?? 0}
                  legendary={stats?.legendaryCount ?? 0}
                  totalCommon={stats?.totalCommon ?? 0}
                  totalRare={stats?.totalRare ?? 0}
                  totalEpic={stats?.totalEpic ?? 0}
                  totalLegendary={stats?.totalLegendary ?? 0}
                  unlockedCount={unlockedCount}
                />
              )}
            </div>

            {/* MILESTONE REWARDS */}
            <div className="arena-panel p-5 relative overflow-hidden bg-[#04080f]/95 border-white/8 space-y-4">
              <h3 className="font-tech text-xs uppercase text-white/86 tracking-wider font-semibold">
                MILESTONE REWARDS
              </h3>
              <div className="space-y-3.5">
                {MILESTONES.map((m) => {
                  const claimed = totalPoints >= m.pts;
                  const isNext  = !claimed && MILESTONES.findIndex(x => x.pts > totalPoints) === MILESTONES.indexOf(m);
                  const base    = MILESTONES[MILESTONES.indexOf(m) - 1]?.pts ?? 0;
                  const range   = m.pts - base;
                  const prog    = Math.min(Math.max(0, totalPoints - base), range);
                  const pct     = range > 0 ? Math.round((prog / range) * 100) : 0;

                  return (
                    <div key={m.pts} className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded overflow-hidden border border-white/10 shrink-0 bg-white/5 relative flex items-center justify-center ${!claimed ? "" : ""}`}>
                        <img src={rewardCrate} alt={m.crate} className={`w-8 h-8 object-contain ${claimed ? "opacity-50" : isNext ? "opacity-100" : "opacity-40"}`} />
                        {claimed && (
                          <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <CheckCircle className="h-5 w-5 fill-[#04080f] stroke-2" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5 text-[10px] font-semibold text-white/50">
                        {claimed ? (
                          <div className="flex items-center justify-between">
                            <span className="text-white font-bold leading-none">{m.pts.toLocaleString()} Points</span>
                            <span className="text-emerald-400 font-tech font-bold uppercase tracking-wider">CLAIMED</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-white font-bold leading-none">{m.pts.toLocaleString()} Points</span>
                              <span className={`font-tech font-bold ${isNext ? "text-white/70" : "text-white/30"}`}>
                                {totalPoints.toLocaleString()} / {m.pts.toLocaleString()}
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${isNext ? "bg-[#9a35ff]" : "bg-[#9a35ff]/30"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="leading-none text-[9px] text-white/30 block">{m.crate}</span>
                            </div>
                          </>
                        )}
                        {claimed && <span className="leading-none text-[9px] text-white/30 block">{m.crate}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RECENTLY UNLOCKED feed */}
            <div className="arena-panel p-5 relative overflow-hidden bg-[#04080f]/95 border-white/8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-tech text-xs uppercase text-white/86 tracking-wider font-semibold">
                  RECENTLY UNLOCKED
                </h3>
              </div>
              {isLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-9 animate-pulse rounded-md bg-white/[0.02]" />
                  ))}
                </div>
              ) : recentlyUnlocked.length === 0 ? (
                <p className="text-[10px] text-white/35">No achievements unlocked yet. Win a battle or complete training to get started.</p>
              ) : (
                <div className="space-y-3.5 text-[10px] font-semibold text-white/50">
                  {recentlyUnlocked.map((a) => {
                    const Icon = ACHIEVEMENT_ICONS[a.id] ?? Trophy;
                    const style = RARITY_STYLES[a.rarity];
                    return (
                      <div key={a.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded border flex items-center justify-center shrink-0 ${style.iconBg} ${style.border}`}>
                            <Icon className={`h-3.5 w-3.5 fill-current ${style.textColor}`} />
                          </div>
                          <div className="space-y-0.5 leading-none">
                            <span className="text-white font-bold block uppercase">{a.name}</span>
                            <span className="text-[#b85eff] font-tech font-bold text-[9px]">+{a.points} PTS</span>
                          </div>
                        </div>
                        <span className={`text-[9px] font-tech font-bold uppercase ${style.textColor}`}>{a.rarity}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </aside>
        </div>

      </section>
    </div>
  );
};

export default AchievementsPage;
