import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Wallet, Globe, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import kultLogo from "@/assets/kult-logo.png";
import {
  useLogin,
  useLoginWithEmail,
  useLoginWithOAuth,
  useLoginWithTelegram,
  usePrivy,
} from "@privy-io/react-auth";
import { privyAuthErrorMessage } from "@/lib/privyAuthErrors";
import { useAuth } from "@/contexts/AuthContext";
import { consumePendingLoginModalRequest } from "@/lib/loginModalBus";
import { isTelegramMiniApp } from "@/lib/telegramMiniApp";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GoogleIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletFlowBusy, setWalletFlowBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [finishingSignIn, setFinishingSignIn] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const walletFlowInFlightRef = useRef(false);
  const telegramWalletLoginIntentKey = "kult_telegram_wallet_login_intent";

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { authenticated, ready, linkWallet } = usePrivy();

  const { sendCode, loginWithCode } = useLoginWithEmail({
    onComplete: () => {
      setFinishingSignIn(true);
    },
    onError: (error) => {
      setFinishingSignIn(false);
      const msg = privyAuthErrorMessage(error);
      if (msg) setAuthError(msg);
    },
  });
  const { initOAuth } = useLoginWithOAuth({
    onComplete: () => {
      setFinishingSignIn(true);
    },
    onError: (error) => {
      setFinishingSignIn(false);
      const msg = privyAuthErrorMessage(error);
      if (msg) setAuthError(msg);
    },
  });
  const { login } = useLogin({
    onComplete: () => {
      walletFlowInFlightRef.current = false;
      setWalletFlowBusy(false);
      /* Chain switch + Kult SIWE run only in AuthContext — avoids duplicate wallet prompts after Privy SIWE. */
      onClose();
    },
    onError: (error) => {
      walletFlowInFlightRef.current = false;
      setWalletFlowBusy(false);
      const msg = privyAuthErrorMessage(error);
      if (msg) setAuthError(msg);
    },
  });
  const { login: loginWithTelegram } = useLoginWithTelegram({
    onComplete: () => setFinishingSignIn(true),
    onError: (error) => {
      setFinishingSignIn(false);
      const msg = privyAuthErrorMessage(error);
      if (msg) setAuthError(msg);
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setAuthError("");
      setRecoveryMode(false);
      setFinishingSignIn(false);
      return;
    }

    const pendingRequest = consumePendingLoginModalRequest();
    if (pendingRequest?.mode === "recover") {
      walletFlowInFlightRef.current = false;
      setOtpSent(false);
      setOtpCode("");
      setLoading(false);
      setWalletFlowBusy(false);
      setRecoveryMode(true);
      setFinishingSignIn(false);
      setAuthError(
        pendingRequest.message ??
          "Sign-in could not finish. Please choose wallet, email, or Google to continue."
      );
      return;
    }

    if (authenticated && !isAuthenticated && !authLoading && !recoveryMode) {
      setFinishingSignIn(true);
    }
    if (finishingSignIn && isAuthenticated && !authLoading) {
      setFinishingSignIn(false);
      onClose();
    }
    if (finishingSignIn && !authenticated && !isAuthenticated && !authLoading) {
      setFinishingSignIn(false);
    }
  }, [
    isOpen,
    authenticated,
    isAuthenticated,
    authLoading,
    finishingSignIn,
    recoveryMode,
    onClose,
  ]);

  useEffect(() => {
    if (!isOpen || !finishingSignIn || authLoading) return;
    const timer = window.setTimeout(() => {
      if (!isAuthenticated) {
        setFinishingSignIn(false);
        setAuthError("Sign-in started but could not complete. Please try again or use wallet login.");
      }
    }, 25_000);
    return () => window.clearTimeout(timer);
  }, [isOpen, finishingSignIn, authLoading, isAuthenticated]);

  const handleWalletAuth = () => {
    if (!ready || walletFlowBusy) return;
    if (isTelegramMiniApp()) {
      sessionStorage.setItem(telegramWalletLoginIntentKey, "1");
    }
    setRecoveryMode(false);
    if (isAuthenticated) {
      linkWallet({ walletChainType: "ethereum-only" });
      return;
    }
    if (authenticated) {
      setAuthError("");
      setFinishingSignIn(true);
      return;
    }
    setWalletFlowBusy(true);
    setAuthError("");
    walletFlowInFlightRef.current = true;
    login({ loginMethods: ["wallet"], walletChainType: "ethereum-only" });
  };

  const handleTelegramAuth = async () => {
    sessionStorage.removeItem(telegramWalletLoginIntentKey);
    setRecoveryMode(false);
    setAuthError("");
    setFinishingSignIn(true);
    try {
      await loginWithTelegram();
    } catch (err) {
      setFinishingSignIn(false);
      const msg = privyAuthErrorMessage(err);
      if (msg) setAuthError(msg);
    }
  };

  const handleSendCode = async () => {
    if (!email) return;
    setLoading(true);
    setRecoveryMode(false);
    setAuthError("");
    try {
      await sendCode({ email });
      setOtpSent(true);
    } catch (err) {
      const msg = privyAuthErrorMessage(err);
      if (msg) setAuthError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!otpCode) return;
    setLoading(true);
    setRecoveryMode(false);
    setAuthError("");
    try {
      await loginWithCode({ code: otpCode });
    } catch (err) {
      const msg = privyAuthErrorMessage(err);
      if (msg) setAuthError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100]"
            style={{
              background: "radial-gradient(ellipse at 50% 40%, hsl(270 82% 15% / 0.3), hsl(220 50% 4% / 0.88))",
              backdropFilter: "blur(12px)",
            }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
            style={{ maxHeight: "100vh" }}
          >
            <div className="relative w-full max-w-md pointer-events-auto">
              {/* Outer ambient glow */}
              <div
                className="absolute -inset-4 -z-10 rounded-[36px] opacity-60"
                style={{
                  background: "radial-gradient(circle at 50% 0%, hsl(270 82% 58% / 0.25), transparent 60%)",
                  filter: "blur(30px)",
                }}
              />

              {/* Card */}
              <div
                className="relative w-full overflow-hidden"
                style={{
                  borderRadius: "24px",
                  border: "1px solid hsl(270 80% 60% / 0.2)",
                  background: "linear-gradient(160deg, hsl(265 48% 12% / 0.98), hsl(220 45% 7% / 0.98))",
                  boxShadow:
                    "0 30px 80px hsl(220 50% 2% / 0.5), 0 0 0 1px hsl(270 80% 60% / 0.08), 0 0 60px hsl(270 82% 58% / 0.08), inset 0 1px 0 hsl(278 100% 82% / 0.08)",
                }}
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-[10%] right-[10%] h-[1px]"
                  style={{
                    background: "linear-gradient(90deg, transparent, hsl(270 80% 65% / 0.6), hsl(195 100% 65% / 0.4), transparent)",
                  }}
                />

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                  style={{
                    borderRadius: "12px",
                    border: "1px solid hsl(210 25% 20% / 0.5)",
                    background: "hsl(220 45% 10% / 0.5)",
                  }}
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="px-6 pb-7 pt-10">
                  {/* Header */}
                  <div className="text-center mb-7">
                    {/* Logo */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="mx-auto mb-6 flex items-center justify-center"
                    >
                      <img 
                        src={kultLogo} 
                        alt="Kult Logo" 
                        className="w-48 h-auto object-contain filter drop-shadow-[0_0_15px_rgba(224,167,255,0.6)]" 
                      />
                    </motion.div>

                    <h2 className="font-display text-2xl font-black tracking-tight text-foreground">
                      Welcome Back
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Sign in to access games, AI features & rankings.
                    </p>
                  </div>

                  {authError ? (
                    <p className="mb-4 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-100/95">
                      {authError}
                    </p>
                  ) : null}

                  {finishingSignIn ? (
                    <motion.div className="flex flex-col items-center gap-3 py-8 text-center">
                      <div className="h-10 w-10 animate-spin rounded-full border-2 border-neon-cyan/30 border-t-neon-cyan" />
                      <p className="text-sm text-muted-foreground">Signing you in…</p>
                      <p className="text-xs text-muted-foreground/70">
                        If a wallet prompt appears, approve it to verify with SIWE.
                      </p>
                    </motion.div>
                  ) : !otpSent ? (
                    <div className="space-y-4">
                      {/* Email input */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                          className="w-full h-12 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-all"
                          style={{
                            borderRadius: "14px",
                            border: "1px solid hsl(210 25% 20% / 0.6)",
                            background: "hsl(220 45% 8% / 0.6)",
                            boxShadow: "inset 0 2px 4px hsl(220 50% 4% / 0.3)",
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = "hsl(270 80% 60% / 0.5)";
                            e.currentTarget.style.boxShadow = "inset 0 2px 4px hsl(220 50% 4% / 0.3), 0 0 0 3px hsl(270 80% 60% / 0.1)";
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = "hsl(210 25% 20% / 0.6)";
                            e.currentTarget.style.boxShadow = "inset 0 2px 4px hsl(220 50% 4% / 0.3)";
                          }}
                        />
                      </div>

                      {/* Send Code button */}
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleSendCode}
                        disabled={loading || !email}
                        className="w-full h-12 font-display font-semibold text-sm tracking-wider btn-eye flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Mail className="w-4 h-4" />
                        {loading ? "Sending..." : "Send Code"}
                      </motion.button>

                      {/* Divider */}
                      <div className="flex items-center gap-3 py-1">
                        <div className="flex-1 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, hsl(210 25% 20% / 0.6), transparent)" }} />
                        <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">or</span>
                        <div className="flex-1 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, hsl(210 25% 20% / 0.6), transparent)" }} />
                      </div>

                      {/* Alt methods */}
                      <div className="grid grid-cols-3 gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleTelegramAuth}
                          disabled={loading || finishingSignIn || !ready}
                          className="h-11 font-medium text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                          style={{
                            borderRadius: "12px",
                            border: "1px solid hsl(195 100% 65% / 0.35)",
                            background: "hsl(195 100% 50% / 0.08)",
                            color: "hsl(210 20% 93%)",
                          }}
                        >
                          <Globe className="w-3.5 h-3.5 text-[hsl(195_100%_65%)]" />
                          Telegram
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleWalletAuth}
                          disabled={loading || walletFlowBusy || !ready}
                          className="h-11 font-medium text-xs flex items-center justify-center gap-2 transition-all group"
                          style={{
                            borderRadius: "12px",
                            border: "1px solid hsl(210 25% 20% / 0.5)",
                            background: "hsl(220 45% 10% / 0.4)",
                            color: "hsl(210 20% 93%)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "hsl(270 80% 60% / 0.4)";
                            e.currentTarget.style.boxShadow = "0 0 15px hsl(270 82% 58% / 0.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "hsl(210 25% 20% / 0.5)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <Wallet className="w-3.5 h-3.5 text-[hsl(195_100%_65%)]" />
                          Wallet
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setRecoveryMode(false);
                            setAuthError("");
                            void initOAuth({ provider: "google" });
                          }}
                          className="h-11 font-medium text-xs flex items-center justify-center gap-2 transition-all"
                          style={{
                            borderRadius: "12px",
                            border: "1px solid hsl(210 25% 20% / 0.5)",
                            background: "hsl(220 45% 10% / 0.4)",
                            color: "hsl(210 20% 93%)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "hsl(270 80% 60% / 0.4)";
                            e.currentTarget.style.boxShadow = "0 0 15px hsl(270 82% 58% / 0.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "hsl(210 25% 20% / 0.5)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <GoogleIcon />
                          Google
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <p className="text-sm text-muted-foreground text-center">
                        Enter the code sent to <span className="text-foreground font-medium">{email}</span>
                      </p>
                      <input
                        type="text"
                        placeholder="000000"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
                        className="w-full h-14 px-4 text-center text-foreground tracking-[0.4em] text-xl font-mono placeholder:text-muted-foreground/30 focus:outline-none transition-all"
                        style={{
                          borderRadius: "16px",
                          border: "1px solid hsl(270 80% 60% / 0.3)",
                          background: "hsl(220 45% 8% / 0.6)",
                          boxShadow: "inset 0 2px 4px hsl(220 50% 4% / 0.3), 0 0 0 3px hsl(270 80% 60% / 0.08)",
                        }}
                      />
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleVerifyCode}
                        disabled={loading || !otpCode}
                        className="w-full h-12 font-display font-semibold text-sm tracking-wider btn-eye flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Verifying..." : "Verify Code"}
                      </motion.button>
                      <button
                        onClick={() => setOtpSent(false)}
                        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        ← Back
                      </button>
                    </div>
                  )}

                  {/* Footer */}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
