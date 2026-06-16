import WebApp from "@twa-dev/sdk";

type TelegramWebApp = {
  ready?: () => void;
  expand?: () => void;
  requestFullscreen?: () => void;
  enableClosingConfirmation?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  onEvent?: (event: string, callback: () => void) => void;
  offEvent?: (event: string, callback: () => void) => void;
  viewportHeight?: number;
  viewportStableHeight?: number;
  BackButton?: {
    show?: () => void;
    hide?: () => void;
    onClick?: (callback: () => void) => void;
    offClick?: (callback: () => void) => void;
  };
  HapticFeedback?: {
    impactOccurred?: (style: "light" | "medium" | "heavy") => void;
  };
  initData?: string;
  initDataUnsafe?: {
    user?: {
      first_name?: string;
      last_name?: string;
      username?: string;
    };
  };
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return (WebApp as TelegramWebApp | undefined) ?? window.Telegram?.WebApp ?? null;
}

export function isTelegramMiniApp(): boolean {
  return Boolean(getTelegramWebApp()?.initData);
}

export function initTelegramMiniApp() {
  const webApp = getTelegramWebApp();
  if (!webApp?.initData) return;

  webApp?.ready?.();
  webApp?.expand?.();
  try {
    webApp?.requestFullscreen?.();
  } catch {
    /* Fullscreen is unavailable on older Telegram clients. */
  }
  webApp?.enableClosingConfirmation?.();
  webApp?.setHeaderColor?.("#070a14");
  webApp?.setBackgroundColor?.("#070a14");

  if (!webApp || typeof document === "undefined") return;

  const syncViewport = () => {
    const height = webApp.viewportStableHeight ?? webApp.viewportHeight;
    if (height) {
      document.documentElement.style.setProperty("--tg-viewport-height", `${height}px`);
    }
  };

  document.documentElement.classList.add("telegram-mini-app");
  syncViewport();
  webApp.onEvent?.("viewportChanged", syncViewport);
}

export function bindTelegramBackButton(onBack: () => void) {
  const backButton = getTelegramWebApp()?.BackButton;
  if (!backButton) return () => undefined;

  backButton.onClick?.(onBack);
  backButton.show?.();

  return () => {
    backButton.offClick?.(onBack);
    backButton.hide?.();
  };
}

export function telegramImpact(style: "light" | "medium" | "heavy" = "light") {
  getTelegramWebApp()?.HapticFeedback?.impactOccurred?.(style);
}

export function getTelegramDisplayName(): string | undefined {
  const user = getTelegramWebApp()?.initDataUnsafe?.user;
  if (!user) return undefined;
  if (user.username) return user.username;
  return [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || undefined;
}
