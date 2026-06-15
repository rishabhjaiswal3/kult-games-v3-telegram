import type { LucideIcon } from "lucide-react";
import {
  Home,
  Medal,
  Sparkles,
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
  { label: "AI Arena", path: "/ai-arena", icon: Sparkles },
  { label: "League", path: "/league", icon: Medal },
];

export function navLabelForPath(pathname: string): string {
  if (pathname === "/") return "Home";
  const item = APP_NAV_ITEMS.find((n) => n.path === pathname);
  return item?.label ?? "AI Arena";
}
