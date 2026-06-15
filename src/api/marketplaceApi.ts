import apiClient from "@/lib/apiClient";
import { isRecord, pickNumber, pickString, unwrapApiData } from "@/api/utils";
import type {
  ApiEnvelope,
  MarketplaceCompleteOrderRequest,
  MarketplaceCreateOrderRequest,
  MarketplaceListing,
  MarketplaceListingsResponse,
  MarketplaceOrder,
  MarketplacePrepareOrderRequest,
} from "@/types/api";

export type GetMarketplaceListingsParams = {
  gameIdentification?: string;
  category?: string;
  page?: number;
  perPage?: number;
};

function normalizeObjectId(value: unknown): string {
  if (typeof value === "string") return value;
  if (isRecord(value) && typeof value.$oid === "string") return value.$oid;
  return "";
}

function normalizeListing(rawValue: unknown): MarketplaceListing {
  const raw = isRecord(rawValue) ? rawValue : {};

  return {
    id: normalizeObjectId(raw.id) || normalizeObjectId(raw._id) || pickString(raw.contractItemId) || "",
    name: pickString(raw.name) ?? "",
    shortDescription: pickString(raw.shortDescription, raw.short_description) ?? null,
    longDescription: pickString(raw.longDescription, raw.long_description) ?? null,
    assetUrl: pickString(raw.assetUrl, raw.asset_url) ?? null,
    price: pickNumber(raw.price) ?? 0,
    category: pickString(raw.category) ?? "",
    currency: pickString(raw.currency) ?? "",
    gameIdentification: pickString(raw.gameIdentification, raw.game_identification) ?? "",
    status: pickString(raw.status) ?? "",
    contractItemId: pickString(raw.contractItemId, raw.contract_item_id) ?? null,
    purchaseCalldata: pickString(raw.purchaseCalldata, raw.purchase_calldata) as `0x${string}` | undefined ?? null,
    purchaseContractAddress:
      (pickString(raw.purchaseContractAddress, raw.purchase_contract_address) as `0x${string}` | undefined) ?? null,
    purchaseValueWei: pickString(raw.purchaseValueWei, raw.purchase_value_wei) ?? null,
    purchaseChainId: pickNumber(raw.purchaseChainId, raw.purchase_chain_id) ?? null,
    createdAt: pickString(raw.createdAt, raw.created_at),
    updatedAt: pickString(raw.updatedAt, raw.updated_at),
  };
}

function normalizeOrder(rawValue: unknown): MarketplaceOrder {
  const raw = isRecord(rawValue) ? rawValue : {};

  return {
    id: pickString(raw.id, raw.orderId, raw.order_id) ?? "",
    orderId: pickString(raw.orderId, raw.order_id, raw.id) ?? "",
    listingId: normalizeObjectId(raw.listingId) || normalizeObjectId(raw.listing_id),
    playerId: pickString(raw.playerId, raw.player_id) ?? "",
    buyerWallet: pickString(raw.buyerWallet, raw.buyer_wallet),
    gameIdentification: pickString(raw.gameIdentification, raw.game_identification) ?? "",
    paymentToken: pickString(raw.paymentToken, raw.payment_token),
    pricePaid: pickNumber(raw.pricePaid, raw.price_paid) ?? 0,
    quantity: pickNumber(raw.quantity) ?? 1,
    status: pickString(raw.status) ?? "",
    txHash: pickString(raw.txHash, raw.tx_hash),
    createdAt: pickString(raw.createdAt, raw.created_at),
  };
}

function normalizeListingsResponse(
  payload: unknown,
  fallbackPage: number,
  fallbackPageSize: number,
): MarketplaceListingsResponse {
  const raw = isRecord(payload) ? payload : {};
  const listings = Array.isArray(raw.listings) ? raw.listings.map((listing) => normalizeListing(listing)) : [];
  const total = pickNumber(raw.total, raw.totalCount, raw.count) ?? listings.length;
  const perPage = pickNumber(raw.perPage, raw.pageSize, raw.page_size) ?? fallbackPageSize;

  return {
    listings,
    total,
    page: pickNumber(raw.page) ?? fallbackPage,
    perPage,
    totalPages: pickNumber(raw.totalPages) ?? (total === 0 ? 0 : Math.ceil(total / perPage)),
  };
}

export const marketplaceApi = {
  getListings: async (params: GetMarketplaceListingsParams = {}): Promise<MarketplaceListingsResponse> => {
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 20;
    const { data } = await apiClient.get<ApiEnvelope<unknown>>("/marketplace", {
      params: {
        gameIdentification: params.gameIdentification,
        category: params.category,
        page,
        per_page: perPage,
      },
    });
    return normalizeListingsResponse(unwrapApiData(data), page, perPage);
  },

  getListing: async (id: string): Promise<MarketplaceListing> => {
    const { data } = await apiClient.get<ApiEnvelope<unknown>>(`/marketplace/${id}`);
    return normalizeListing(unwrapApiData(data));
  },

  prepareOrder: async (payload: MarketplacePrepareOrderRequest): Promise<MarketplaceOrder> => {
    const { data } = await apiClient.post<ApiEnvelope<unknown>>("/marketplace/orders/prepare", payload);
    return normalizeOrder(unwrapApiData(data));
  },

  completeOrder: async (payload: MarketplaceCompleteOrderRequest): Promise<void> => {
    await apiClient.post("/marketplace/orders/complete", payload);
  },

  getMyOrders: async (): Promise<MarketplaceOrder[]> => {
    const { data } = await apiClient.get<ApiEnvelope<unknown>>("/marketplace/orders/mine");
    const payload = unwrapApiData(data);
    return Array.isArray(payload) ? payload.map((order) => normalizeOrder(order)) : [];
  },

  createOrder: async (payload: MarketplaceCreateOrderRequest): Promise<MarketplaceOrder> => {
    if (!payload.paymentToken) {
      throw new Error("paymentToken is required to create a marketplace order");
    }

    const prepared = await marketplaceApi.prepareOrder({
      listingId: payload.listingId,
      paymentToken: payload.paymentToken,
      quantity: payload.quantity ?? 1,
    });

    if (payload.txHash) {
      await marketplaceApi.completeOrder({
        orderId: prepared.orderId,
        txHash: payload.txHash,
      });

      return {
        ...prepared,
        status: "completed",
        txHash: payload.txHash,
      };
    }

    return prepared;
  },
};
