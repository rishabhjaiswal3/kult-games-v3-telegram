import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Menu, User } from "lucide-react";
import { subscribeOpenLoginModal } from "@/lib/loginModalBus";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppTopbar() {
  const { isAuthenticated, walletAddress, player, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (location.search.includes("login=1") && !isAuthenticated) {
      setLoginOpen(true);
    }
  }, [location.search, isAuthenticated]);

  useEffect(() => subscribeOpenLoginModal(() => setLoginOpen(true)), []);

  const handleLogin = useCallback(() => {
    if (location.pathname === "/") {
      setLoginOpen(true);
      return;
    }
    navigate("/?login=1");
  }, [location.pathname, navigate]);

  const displayName =
    player?.name?.trim() ||
    (walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : "Player");

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#03070d]/88 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[58px] max-w-full flex-nowrap items-center justify-between gap-2 px-3 py-2 sm:min-h-[68px] sm:flex-wrap sm:gap-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link to="/" className="truncate font-tech text-lg font-bold sm:text-xl lg:hidden">
              KULT <span className="text-[#9a35ff]">GAMES</span>
            </Link>
            <span className="hidden sm:inline font-tech text-[10px] uppercase tracking-[0.2em] text-white/45">
              Browser gaming · AI Arena
            </span>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-1.5 sm:flex-wrap sm:gap-3">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  type="button"
                  className="flex h-10 items-center gap-2 rounded-md border border-white/12 bg-white/[0.02] px-3 font-tech text-xs text-white/86 transition hover:bg-white/6"
                >
                  <User className="h-4 w-4" />
                  <span className="max-w-[120px] truncate">{displayName}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border-white/10 bg-[#060b15]">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">Dashboard & agents</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/ai-arena">AI Arena</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                type="button"
                onClick={handleLogin}
                className="btn-arena-primary rounded-md px-3 py-2.5 font-tech text-[10px] sm:px-4 sm:text-[11px]"
              >
                CONNECT WALLET
              </button>
            )}

            <button
              type="button"
              className="relative hidden rounded-md p-2 text-white/70 transition hover:bg-white/5 hover:text-white min-[380px]:block"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#8b29ff]" />
            </button>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"))}
              className="rounded-md p-2 text-white/72 transition hover:bg-white/5 hover:text-white lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
