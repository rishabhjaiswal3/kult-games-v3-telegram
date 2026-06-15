import { useMemo } from "react";
import { usePrivy, useSendTransaction, useWallets } from "@privy-io/react-auth";
import { getAllowedChainFromEnv } from "@/lib/chain";

type WalletLike = {
  address?: string;
  getEthereumProvider?: () => Promise<{
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  }>;
  switchChain?: (chainId: number) => Promise<unknown>;
};

type SendTxParams = {
  to: `0x${string}`;
  value: bigint;
  data?: `0x${string}`;
  chainId?: number;
};

type SendTxOptions = {
  address: string;
  uiOptions?: {
    showWalletUIs?: boolean;
  };
};

export const usePrivyWalletTools = () => {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();

  const allowedChain = useMemo(() => getAllowedChainFromEnv(), []);

  const activeWallet = useMemo<WalletLike | null>(() => {
    const wallet = wallets?.[0] as WalletLike | undefined;
    if (wallet?.address) return wallet;
    const userWallet = (user?.wallet as WalletLike | undefined) ?? null;
    return userWallet;
  }, [wallets, user]);

  const canUsePrivy = Boolean(ready && authenticated && activeWallet?.address);

  return {
    privyReady: ready,
    privyAuthenticated: authenticated,
    activeWallet,
    allowedChain,
    canUsePrivy,
    sendPrivyTransaction: sendTransaction as (
      params: SendTxParams,
      options: SendTxOptions
    ) => Promise<{ transactionHash?: string; hash?: string } | string>,
  };
};
