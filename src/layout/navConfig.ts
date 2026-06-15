import type { LucideIcon } from "lucide-react";
import {
  Crown,
  FileText,
  Gamepad2,
  Home,
  Medal,
  Package,
  Sparkles,
  Trophy,
} from "lucide-react";

export type NavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  tag?: string;
  requiresAuth?: boolean;
  /** When set, clicking the item navigates to this external URL instead of the internal path. */
  externalUrl?: string;
};

export const APP_NAV_ITEMS: NavItem[] = [
  { label: "Home", path: "/", icon: Home },
  { label: "League", path: "/league", icon: Medal },
  { label: "AI Arena", path: "/ai-arena", icon: Sparkles },
  { label: "Games", path: "/games", icon: Gamepad2 },
  { label: "Moments", path: "/moments", icon: FileText },
  { label: "Inventory", path: "/inventory", icon: Package },
  { label: "Achievements", path: "/achievements", icon: Trophy },
  { label: "Leaderboard", path: "/leaderboard", icon: Crown },
];

export function navLabelForPath(pathname: string): string {
  if (pathname.startsWith("/game/")) return "Games";
  if (pathname === "/") return "Home";
  const item = APP_NAV_ITEMS.find((n) => n.path === pathname);
  return item?.label ?? "Dashboard";
}
