import WebApp from "@twa-dev/sdk";

type TelegramWebApp = {
  ready?: () => void;
  expand?: () => void;
  enableClosingConfirmation?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
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
  webApp?.ready?.();
  webApp?.expand?.();
  webApp?.enableClosingConfirmation?.();
  webApp?.setHeaderColor?.("#070a14");
  webApp?.setBackgroundColor?.("#070a14");
}

export function getTelegramDisplayName(): string | undefined {
  const user = getTelegramWebApp()?.initDataUnsafe?.user;
  if (!user) return undefined;
  if (user.username) return user.username;
  return [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || undefined;
}
