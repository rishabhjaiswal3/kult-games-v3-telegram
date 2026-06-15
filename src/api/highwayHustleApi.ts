import { marketplaceApi } from "@/api/marketplaceApi";
import { isRecord, pickNumber, pickString } from "@/api/utils";
import {
  carIdFromIndex,
  HIGHWAY_MARKETPLACE_GAME_IDS,
  HIGHWAY_STARTER_CAR_IDS,
  type HighwayHustleGarageCar,
} from "@/constants/highwayHustleCars";
import type { MarketplaceListing } from "@/types/api";

const DEFAULT_API_URL = "https://highway-hustle-backend.onrender.com/api";

function getBaseUrl(): string {
  const raw = import.meta.env.VITE_HIGHWAY_HUSTLE_API_URL as string | undefined;
  return (raw?.trim() || DEFAULT_API_URL).replace(/\/$/, "");
}

function normalizeWallet(wallet: string): string {
  return wallet.trim().toLowerCase();
}

export type HighwayMarketplaceAsset = {
  id: string;
  name: string;
  hash: string;
  price: string;
  imageFile?: string;
};

export type HighwayReward = {
  rewardId: string;
  rewardType?: string;
  note?: string;
  status?: string;
};

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function unwrapSuccess(payload: unknown): Record<string, unknown> | null {
  if (!isRecord(payload)) return null;
  if (payload.success === false) return null;
  return payload;
}

/** Catalog from `GET /marketplace/assets` (public). */
export async function getMarketplaceAssets(pageSize = 100): Promise<HighwayMarketplaceAsset[]> {
  const response = await fetch(`${getBaseUrl()}/marketplace/assets?pageSize=${pageSize}`);
  const payload = unwrapSuccess(await parseJson(response));
  if (!payload || !Array.isArray(payload.assets)) return [];

  return payload.assets
    .map((raw) => {
      if (!isRecord(raw)) return null;
      const id = pickString(raw.id);
      if (!id) return null;
      return {
        id,
        name: pickString(raw.name) ?? id.toUpperCase(),
        hash: pickString(raw.hash) ?? "",
        price: pickString(raw.price) ?? "0",
        imageFile: pickString(raw.imageFile),
      } satisfies HighwayMarketplaceAsset;
    })
    .filter((item): item is HighwayMarketplaceAsset => item !== null);
}

/** Owned asset ids from `GET /marketplace/user/:wallet/purchases` (public). */
export async function getUserPurchases(wallet: string): Promise<string[]> {
  const identifier = normalizeWallet(wallet);
  if (!identifier) return [...HIGHWAY_STARTER_CAR_IDS];

  const response = await fetch(`${getBaseUrl()}/marketplace/user/${encodeURIComponent(identifier)}/purchases`);
  const payload = unwrapSuccess(await parseJson(response));
  const purchases = Array.isArray(payload?.purchases)
    ? payload.purchases.map((id) => String(id).toLowerCase())
    : [];

  return [...new Set([...HIGHWAY_STARTER_CAR_IDS, ...purchases])];
}

/** Contest / cross-game rewards from `GET /player/rewards?user=` (public). */
export async function getRewards(wallet: string): Promise<HighwayReward[]> {
  const identifier = normalizeWallet(wallet);
  if (!identifier) return [];

  const response = await fetch(`${getBaseUrl()}/player/rewards?user=${encodeURIComponent(identifier)}`);
  const payload = unwrapSuccess(await parseJson(response));
  if (!payload || !Array.isArray(payload.rewards)) return [];

  return payload.rewards
    .map((raw) => {
      if (!isRecord(raw)) return null;
      const rewardId = pickString(raw.rewardId);
      if (!rewardId) return null;
      return {
        rewardId: rewardId.toLowerCase(),
        rewardType: pickString(raw.rewardType),
        note: pickString(raw.note),
        status: pickString(raw.status),
      } satisfies HighwayReward;
    })
    .filter((item): item is HighwayReward => item !== null);
}

/** Equipped car index via public `GET /player/all?user=` (no HH JWT required). */
export async function getEquippedCarIndex(wallet: string): Promise<number> {
  const identifier = normalizeWallet(wallet);
  if (!identifier) return 0;

  const response = await fetch(`${getBaseUrl()}/player/all?user=${encodeURIComponent(identifier)}`);
  const payload = unwrapSuccess(await parseJson(response));
  const data = isRecord(payload?.data) ? payload.data : null;
  const vehicle = isRecord(data?.playerVehicleData) ? data.playerVehicleData : null;
  return pickNumber(vehicle?.selectedPlayerCarIndex) ?? 0;
}

