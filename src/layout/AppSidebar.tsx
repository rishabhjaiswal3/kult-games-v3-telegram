import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Clapperboard, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import zeroGLogo from "@/assets/0G Logo.png";
import kultLogo from "@/assets/Kult Logo.png";

import { useAuth } from "@/contexts/AuthContext";
import { APP_NAV_ITEMS } from "@/layout/navConfig";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  activeLabel?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

/* ─── Navigation links ─── */
function SidebarNav({
  activeLabel,
  isCollapsed,
  onNavigate,
}: {
  activeLabel: string;
  isCollapsed?: boolean;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const visibleNavItems = APP_NAV_ITEMS.filter((item) => !item.requiresAuth || isAuthenticated);

  return (
    <nav className="sidebar-nav min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-1">
      {visibleNavItems.map((item, idx) => {
        const isActive =
          item.label === activeLabel ||
          (item.path !== "/" && location.pathname.startsWith(item.path));

        const sharedClassName = cn(
          "sidebar-nav-item group relative flex min-h-[42px] py-1.5 items-center rounded-lg text-[11px] font-semibold uppercase tracking-[0.08em] transition-all duration-300 font-tech",
          isCollapsed ? "justify-center px-0" : "gap-3.5 px-4",
          isActive
            ? "sidebar-nav-active bg-gradient-to-r from-[#8f27ff]/30 via-[#8f27ff]/10 to-transparent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-[#8f27ff]/20"
            : "text-white/55 hover:text-white hover:bg-white/5 hover:translate-x-1",
        );

        const innerContent = (
          <>
            {isActive && (
              <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full bg-gradient-to-b from-[#c084fc] via-[#9a35ff] to-[#6d28d9] shadow-[0_0_15px_rgba(154,53,255,0.9)]" />
            )}
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                isCollapsed ? "h-10 w-10" : "h-8 w-8",
                isActive
                  ? "bg-[#9a35ff]/20 text-[#c084fc] shadow-[0_0_12px_rgba(154,53,255,0.3)]"
                  : "text-white/45 group-hover:text-white/75 group-hover:bg-white/[0.04]",
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
            </span>
            {!isCollapsed && (
              item.tag ? (
                <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                  <span className="truncate w-full">{item.label}</span>
                  <span className="relative flex items-center gap-1 rounded-full border border-[#9b32ff]/40 bg-[#9b32ff]/15 px-1.5 py-[2px] text-[8px] tracking-widest text-[#c89dff]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#9b32ff]/60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#b95cff]" />
                    </span>
                    <span className="animate-pulse">{item.tag}</span>
                  </span>
                </div>
              ) : (
                <span className="min-w-0 flex-1">{item.label}</span>
              )
            )}
            <span className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-r from-[#9a35ff]/[0.06] to-transparent" />
          </>
        );

        if (item.externalUrl) {
          return (
            <a
              key={item.label}
              href={item.externalUrl}
              onClick={onNavigate}
              title={isCollapsed ? item.label : undefined}
              className={sharedClassName}
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              {innerContent}
            </a>
          );
        }

        return (
          <Link
            key={item.label}
            to={item.path}
            onClick={onNavigate}
            title={isCollapsed ? item.label : undefined}
            className={sharedClassName}
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            {innerContent}
          </Link>
        );
      })}
    </nav>
  );
}

/* ─── Brand header ─── */
function SidebarBrand({
  isCollapsed,
  onToggleCollapse,
}: {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  return (
    <div className={cn("flex items-start", isCollapsed ? "justify-center pt-5 pb-4" : "justify-between px-5 pt-5 pb-4")}>
      {!isCollapsed && (
        <Link to="/" className="group block shrink-0">
          <div className="flex items-center gap-2.5">
            <img src={zeroGLogo} alt="0G" className="h-5 w-auto object-contain transition-all group-hover:drop-shadow-[0_0_8px_rgba(154,53,255,0.5)]" />
            <span className="h-4 w-px bg-gradient-to-b from-transparent via-[#9a35ff]/40 to-transparent" aria-hidden />
            <img src={kultLogo} alt="Kult Games" className="h-5 w-auto object-contain transition-all group-hover:drop-shadow-[0_0_8px_rgba(154,53,255,0.5)]" />
          </div>
          <p className="mt-2.5 font-mono text-[8px] uppercase tracking-[0.32em] text-white/35 transition-colors group-hover:text-white/50">
            Powered by 0G · AI Arena
          </p>
          <div className="mt-3 h-px bg-gradient-to-r from-transparent via-[#9a35ff]/35 to-transparent" />
        </Link>
      )}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className={cn("text-white/50 hover:text-white transition-colors hidden lg:block", isCollapsed && "mt-1")}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      )}
    </div>
  );
}



/* ─── Main Sidebar Component ─── */
export function AppSidebar({ activeLabel = "Home", isCollapsed, onToggleCollapse }: AppSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    const handleClose = () => setIsOpen(false);
    window.addEventListener("toggle-mobile-sidebar", handleToggle);
    window.addEventListener("close-mobile-sidebar", handleClose);
    return () => {
      window.removeEventListener("toggle-mobile-sidebar", handleToggle);
      window.removeEventListener("close-mobile-sidebar", handleClose);
    };
  }, []);

  const { isAuthenticated } = useAuth();

  const sidebarContent = (onNavigate?: () => void) => (
    <>
      <SidebarBrand isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} />
      <SidebarNav activeLabel={activeLabel} isCollapsed={isCollapsed} onNavigate={onNavigate} />

      {/* Studio — sticky bottom */}
      {isAuthenticated && (
        <div className="shrink-0 border-t border-white/5 p-3">
          <a
            href="/studio"
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center rounded-lg bg-gradient-to-r from-[#9a35ff] to-[#7c2bcc] font-tech text-xs font-black uppercase tracking-wider text-white shadow-[0_0_20px_rgba(154,53,255,0.25)] transition-all hover:shadow-[0_0_28px_rgba(154,53,255,0.4)] hover:brightness-110",
              isCollapsed ? "h-10 w-10 justify-center mx-auto" : "justify-center gap-2 px-4 py-2.5",
            )}
          >
            <Clapperboard className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Studio</span>}
          </a>
        </div>
      )}
    </>
  );

  const desktopAside = (
    <aside className={cn("sidebar-shell hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col overflow-hidden transition-[width] duration-300", isCollapsed ? "w-[72px]" : "w-[225px]")}>
      {/* Background layers */}
      <div className="absolute inset-0 bg-[#03070d]/60 backdrop-blur-2xl border-r border-white/5" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(154,53,255,0.15),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(139,37,255,0.1),transparent_50%)]" />

      {/* Right border glow */}
      <div className="absolute right-0 inset-y-0 w-px bg-gradient-to-b from-[#9a35ff]/20 via-white/[0.08] to-[#9a35ff]/10" />
      <div className="pointer-events-none absolute right-0 top-0 h-32 w-px shadow-[0_0_12px_rgba(154,53,255,0.3)]" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col">
        {sidebarContent()}
      </div>
    </aside>
  );

  const mobileDrawer = isOpen ? (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-md"
        onClick={() => setIsOpen(false)}
        aria-hidden
      />
      <aside className="sidebar-shell fixed inset-y-0 left-0 z-50 flex w-[225px] flex-col overflow-hidden animate-in slide-in-from-left duration-300">
        {/* Background layers */}
        <div className="absolute inset-0 bg-[#040810]/[0.98]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(154,53,255,0.08),transparent_60%)]" />

        {/* Right border glow */}
        <div className="absolute right-0 inset-y-0 w-px bg-gradient-to-b from-[#9a35ff]/25 via-white/10 to-[#9a35ff]/10" />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col">
          <div className="flex justify-end p-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="group rounded-lg p-1.5 text-white/45 transition-all hover:bg-white/5 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 transition-transform group-hover:rotate-90" />
            </button>
          </div>
          {sidebarContent(() => setIsOpen(false))}
        </div>
      </aside>
    </div>
  ) : null;

  return (
    <>
      {desktopAside}
      {mobileDrawer}
    </>
  );
}
