import type { CountryCode } from "./FlagHex";

export type UpcomingLeagueMatch = {
  id: string;
  home: CountryCode;
  away: CountryCode;
  time: string;
  displayTime: string;
  stage: string;
  countdown: string;
};

export type LeagueRecentPick = {
  id: string;
  home: CountryCode;
  away: CountryCode;
  pick: string;
  confidence: number;
  result: string;
  outcome: "WIN" | "LOSS" | "DRAW";
  kpEarned: number;
};

export type LeagueMomentFeed = {
  id: string;
  agentName: string;
  agentImg: string;
  text: string;
  kp?: number;
};

export type LeaguePredictionQuestion = {
  id: string;
  question: string;
  category: string;
  agentA: {
    agentName: string;
    pick: string;
    stake: number;
    confidence: number;
  };
  agentB: {
    agentName: string;
    pick: string;
    stake: number;
    confidence: number;
  };
};

export const FEATURED_MATCH = {
  home: { code: "BRA" as CountryCode, label: "Brazil" },
  away: { code: "ARG" as CountryCode, label: "Argentina" },
  countdownSeconds: 8047,
  homeAgent: "ASSASSIN",
  awayAgent: "HYBRID",
  stage: "Group Stage",
  matchday: 2,
  matchNumber: 18,
  venue: "Arena Corinthians · São Paulo",
  predictionPool: 48250,
  totalAgentBets: 1247,
  isLive: true,
  homeScore: 1,
  awayScore: 0,
  liveMinute: 67,
  userAgentPick: {
    agentName: "HYBRID",
    confidence: 78,
    predictedScore: "2 - 1",
    predictedWinner: "Brazil Win",
  },
};

export const KP_WEEK_PROGRESS = {
  current: 2850,
  target: 5000,
  globalRank: 1248,
};

export type LeagueAgentDuel = {
  id: string;
  leftAgent: string;
  rightAgent: string;
  title: string;
  pool: number;
};

export const LEAGUE_AGENT_DUELS: LeagueAgentDuel[] = [
  { id: "d1", leftAgent: "ASSASSIN", rightAgent: "HYBRID", title: "Featured clash", pool: 4820 },
  { id: "d2", leftAgent: "DEFENDER", rightAgent: "SUPPORT", title: "Rivalry rematch", pool: 1250 },
  { id: "d3", leftAgent: "TACTICIAN", rightAgent: "BERSERKER", title: "Mind vs might", pool: 980 },
  { id: "d4", leftAgent: "HYBRID", rightAgent: "TACTICIAN", title: "Meta breaker", pool: 760 },
];

export const FEATURED_MATCH_QUESTIONS: LeaguePredictionQuestion[] = [
  {
    id: "q1",
    category: "Match Result",
    question: "Who wins the match?",
    agentA: { agentName: "ASSASSIN", pick: "Brazil Win", stake: 420, confidence: 78 },
    agentB: { agentName: "HYBRID", pick: "Argentina Win", stake: 380, confidence: 72 },
  },
  {
    id: "q2",
    category: "Goals",
    question: "Total goals — over or under 2.5?",
    agentA: { agentName: "DEFENDER", pick: "Over 2.5", stake: 290, confidence: 82 },
    agentB: { agentName: "TACTICIAN", pick: "Under 2.5", stake: 260, confidence: 66 },
  },
  {
    id: "q3",
    category: "First Half",
    question: "Will Brazil score in the first half?",
    agentA: { agentName: "SUPPORT", pick: "Yes", stake: 210, confidence: 71 },
    agentB: { agentName: "BERSERKER", pick: "No", stake: 195, confidence: 68 },
  },
  {
    id: "q4",
    category: "Margin",
    question: "Will the winner lead by 2+ goals?",
    agentA: { agentName: "HYBRID", pick: "No", stake: 340, confidence: 74 },
    agentB: { agentName: "ASSASSIN", pick: "Yes", stake: 310, confidence: 65 },
  },
  {
    id: "q5",
    category: "Set Pieces",
    question: "First goal from open play vs set piece?",
    agentA: { agentName: "TACTICIAN", pick: "Set Piece", stake: 175, confidence: 69 },
    agentB: { agentName: "DEFENDER", pick: "Open Play", stake: 165, confidence: 63 },
  },
];

export const AGENT_CONSENSUS = {
  homePct: 68,
  awayPct: 32,
  homeLabel: "Brazil",
  awayLabel: "Argentina",
};

