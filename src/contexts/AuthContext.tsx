import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getIdentityToken, usePrivy, useWallets } from "@privy-io/react-auth";
import { useCreateWallet } from "@privy-io/react-auth/extended-chains";
import { toast } from "sonner";
import { playerApi } from "@/api/playerApi";
import { TOKEN_KEY, WALLET_KEY } from "@/constants/storageKeys";
import { clearAiAgentInfo } from "@/lib/aiAgentStorage";
import {
  clearAiArenaAuthTokens,
  getAiArenaAccessToken,
  tryExchangePrivyTokenForAiArenaToken,
} from "@/lib/aiArenaAuth";
import { buildSiweMessage, fetchSiweNonce } from "@/lib/siwe";
import { requestOpenLoginModal } from "@/lib/loginModalBus";
import { getAllowedChainFromEnv } from "@/lib/chain";
import { ensureWalletOnAllowedChain } from "@/lib/ensureWalletChain";
import { getTonWalletAddressFromPrivyUser } from "@/lib/privyAccounts";
import {
  getTelegramDisplayName,
  getTelegramWebApp,
  isTelegramMiniApp,
} from "@/lib/telegramMiniApp";
import {
  isEmbeddedPrivyConnectedWallet,
  pickSigningWallet,
  resolvePrivyWalletAddress,
  signMessageWithPrivyWallet,
} from "@/lib/privyWallet";
import type { Player } from "@/types/api";

// ── Context type ──────────────────────────────────────────────────────────────

interface AuthContextValue {
  player: Player | null;
  walletAddress: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Dedupes SIWE across React Strict Mode remounts (refs reset; a second `personal_sign` was still fired). */
const siweInFlightByAddress = new Map<string, Promise<void>>();
const SIGNING_WALLET_WAIT_MS = 20_000;
const SIGNING_WALLET_POLL_MS = 250;
const TELEGRAM_WALLET_LOGIN_INTENT_KEY = "kult_telegram_wallet_login_intent";

function hasTelegramWalletLoginIntent() {
  return sessionStorage.getItem(TELEGRAM_WALLET_LOGIN_INTENT_KEY) === "1";
}

function clearTelegramWalletLoginIntent() {
  sessionStorage.removeItem(TELEGRAM_WALLET_LOGIN_INTENT_KEY);
}

const PERSONAL_SIGN_TIMEOUT_MS = 45_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      window.setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

function isMissingSigningWalletError(error: unknown) {
  return error instanceof Error && error.message === "No Privy wallet available to sign";
}

async function waitForSigningWallet(
  getWallet: () => ReturnType<typeof pickSigningWallet>,
  timeoutMs = SIGNING_WALLET_WAIT_MS,
): Promise<ReturnType<typeof pickSigningWallet>> {
  const startedAt = Date.now();
  let wallet = getWallet();

  while (!wallet && Date.now() - startedAt < timeoutMs) {
    await new Promise((resolve) => window.setTimeout(resolve, SIGNING_WALLET_POLL_MS));
    wallet = getWallet();
  }

  return wallet;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user, getAccessToken, logout: privyLogout } = usePrivy();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();

  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const attemptedTonWalletCreateRef = useRef(false);
  const [hasKultSession, setHasKultSession] = useState(
    () => typeof localStorage !== "undefined" && !!localStorage.getItem(TOKEN_KEY),
  );

  const tonAddress = getTonWalletAddressFromPrivyUser(user);
  const resolvedAddress = resolvePrivyWalletAddress(user, wallets);
  const walletAddress = tonAddress ?? resolvedAddress ?? localStorage.getItem(WALLET_KEY);

  const walletsRef = useRef(wallets);
  useEffect(() => {
    walletsRef.current = wallets;
  }, [wallets]);

  const getAccessTokenRef = useRef(getAccessToken);
  useEffect(() => {
    getAccessTokenRef.current = getAccessToken;
  }, [getAccessToken]);

  const fetchProfile = useCallback(async () => {
    try {
      const p = await playerApi.getProfile();
      setPlayer(p);
    } catch {
      // token may be expired — interceptor clears it on 401
    }
  }, []);

