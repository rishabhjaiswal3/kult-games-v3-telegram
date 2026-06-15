import agentNexus from "@/assets/agent-nexus.jpg";
import agentShadow from "@/assets/agent-shadow.jpg";
import agentAegis from "@/assets/agent-aegis.jpg";

export const trainingTabs = ["OVERVIEW", "TRAINING SESSIONS", "SKILLS", "EVO LAB"] as const;

export const radarLabels = ["Combat", "Strategy", "Adaptability", "Utility", "Support", "Resilience"];
export const strategyStats = [78, 72, 75, 68, 65, 70];
export const averageStats = [60, 58, 62, 55, 50, 55];

export function getRadarPoints(stats: number[], scale = 1) {
  const center = 100;
  const rMax = 70;
  return stats
    .map((val, i) => {
      const angle = (i * 60 - 90) * (Math.PI / 180);
      const radius = (val / 100) * rMax * scale;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");
}

export const queueSessions = [
  {
    agent: "HYBRID",
    clan: "Zerog",
    image: agentNexus,
    title: "Battle Simulation",
    pct: 68,
    hint: "Improves decision making in PvP",
    time: "01:24:35",
    cost: 50,
  },
  {
    agent: "TACTICIAN",
    clan: "Base",
    image: agentAegis,
    title: "Strategy Analysis",
    pct: 42,
    hint: "Enhances tactic planning",
    time: "02:15:20",
    cost: 40,
  },
  {
    agent: "DEFENDER",
    clan: "Solana",
    image: agentShadow,
    title: "Adaptability Drill",
    pct: 25,
    hint: "Improves in-game adaptation",
    time: "03:45:10",
    cost: 60,
  },
];

export const trainingPrograms = [
  {
    name: "BATTLE SIMULATION",
    desc: "Improve combat skills and decision making in battles.",
    badge: "COMBAT",
    pct: "+20%",
    winRate: "+2% Win Rate",
    color: "border-purple-500/30 text-purple-400 hover:border-purple-500/60 bg-purple-950/10",
  },
  {
    name: "STRATEGY ANALYSIS",
    desc: "Enhance strategy creation and tactical planning.",
    badge: "STRATEGY",
    pct: "+15%",
    winRate: "+3% Tactic Speed",
    color: "border-blue-500/30 text-blue-400 hover:border-blue-500/60 bg-blue-950/10",
  },
  {
    name: "ADAPTABILITY DRILL",
    desc: "Increase adaptability to different opponents.",
    badge: "UTILITY",
    pct: "+10%",
    winRate: "+4% Adaptability",
    color: "border-emerald-500/30 text-emerald-400 hover:border-emerald-500/60 bg-emerald-950/10",
  },
  {
    name: "RESOURCE MANAGEMENT",
    desc: "Optimize resource usage and management.",
    badge: "SUPPORT",
    pct: "+12%",
    winRate: "+1% Resource Gain",
    color: "border-amber-500/30 text-amber-400 hover:border-amber-500/60 bg-amber-950/10",
  },
  {
    name: "MENTAL FORTITUDE",
    desc: "Strengthen resilience and focus under pressure.",
    badge: "SPECIAL",
    pct: "+10%",
    winRate: "+5% Resilience",
    color: "border-pink-500/30 text-pink-400 hover:border-pink-500/60 bg-pink-950/10",
  },
];

export const trainingBoosts = [
  { name: "XP Booster", desc: "+50% XP for next training", count: "x12", icon: "sparkles", color: "purple" },
  { name: "Speed Booster", desc: "-50% training time", count: "x8", icon: "zap", color: "blue" },
  { name: "Focus Booster", desc: "+25% training efficiency", count: "x6", icon: "activity", color: "amber" },
  { name: "Resilience Chip", desc: "Reduces failed training risk", count: "x5", icon: "award", color: "emerald" },
];
