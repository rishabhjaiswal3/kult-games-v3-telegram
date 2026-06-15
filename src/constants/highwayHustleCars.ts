/** Car asset id ↔ Unity `selectedPlayerCarIndex` (matches highway-hustle-frontend). */
export const CAR_ID_TO_INDEX: Record<string, number> = {
  coupe: 0,
  pickup: 5,
  suv: 6,
  van: 7,
  jeep: 8,
  sierra: 9,
  lamborghini: 10,
  ctr: 11,
  muscle: 12,
  f1: 13,
};

export const INDEX_TO_CAR_ID: Record<number, string> = Object.fromEntries(
  Object.entries(CAR_ID_TO_INDEX).map(([id, index]) => [index, id]),
) as Record<number, string>;

/** Free starter vehicles every player owns. */
export const HIGHWAY_STARTER_CAR_IDS = ["coupe", "pickup"] as const;

/** Kult marketplace slugs that may list Highway Hustle vehicles. */
export const HIGHWAY_MARKETPLACE_GAME_IDS = [
  "highway-hustle",
  "highwayhustle",
  "highway_hustle",
] as const;

export function carIdFromIndex(index: number): string {
  return INDEX_TO_CAR_ID[index] ?? "coupe";
}

export function carIndexFromId(carId: string): number | undefined {
  return CAR_ID_TO_INDEX[carId.toLowerCase()];
}

export type HighwayHustleGarageCar = {
  id: string;
  name: string;
  /** From Kult marketplace listing `assetUrl` (same as Inventory page). */
  imageUrl?: string;
  hash?: string;
  price?: string;
  isReward?: boolean;
  isEquipped?: boolean;
};
