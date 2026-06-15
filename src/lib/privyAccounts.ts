type LinkedAccount = {
  type?: string;
  address?: string;
  chainType?: string;
  chain_type?: string;
};

export function getTonWalletAddressFromPrivyUser(user: unknown): string | undefined {
  const accounts = (user as { linkedAccounts?: LinkedAccount[] } | null)?.linkedAccounts;
  return accounts?.find((account) => {
    const chainType = account.chainType ?? account.chain_type;
    return account.type === "wallet" && chainType === "ton" && Boolean(account.address);
  })?.address;
}
