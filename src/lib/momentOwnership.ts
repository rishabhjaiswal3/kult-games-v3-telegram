export function isMomentOwner(
  walletAddress: string | null | undefined,
  moment: { playerWalletAddress: string },
): boolean {
  if (!walletAddress?.trim()) return false;
  return walletAddress.trim().toLowerCase() === moment.playerWalletAddress.trim().toLowerCase();
}
