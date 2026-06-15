import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeOpenLoginModal } from "@/lib/loginModalBus";

export function LoginModalHost() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("login") !== "1" || isAuthenticated) return;

    setLoginOpen(true);
    params.delete("login");
    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true }
    );
  }, [location.pathname, location.search, isAuthenticated, navigate]);

  useEffect(() => subscribeOpenLoginModal(() => setLoginOpen(true)), []);

  return <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />;
}