export const TODAY_PREDICTIONS = [
  {
    agentName: "DEFENDER",
    quote: "Brazil holds the midfield — Argentina breaks late.",
    confidence: 82,
    pick: "Brazil 2-1",
  },
  {
    agentName: "HYBRID",
    quote: "Chaos factor high. Expect a swing after 70'.",
    confidence: 74,
    pick: "Draw 1-1",
  },
  {
    agentName: "SUPPORT",
    quote: "Argentina's press will force an early goal.",
    confidence: 71,
    pick: "Argentina 2-0",
  },
  {
    agentName: "TACTICIAN",
    quote: "Low tempo opener, Brazil edges set pieces.",
    confidence: 66,
    pick: "Brazil 1-0",
  },
];

export const UPCOMING_MATCHES: UpcomingLeagueMatch[] = [
  {
    id: "m1",
    home: "FRA",
    away: "GER",
    time: "Jun 12 · 18:00",
    displayTime: "Today 8:00 PM",
    stage: "Group Stage",
    countdown: "05:42:18",
  },
  {
    id: "m2",
    home: "ENG",
    away: "POR",
    time: "Jun 12 · 21:00",
    displayTime: "Today 10:30 PM",
    stage: "Group Stage",
    countdown: "08:12:04",
  },
  {
    id: "m3",
    home: "ESP",
    away: "NLD",
    time: "Jun 13 · 17:00",
    displayTime: "Tomorrow 6:00 PM",
    stage: "Group Stage",
    countdown: "26:18:55",
  },
  {
    id: "m4",
    home: "ITA",
    away: "NLD",
    time: "Jun 13 · 20:00",
    displayTime: "Tomorrow 9:00 PM",
    stage: "Group Stage",
    countdown: "29:18:55",
  },
  {
    id: "m5",
    home: "BRA",
    away: "ARG",
    time: "Jun 14 · 20:00",
    displayTime: "Jun 14 · 8:00 PM",
    stage: "Group Stage",
    countdown: "48:06:12",
  },
  {
    id: "m6",
    home: "GER",
    away: "ITA",
    time: "Jun 15 · 15:00",
    displayTime: "Jun 15 · 3:00 PM",
    stage: "Group Stage",
    countdown: "52:10:30",
  },
];

export const RECENT_PICKS: LeagueRecentPick[] = [
  {
    id: "r1",
    home: "BRA",
    away: "ARG",
    pick: "Brazil 3-1",
    confidence: 85,
    result: "3-1",
    outcome: "WIN",
    kpEarned: 420,
  },
  {
    id: "r2",
    home: "FRA",
    away: "GER",
    pick: "Draw 1-1",
    confidence: 72,
    result: "2-1",
    outcome: "LOSS",
    kpEarned: 0,
  },
  {
    id: "r3",
    home: "ESP",
    away: "POR",
    pick: "Spain 2-0",
    confidence: 68,
    result: "2-0",
    outcome: "WIN",
    kpEarned: 310,
  },
  {
    id: "r4",
    home: "ENG",
    away: "FRA",
    pick: "England 1-0",
    confidence: 61,
    result: "1-1",
    outcome: "DRAW",
    kpEarned: 85,
  },
];

export const RIVALRY = {
  leftAgent: "DEFENDER",
  rightAgent: "SUPPORT",
  leftWins: 7,
  rightWins: 6,
  reputationReward: 150,
  kpReward: 250,
};

export const TOP_LEAGUE_ROWS = [
  { rank: 1, agentName: "HYBRID", reputation: 4820, record: "18-2", streak: 6 },
  { rank: 2, agentName: "TACTICIAN", reputation: 4650, record: "16-4", streak: 4 },
  { rank: 3, agentName: "DEFENDER", reputation: 4410, record: "15-5", streak: 3 },
  // { rank: 4, agentName: "BERSERKER", reputation: 4180, record: "14-6", streak: 2 },
];

export const YOUR_LINEUP = [
  { agentName: "HYBRID", reputation: 4820, record: "18-2", arena: 1240 },
  { agentName: "DEFENDER", reputation: 4410, record: "15-5", arena: 980 },
  { agentName: "TACTICIAN", reputation: 3950, record: "12-8", arena: 860 },
];

export const LEAGUE_MOMENTS: LeagueMomentFeed[] = [
  { id: "1", agentName: "DEFENDER", agentImg: "", text: "predicted the upset!", kp: 250 },
  { id: "2", agentName: "HYBRID", agentImg: "", text: "called Brazil set-piece goal", kp: 180 },
  { id: "3", agentName: "SUPPORT", agentImg: "", text: "won rivalry challenge", kp: 150 },
  { id: "4", agentName: "ASSASSIN", agentImg: "", text: "perfect pick streak +5", kp: 320 },
];
