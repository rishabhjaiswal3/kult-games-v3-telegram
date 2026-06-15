import { Link, useLocation } from "react-router-dom";
import { Bot, Gamepad2, Home, Package, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV_ITEMS = [
  { label: "Home", path: "/", icon: Home },
  { label: "Games", path: "/games", icon: Gamepad2 },
  { label: "Arena", path: "/ai-arena", icon: Bot },
  { label: "Battles", path: "/battles", icon: Swords },
  { label: "Items", path: "/inventory", icon: Package },
] as const;

export function MobileBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#03070d]/92 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2 shadow-[0_-18px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1 rounded-2xl border border-white/8 bg-white/[0.035] p-1">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive =
            item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              className={cn(
                "flex min-h-[50px] flex-col items-center justify-center gap-1 rounded-xl px-1 font-tech text-[9px] font-bold uppercase tracking-wide transition",
                isActive
                  ? "bg-[#9a35ff]/20 text-white shadow-[0_0_18px_rgba(154,53,255,0.22)]"
                  : "text-white/45 hover:bg-white/5 hover:text-white/80",
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-[#c084fc]")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