  const telegramLoginInFlightRef = useRef(false);
  useEffect(() => {
    if (!isTelegramMiniApp() || hasTelegramWalletLoginIntent() || player) return;
    if (telegramLoginInFlightRef.current || isLoading) return;

    const existingToken = localStorage.getItem(TOKEN_KEY);
    if (existingToken) {
      void fetchProfile();
      return;
    }

    const initData = getTelegramWebApp()?.initData;
    if (!initData) return;

    telegramLoginInFlightRef.current = true;
    setIsLoading(true);
    void playerApi.loginWithTelegramMiniApp(initData, getTelegramDisplayName())
      .then((result) => setPlayer(result.player))
      .catch((err) => {
        console.error("[TelegramMiniApp] Login failed:", err);
        toast.error("Could not sign in with Telegram. Please reopen the Mini App.");
      })
      .finally(() => {
        telegramLoginInFlightRef.current = false;
        setIsLoading(false);
      });
  }, [player, isLoading, fetchProfile]);

  // Privy may provision embedded wallets a moment after email/Google auth — wait without calling createWallet again.
  useEffect(() => {
    if (!ready || !authenticated || resolvedAddress || tonAddress) return;
    setIsLoading(true);
    const timer = window.setTimeout(() => {
      setIsLoading(false);
      if (!resolvePrivyWalletAddress(user, walletsRef.current)) {
        requestOpenLoginModal({
          mode: "recover",
          message:
            "Your wallet is still being set up. Please wait a moment and try again, or use Wallet login.",
        });
      }
    }, 20_000);
    return () => window.clearTimeout(timer);
  }, [ready, authenticated, resolvedAddress, tonAddress]);

  useEffect(() => {
    if (!ready || !authenticated || !isTelegramMiniApp()) return;
    if (!hasTelegramWalletLoginIntent() && getTelegramWebApp()?.initData) return;

    if (!tonAddress && !attemptedTonWalletCreateRef.current) {
      attemptedTonWalletCreateRef.current = true;
      setIsLoading(true);
      void createWallet({ chainType: "ton" as const })
        .catch((err) => {
          console.error("[TON] Wallet creation failed:", err);
          toast.error("Could not create the TON wallet.");
        })
        .finally(() => setIsLoading(false));
      return;
    }
    if (!tonAddress) return;

    const existingToken = localStorage.getItem(TOKEN_KEY);
    const existingWallet = localStorage.getItem(WALLET_KEY);
    if (existingToken && existingWallet === tonAddress) {
      void fetchProfile();
      return;
    }

    setIsLoading(true);
    void (async () => {
      const identityToken = await getIdentityToken();
      if (!identityToken) throw new Error("Privy identity token is unavailable");
      const result = await playerApi.loginWithPrivyTon(tonAddress, identityToken, {
        name: getTelegramDisplayName(),
      });
      setPlayer(result.player);
      clearTelegramWalletLoginIntent();
    })()
      .catch((err) => {
        console.error("[TON] Login failed:", err);
        playerApi.logout();
        toast.error("Could not verify the TON wallet.");
      })
      .finally(() => setIsLoading(false));
  }, [ready, authenticated, tonAddress, createWallet, fetchProfile]);

