export const KULT_AVATARS = [
  { id: "cyber-warrior", label: "Cyber Warrior", color: "#60a5fa" },
  { id: "neon-hunter", label: "Neon Hunter", color: "#fbbf24" },
  { id: "phantom-rogue", label: "Phantom Rogue", color: "#c78aff" },
  { id: "iron-sentinel", label: "Iron Sentinel", color: "#facc15" },
  { id: "byte-ghost", label: "Byte Ghost", color: "#4ade80" },
  { id: "quantum-raider", label: "Quantum Raider", color: "#93c5fd" },
  { id: "void-maven", label: "Void Maven", color: "#f472b6" },
  { id: "nova-pilot", label: "Nova Pilot", color: "#a78bfa" },
] as const;

export type AvatarId = (typeof KULT_AVATARS)[number]["id"];

export const AVATAR_LS_KEY = "kult_selected_avatar";

export function initialsFromName(name: string) {
  const t = name.trim();
  if (!t) return "?";
  const p = t.split(/\s+/).filter(Boolean);
  if (p.length >= 2) return `${p[0][0]}${p[1][0]}`.toUpperCase();
  return t.slice(0, 2).toUpperCase();
}

export function shortWallet(addr: string) {
  if (addr.length < 14) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
