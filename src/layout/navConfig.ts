import type { LucideIcon } from "lucide-react";
import {
  Crown,
  Cuboid,
  FileText,
  Gamepad2,
  Home,
  LayoutDashboard,
  Package,
  Sparkles,
  Swords,
  UserRoundCog,
  Trophy,
  Bot,
} from "lucide-react";

export type NavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  tag?: string;
  requiresAuth?: boolean;
};

export const APP_NAV_ITEMS: NavItem[] = [
  { label: "Home", path: "/", icon: Home },
  { label: "AI Arena", path: "/ai-arena", icon: Sparkles },
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, requiresAuth: true },
  { label: "Games", path: "/games", icon: Gamepad2 },
  { label: "My Agents", path: "/my-agents", icon: UserRoundCog, requiresAuth: true },
  { label: "Training", path: "/training", icon: Cuboid },
  { label: "Battles", path: "/battles", icon: Swords },
  { label: "Inventory", path: "/inventory", icon: Package },
  { label: "Moments", path: "/moments", icon: FileText },
  { label: "Autonomous", path: "/autonomous", icon: Bot },
  { label: "Achievements", path: "/achievements", icon: Trophy },
  { label: "Leaderboard", path: "/leaderboard", icon: Crown },
];

export function navLabelForPath(pathname: string): string {
  if (pathname.startsWith("/game/")) return "Games";
  if (pathname === "/") return "Home";
  const item = APP_NAV_ITEMS.find((n) => n.path === pathname);
  return item?.label ?? "Dashboard";
}