  // When Privy authenticates, run the full SIWE flow and AI Arena token exchange.
  useEffect(() => {
    if (!ready) return;
    if (!authenticated) return;
    if (isTelegramMiniApp() && tonAddress) return;
    if (isTelegramMiniApp() && !hasTelegramWalletLoginIntent()) return;

    const address = resolvedAddress;
    if (!address) return;

    const existingToken = localStorage.getItem(TOKEN_KEY);
    const existingWallet = localStorage.getItem(WALLET_KEY);

    if (existingToken && existingWallet?.toLowerCase() === address.toLowerCase()) {
      setHasKultSession(true);
      void fetchProfile();
      if (!getAiArenaAccessToken()) {
        void (async () => {
          const privyAccessToken = await getAccessTokenRef.current();
          if (privyAccessToken) {
            await tryExchangePrivyTokenForAiArenaToken(privyAccessToken);
          }
        })();
      }
      return;
    }

    const addrKey = address.toLowerCase();
    const existingRun = siweInFlightByAddress.get(addrKey);
    if (existingRun) {
      setIsLoading(true);
      void existingRun.finally(() => setIsLoading(false));
      return;
    }

    setIsLoading(true);

    const run = (async () => {
      const nonce = await fetchSiweNonce(address);
      const message = buildSiweMessage(address, nonce);

      const privyWallet = await waitForSigningWallet(() =>
        pickSigningWallet(walletsRef.current, address)
      );
      if (!privyWallet) throw new Error("No Privy wallet available to sign");

      const allowedChain = getAllowedChainFromEnv();
      const embedded = isEmbeddedPrivyConnectedWallet(privyWallet);

      // Embedded wallets stay on Privy's default chain; forcing 0G breaks Google/email login.
      // Chain switch is best-effort — personal_sign works on any chain.
      if (!embedded) {
        try {
          if (typeof privyWallet.switchChain === "function") {
            await privyWallet.switchChain(allowedChain.decimalChainId);
          } else {
            const p = await privyWallet.getEthereumProvider();
            await ensureWalletOnAllowedChain(p, allowedChain);
          }
        } catch {
          /* proceed to sign regardless — chain mismatch doesn't block SIWE */
        }
      }

      const signature = await withTimeout(
        signMessageWithPrivyWallet(privyWallet, message, address),
        PERSONAL_SIGN_TIMEOUT_MS,
        "Wallet signature",
      );

      const res = await playerApi.login(address, message, signature);
      setHasKultSession(true);
      setPlayer(res.player);
      clearTelegramWalletLoginIntent();

      const privyAccessToken = await getAccessTokenRef.current();
      if (privyAccessToken) {
        await tryExchangePrivyTokenForAiArenaToken(privyAccessToken);
      }
    })();

    siweInFlightByAddress.set(addrKey, run);

    void run
      .catch(async (err) => {
        // Kult SIWE succeeded — keep session even if a later optional step failed.
        if (localStorage.getItem(TOKEN_KEY)) {
          setHasKultSession(true);
          console.warn("[SIWE] Post-login step failed (session kept):", err);
          return;
        }

        console.error("[SIWE] Login failed:", err);
        setHasKultSession(false);
        playerApi.logout();

        if (isMissingSigningWalletError(err)) {
          try {
            await privyLogout();
          } catch {
            /* best-effort session reset */
          }

          requestOpenLoginModal({
            mode: "recover",
            message:
              "No wallet was available to finish sign-in. Please choose wallet, email, or Google to continue.",
          });
          toast.error(
            "No wallet was available to finish sign-in. Please choose wallet, email, or Google to continue."
          );
          return;
        }

        // For all other failures (timeout, rejection, backend error) reset the modal so the
        // spinner doesn't stay stuck — authenticated stays true but isAuthenticated is false,
        // so the modal has no other path to clear finishingSignIn.
        const message =
          err instanceof Error && err.message.includes("timed out")
            ? "The wallet prompt timed out. Please try again and approve the signature request."
            : "Could not finish sign-in. Please try again.";
        requestOpenLoginModal({ mode: "recover", message });
        toast.error(message);
      })
      .finally(() => {
        setIsLoading(false);
        if (siweInFlightByAddress.get(addrKey) === run) {
          siweInFlightByAddress.delete(addrKey);
        }
      });
  }, [ready, authenticated, resolvedAddress, wallets, fetchProfile, tonAddress]);

  const handleLogout = async () => {
    siweInFlightByAddress.clear();
    clearTelegramWalletLoginIntent();
    playerApi.logout();
    clearAiArenaAuthTokens();
    clearAiAgentInfo();
    setHasKultSession(false);
    setPlayer(null);
    await privyLogout();
  };

  return (
    <AuthContext.Provider
      value={{
        player,
        walletAddress,
        isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
        isLoading: (!ready && !isTelegramMiniApp()) || isLoading,
        login: requestOpenLoginModal,
        logout: handleLogout,
        refetchProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
