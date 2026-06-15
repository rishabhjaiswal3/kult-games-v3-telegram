import { playerApi } from "@/api/playerApi";
import { getAllowedChainFromEnv } from "@/lib/chain";

export function buildSiweMessage(address: string, nonce: string): string {
  const domain = window.location.host;
  const uri = window.location.origin;
  const issuedAt = new Date().toISOString();
  const chainId = getAllowedChainFromEnv().decimalChainId;
  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    "",
    "Sign in to Kult Games — your on-chain gaming identity.",
    "",
    `URI: ${uri}`,
    "Version: 1",
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join("\n");
}

export async function fetchSiweNonce(walletAddress: string): Promise<string> {
  const { nonce } = await playerApi.getNonce(walletAddress);
  if (typeof nonce !== "string" || !nonce) {
    throw new Error("Invalid nonce response");
  }
  return nonce;
}
