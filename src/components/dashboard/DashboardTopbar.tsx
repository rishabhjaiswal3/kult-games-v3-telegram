import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Bell, Clapperboard, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { requestOpenLoginModal } from "@/lib/loginModalBus";
import dashboardAvatar from "@/assets/dashboard-avatar.png";

export function DashboardTopbar() {
  const [openPanel, setOpenPanel] = useState<"notifications" | null>(null);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const { isAuthenticated, logout } = useAuth();
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenPanel(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const togglePanel = (panel: "notifications") => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };

  const handleConnectWallet = () => {
    if (isAuthenticated) {
      void logout();
      setOpenPanel(null);
      return;
    }
    setOpenPanel(null);
    requestOpenLoginModal();
  };

  return (
    <>
      <header ref={containerRef} className="relative z-30 shrink-0 border-b border-white/10 bg-[#03070d]/88 backdrop-blur-xl">
        <div className="relative mx-auto flex min-h-[58px] max-w-full flex-nowrap items-center justify-between gap-1.5 px-3 py-2 sm:min-h-[68px] sm:gap-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden sm:gap-3">
            <Link to="/dashboard" aria-label="Open dashboard" className="shrink-0 sm:hidden">
              <img
                src={dashboardAvatar}
                alt="Profile"
                className="h-9 w-9 rounded-lg border border-[#8b27ff]/40 object-cover transition hover:border-[#b54cff]"
              />
            </Link>
          </div>
          <div className="flex min-w-0 shrink-0 items-center justify-end gap-1.5 sm:gap-3">
            {isAuthenticated && (
              <a
                href="/studio"
                className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center gap-2 rounded-md bg-[#9a35ff] px-0 font-tech text-[11px] font-black uppercase tracking-wider text-white transition hover:brightness-110 min-[430px]:w-auto min-[430px]:px-4 sm:text-xs"
              >
                <Clapperboard className="h-4 w-4" />
                <span className="hidden min-[430px]:inline">Studio</span>
              </a>
            )}
            <Link to="/dashboard" aria-label="Open dashboard" className="hidden shrink-0 sm:block">
              <img
                src={dashboardAvatar}
                alt="Profile"
                className="h-9 w-9 rounded-lg border border-[#8b27ff]/40 object-cover transition hover:border-[#b54cff] sm:h-10 sm:w-10"
              />
            </Link>
            <button
              type="button"
              onClick={() => {
                togglePanel("notifications");
                setHasUnreadNotifications(false);
              }}
              className="relative hidden shrink-0 rounded-md p-1.5 text-white/70 transition hover:bg-white/5 hover:text-white min-[380px]:block sm:p-2"
              aria-label="Open notifications"
            >
              <Bell className="h-5 w-5" />
              {hasUnreadNotifications && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#8b29ff]" />
              )}
            </button>
            <button
              type="button"
              onClick={handleConnectWallet}
              className={isAuthenticated 
                ? "block shrink-0 rounded-md bg-gradient-to-b from-[#1a0a14] to-[#0a0306] border border-red-500/20 px-2 py-2.5 font-tech text-[10px] text-red-400 transition-all hover:border-red-500/50 hover:from-red-950/40 hover:to-red-900/40 hover:text-red-300 hover:shadow-[0_0_12px_rgba(220,38,38,0.2)] min-[430px]:px-3 sm:px-5 sm:py-3 sm:text-[11px]"
                : "btn-primary block shrink-0 rounded-md px-2 py-2.5 font-tech text-[10px] min-[430px]:px-3 sm:px-5 sm:py-3 sm:text-[11px]"
              }
            >
              <span className="hidden min-[430px]:inline">{isAuthenticated ? "DISCONNECT" : "CONNECT WALLET"}</span>
              <span className="min-[430px]:hidden">{isAuthenticated ? "LOGOUT" : "LOGIN"}</span>
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"))}
              className="shrink-0 rounded-md p-1.5 text-white/72 transition hover:bg-white/5 hover:text-white sm:p-2 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
        {openPanel && (
          <div className="absolute right-4 top-full z-50 w-[calc(100vw-2rem)] max-w-sm rounded-md border border-white/12 bg-[#060b15] p-4 shadow-2xl shadow-black/40 sm:right-6 lg:right-8">
            {openPanel === "notifications" && (
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/65">Notifications</span>
                  <button
                    type="button"
                    onClick={() => setOpenPanel(null)}
                    className="text-xs font-semibold text-[#b65cff] hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-3 space-y-3 text-sm">
                  <Link to="/ai-arena" className="block rounded border border-white/8 bg-white/[0.02] p-3 hover:bg-white/5">
                    HYBRID battle result is ready
                  </Link>
                  <Link to="/ai-arena" className="block rounded border border-white/8 bg-white/[0.02] p-3 hover:bg-white/5">
                    Training slot completed
                  </Link>
                  <Link to="/leaderboard" className="block rounded border border-white/8 bg-white/[0.02] p-3 hover:bg-white/5">
                    New achievement progress unlocked
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
}
