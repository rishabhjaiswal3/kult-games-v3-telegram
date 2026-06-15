import type { ConnectedWallet, User } from "@privy-io/react-auth";

/** True when the Privy user already has any linked EVM wallet (embedded or external). */
export function hasPrivyLinkedWallet(user: User | null | undefined): boolean {
  return Boolean(getWalletAddressFromPrivyUser(user));
}

function isEmbeddedPrivyWallet(walletClientType?: string | null) {
  return walletClientType === "privy" || walletClientType === "privy-v2";
}

/** Prefer embedded Privy wallet (email / Google) then any linked wallet. */
export function getWalletAddressFromPrivyUser(user: User | null | undefined): string | undefined {
  if (!user) return undefined;

  const linked = user.linkedAccounts ?? [];
  const walletAccounts = linked.filter((a): a is Extract<(typeof linked)[number], { type: "wallet" }> => a.type === "wallet");

  const embedded = walletAccounts.find((a) => isEmbeddedPrivyWallet(a.walletClientType));
  if (embedded?.address) return embedded.address;

  const external = walletAccounts.find((a) => a.address);
  if (external?.address) return external.address;

  const smart = linked.find((a): a is Extract<(typeof linked)[number], { type: "smart_wallet" }> => a.type === "smart_wallet");
  if (smart && "address" in smart && smart.address) return smart.address;

  return undefined;
}

/** Merge `user.linkedAccounts` with live `useWallets()` (embedded wallet can appear here first). */
export function resolvePrivyWalletAddress(
  user: User | null | undefined,
  wallets: ConnectedWallet[]
): string | undefined {
  const fromUser = getWalletAddressFromPrivyUser(user);
  if (fromUser) return fromUser;

  const embedded = wallets.find((w) => isEmbeddedPrivyWallet(w.walletClientType));
  if (embedded?.address) return embedded.address;

  return wallets[0]?.address;
}

export function pickSigningWallet(
  wallets: ConnectedWallet[],
  address: string
): ConnectedWallet | undefined {
  const match = wallets.find((w) => w.address.toLowerCase() === address.toLowerCase());
  if (match) return match;

  const embedded = wallets.find((w) => isEmbeddedPrivyWallet(w.walletClientType));
  return embedded ?? wallets[0];
}

export function isEmbeddedPrivyConnectedWallet(wallet: ConnectedWallet | undefined) {
  return isEmbeddedPrivyWallet(wallet?.walletClientType);
}

/**
 * Sign a SIWE message via Privy's wallet API.
 * Embedded wallets must use `wallet.sign` — routing through `window.ethereum` / personal_sign
 * often hangs or returns 4100 when browser wallet extensions are installed.
 */
export async function signMessageWithPrivyWallet(
  wallet: ConnectedWallet,
  message: string,
  address: string,
): Promise<string> {
  if (typeof wallet.sign === "function") {
    try {
      return await wallet.sign(message);
    } catch (err) {
      if (isEmbeddedPrivyConnectedWallet(wallet)) throw err;
    }
  }

  const provider = await wallet.getEthereumProvider();
  try {
    await provider.request({ method: "eth_requestAccounts" });
  } catch {
    /* best-effort */
  }

  return provider.request({
    method: "personal_sign",
    params: [message, address],
  }) as Promise<string>;
}