/** Equip car via public `POST /player/vehicle?user=` (syncs to Unity on next launch). */
export async function equipVehicle(wallet: string, selectedPlayerCarIndex: number): Promise<void> {
  const identifier = normalizeWallet(wallet);
  if (!identifier) throw new Error("Wallet address required");

  const response = await fetch(
    `${getBaseUrl()}/player/vehicle?user=${encodeURIComponent(identifier)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedPlayerCarIndex }),
    },
  );

  const payload = await parseJson(response);
  if (!isRecord(payload) || payload.success !== true) {
    const message = isRecord(payload) ? pickString(payload.error) : undefined;
    throw new Error(message ?? "Failed to equip vehicle");
  }
}

function normalizeListingKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

/** Reuse Kult Inventory marketplace `assetUrl` keyed by HH vehicle id. */
export function buildHighwayListingImageMap(listings: MarketplaceListing[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const listing of listings) {
    const assetUrl = listing.assetUrl?.trim();
    if (!assetUrl) continue;

    if (listing.contractItemId) {
      map.set(listing.contractItemId.toLowerCase(), assetUrl);
      map.set(normalizeListingKey(listing.contractItemId), assetUrl);
    }

    const nameKey = normalizeListingKey(listing.name);
    if (nameKey) map.set(nameKey, assetUrl);
  }

  return map;
}

export async function fetchHighwayListingImages(): Promise<Map<string, string>> {
  const responses = await Promise.all(
    HIGHWAY_MARKETPLACE_GAME_IDS.map((gameIdentification) =>
      marketplaceApi.getListings({ gameIdentification, page: 1, perPage: 100 }).catch(() => ({
        listings: [],
        total: 0,
        page: 1,
        perPage: 100,
        totalPages: 0,
      })),
    ),
  );

  return buildHighwayListingImageMap(responses.flatMap((response) => response.listings));
}

function resolveCarImageUrl(carId: string, listingImages: Map<string, string>): string | undefined {
  const key = carId.toLowerCase();
  return (
    listingImages.get(key) ??
    listingImages.get(normalizeListingKey(key)) ??
    undefined
  );
}

export function buildGarageCars(input: {
  catalog: HighwayMarketplaceAsset[];
  ownedIds: string[];
  rewardIds: string[];
  equippedCarIndex: number;
  listingImages: Map<string, string>;
}): HighwayHustleGarageCar[] {
  const { catalog, ownedIds, rewardIds, equippedCarIndex, listingImages } = input;
  const equippedId = carIdFromIndex(equippedCarIndex);
  const rewardSet = new Set(rewardIds.map((id) => id.toLowerCase()));
  const ownedSet = new Set(ownedIds.map((id) => id.toLowerCase()));
  const catalogById = new Map(catalog.map((asset) => [asset.id.toLowerCase(), asset]));

  const cars: HighwayHustleGarageCar[] = [];

  for (const id of ownedSet) {
    const asset = catalogById.get(id);
    cars.push({
      id,
      name: asset?.name ?? id.toUpperCase(),
      imageUrl: resolveCarImageUrl(id, listingImages),
      hash: asset?.hash,
      price: asset?.price,
      isReward: rewardSet.has(id),
      isEquipped: id === equippedId,
    });
  }

  cars.sort((a, b) => {
    if (a.isEquipped !== b.isEquipped) return a.isEquipped ? -1 : 1;
    if (a.isReward !== b.isReward) return a.isReward ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return cars;
}

/** Load catalog + ownership + rewards + equipped state in one call. */
export async function getGarageState(wallet: string) {
  const [catalog, ownedIds, rewards, equippedCarIndex, listingImages] = await Promise.all([
    getMarketplaceAssets(),
    getUserPurchases(wallet),
    getRewards(wallet),
    getEquippedCarIndex(wallet),
    fetchHighwayListingImages(),
  ]);

  const rewardIds = rewards.map((r) => r.rewardId);
  const mergedOwned = [...new Set([...ownedIds, ...rewardIds])];

  return {
    catalog,
    rewards,
    rewardIds,
    equippedCarIndex,
    equippedCarId: carIdFromIndex(equippedCarIndex),
    listingImages,
    cars: buildGarageCars({
      catalog,
      ownedIds: mergedOwned,
      rewardIds,
      equippedCarIndex,
      listingImages,
    }),
  };
}
