import { StorageKeys } from "@/constants/storageKeys";

export function saveTrackedAiArenaBattleId(battleId: string | null) {
  if (typeof localStorage === "undefined") return;
  if (!battleId) {
    localStorage.removeItem(StorageKeys.local.aiArenaLastBattleId);
    return;
  }
  localStorage.setItem(StorageKeys.local.aiArenaLastBattleId, battleId);
}

export function getTrackedAiArenaBattleId(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(StorageKeys.local.aiArenaLastBattleId);
}
