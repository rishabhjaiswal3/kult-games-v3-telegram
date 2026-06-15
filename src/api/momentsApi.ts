import apiClient from "@/lib/apiClient";
import { isRecord, pickNumber, pickString, unwrapApiData } from "@/api/utils";
import type {
  ApiEnvelope,
  CreateMomentRequest,
  CreateMomentResponse,
  Moment,
  MomentDaEvent,
  MomentDaEventsResponse,
  MomentLikeResponse,
  MomentMutationResponse,
  MomentsFeedResponse,
  MomentZgProofResponse,
  UpdateMomentRequest,
} from "@/types/api";

type ListMomentsParams = {
  page?: number;
  perPage?: number;
  tags?: string[];
  searchQuery?: string;
  mediaType?: "image" | "video";
};

type PresignUploadResponse = {
  upload_url: string;
  public_url: string;
  required_headers: Record<string, string>;
};

type MomentAssetMetadata = {
  mediaType: "image" | "video";
  fileType: string;
  fileSizeBytes: number;
  durationMs?: number;
  width?: number;
  height?: number;
};

type CreateMomentFromFileInput = Omit<CreateMomentRequest, "assetUrl" | "assetMetadata"> & {
  assetFile: File;
  assetMetadata?: Record<string, unknown>;
};

const MAX_VIDEO_DURATION_MS = 120_000;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
  "image/svg+xml", "image/bmp", "image/tiff", "image/avif", "image/heic", "image/heif",
]);
const SUPPORTED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const DEFAULT_ASSET_CONTENT_TYPE = "application/octet-stream";

function normalizeMoment(rawValue: unknown): Moment {
  const raw = isRecord(rawValue) ? rawValue : {};

  return {
    momentId: pickString(raw.momentId, raw.moment_id) ?? "",
    playerWalletAddress: pickString(raw.playerWalletAddress, raw.player_wallet_address) ?? "",
    assetUrl: pickString(raw.assetUrl, raw.asset_url),
    assetMetadata: isRecord(raw.assetMetadata) ? raw.assetMetadata : undefined,
    assetZgUrl: pickString(raw.assetZgUrl, raw.asset_zg_url),
    title: pickString(raw.title) ?? "",
    description: pickString(raw.description),
    tags: Array.isArray(raw.tags) ? raw.tags.filter((value): value is string => typeof value === "string") : [],
    relatedGames: Array.isArray(raw.relatedGames)
      ? raw.relatedGames.filter((value): value is string => typeof value === "string")
      : [],
    socialMediaLinks: isRecord(raw.socialMediaLinks) ? raw.socialMediaLinks : undefined,
    numLikes: pickNumber(raw.numLikes, raw.num_likes) ?? 0,
    numComments: pickNumber(raw.numComments, raw.num_comments) ?? 0,
    aiCaption: pickString(raw.aiCaption, raw.ai_caption),
    aiRankScore: pickNumber(raw.aiRankScore, raw.ai_rank_score),
    aiHighlights: Array.isArray(raw.aiHighlights)
      ? raw.aiHighlights.filter((value): value is string => typeof value === "string")
      : [],
    aiStatus: pickString(raw.aiStatus, raw.ai_status),
    aiMomentType: pickString(raw.aiMomentType, raw.ai_moment_type),
    aiSkillScore: pickNumber(raw.aiSkillScore, raw.ai_skill_score),
    aiReactionQuality: pickString(raw.aiReactionQuality, raw.ai_reaction_quality),
    aiRarity: pickString(raw.aiRarity, raw.ai_rarity),
    assetZgHash: pickString(raw.assetZgHash, raw.asset_zg_hash),
    assetZgTxHash: pickString(raw.assetZgTxHash, raw.asset_zg_tx_hash),
    metadataZgHash: pickString(raw.metadataZgHash, raw.metadata_zg_hash),
    metadataZgTxHash: pickString(raw.metadataZgTxHash, raw.metadata_zg_tx_hash),
    zgStatus: pickString(raw.zgStatus, raw.zg_status),
    zgError: pickString(raw.zgError, raw.zg_error),
    zgUploadedAt: pickString(raw.zgUploadedAt, raw.zg_uploaded_at),
    createdAt: pickString(raw.createdAt, raw.created_at),
    updatedAt: pickString(raw.updatedAt, raw.updated_at),
  };
}

function sanitizeFilenameSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function inferExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) return fromName;

  const mimeMap: Record<string, string> = {
    "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png",
    "image/gif": "gif", "image/webp": "webp", "image/svg+xml": "svg",
    "image/bmp": "bmp", "image/tiff": "tiff", "image/avif": "avif",
    "image/heic": "heic", "image/heif": "heif",
    "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
  };

  return mimeMap[file.type] ?? "bin";
}

function buildUploadFilename(file: File) {
  const originalBase = file.name.replace(/\.[^.]+$/, "");
  const sanitizedBase = sanitizeFilenameSegment(originalBase) || "moment";
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

  return `${Date.now()}-${randomPart}-${sanitizedBase}.${inferExtension(file)}`;
}

function readVideoMetadata(file: File) {
  return new Promise<Pick<MomentAssetMetadata, "durationMs" | "width" | "height">>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");

    const cleanup = () => URL.revokeObjectURL(objectUrl);

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      cleanup();
      const durationMs = Math.round(video.duration * 1000);
      if (!Number.isFinite(durationMs) || durationMs <= 0) {
        reject(new Error("Could not read video duration"));
        return;
      }
      if (durationMs > MAX_VIDEO_DURATION_MS) {
        reject(new Error("Video clips must be 2 minutes or shorter"));
        return;
      }
      resolve({
        durationMs,
        width: video.videoWidth || undefined,
        height: video.videoHeight || undefined,
      });
    };
    video.onerror = () => {
      cleanup();
      reject(new Error("Could not read video metadata"));
    };
    video.src = objectUrl;
  });
}

async function buildAssetMetadata(file: File, extraMetadata?: Record<string, unknown>): Promise<MomentAssetMetadata> {
  const fileType = file.type || DEFAULT_ASSET_CONTENT_TYPE;

  if (SUPPORTED_IMAGE_TYPES.has(fileType)) {
    return {
      ...extraMetadata,
      mediaType: "image",
      fileType,
      fileSizeBytes: file.size,
    };
  }

  if (SUPPORTED_VIDEO_TYPES.has(fileType)) {
    return {
      ...extraMetadata,
      mediaType: "video",
      fileType,
      fileSizeBytes: file.size,
      ...(await readVideoMetadata(file)),
    };
  }

  throw new Error("Unsupported moment media type. Use any image format, MP4, WebM, or MOV.");
}

async function presignMomentUpload(file: File) {
  const { data } = await apiClient.post<ApiEnvelope<PresignUploadResponse>>("/upload/presign", {
    filename: buildUploadFilename(file),
    contentType: file.type || DEFAULT_ASSET_CONTENT_TYPE,
  });

  return unwrapApiData(data);
}

async function uploadMomentAsset(presignedUpload: PresignUploadResponse, file: File) {
  const response = await fetch(presignedUpload.upload_url, {
    method: "PUT",
    headers: new Headers(presignedUpload.required_headers),
    body: file,
  });

  if (!response.ok) {
    throw new Error((await response.text()) || `Upload failed with status ${response.status}`);
  }

  return presignedUpload.public_url;
}

function normalizeMomentsFeed(payload: unknown, fallbackPage: number, fallbackPerPage: number): MomentsFeedResponse {
  const raw = isRecord(payload) ? payload : {};
  const moments = Array.isArray(raw.moments) ? raw.moments.map((moment) => normalizeMoment(moment)) : [];
  const total = pickNumber(raw.total, raw.totalCount, raw.total_count) ?? moments.length;
  const perPage = pickNumber(raw.perPage, raw.pageSize, raw.page_size) ?? fallbackPerPage;

  return {
    moments,
    total,
    page: pickNumber(raw.page) ?? fallbackPage,
    perPage,
    totalPages: pickNumber(raw.totalPages) ?? (total === 0 ? 0 : Math.ceil(total / perPage)),
  };
}

function normalizeMomentDaEvents(payload: unknown): MomentDaEventsResponse {
  const raw = isRecord(payload) ? payload : {};
  const events = Array.isArray(raw.events)
    ? raw.events.map((event) => {
        const value = isRecord(event) ? event : {};
        const normalized: MomentDaEvent = {
          momentId: pickString(value.momentId, value.moment_id) ?? "",
          eventType: pickString(value.eventType, value.event_type) ?? "",
          payload: value.payload,
          createdAt: pickString(value.createdAt, value.created_at),
        };
        return normalized;
      })
    : [];

  return { events };
}

function normalizeMomentZgProof(payload: unknown): MomentZgProofResponse {
  const raw = isRecord(payload) ? payload : {};

  return {
    assetZgHash: pickString(raw.assetZgHash, raw.asset_zg_hash),
    assetZgTxHash: pickString(raw.assetZgTxHash, raw.asset_zg_tx_hash),
    metadataZgHash: pickString(raw.metadataZgHash, raw.metadata_zg_hash),
    metadataZgTxHash: pickString(raw.metadataZgTxHash, raw.metadata_zg_tx_hash),
    zgStatus: pickString(raw.zgStatus, raw.zg_status),
    zgError: pickString(raw.zgError, raw.zg_error),
    zgUploadedAt: pickString(raw.zgUploadedAt, raw.zg_uploaded_at),
    gatewayUrl: pickString(raw.gatewayUrl, raw.gateway_url) ?? null,
    explorerUrl: pickString(raw.explorerUrl, raw.explorer_url) ?? null,
  };
}

export const momentsApi = {
  list: async (params: ListMomentsParams = {}): Promise<MomentsFeedResponse> => {
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 20;
    const { data } = await apiClient.get<ApiEnvelope<unknown>>("/moments", {
      params: {
        page,
        per_page: perPage,
        tags: params.tags?.join(","),
        "search-query": params.searchQuery,
        media_type: params.mediaType,
      },
    });

    return normalizeMomentsFeed(unwrapApiData(data), page, perPage);
  },

  getMine: async (page = 1, perPage = 20): Promise<MomentsFeedResponse> => {
    const { data } = await apiClient.get<ApiEnvelope<unknown>>("/moments/my", {
      params: { page, per_page: perPage },
    });

    return normalizeMomentsFeed(unwrapApiData(data), page, perPage);
  },

  getById: async (momentId: string): Promise<Moment> => {
    const { data } = await apiClient.get<ApiEnvelope<unknown>>(`/moments/${momentId}`);
    return normalizeMoment(unwrapApiData(data));
  },

  getZgProof: async (momentId: string): Promise<MomentZgProofResponse> => {
    const { data } = await apiClient.get<ApiEnvelope<unknown>>(`/moments/${momentId}/zg-proof`);
    return normalizeMomentZgProof(unwrapApiData(data));
  },

  getDaEvents: async (momentId: string): Promise<MomentDaEventsResponse> => {
    const { data } = await apiClient.get<ApiEnvelope<unknown>>(`/moments/${momentId}/da-events`);
    return normalizeMomentDaEvents(unwrapApiData(data));
  },

  create: async (payload: CreateMomentRequest): Promise<CreateMomentResponse> => {
    const { data } = await apiClient.post<ApiEnvelope<CreateMomentResponse>>("/moments/register", payload);
    return unwrapApiData(data);
  },

  createFromFile: async ({ assetFile, assetMetadata, ...payload }: CreateMomentFromFileInput): Promise<CreateMomentResponse> => {
    const metadata = await buildAssetMetadata(assetFile, assetMetadata);
    const presignedUpload = await presignMomentUpload(assetFile);
    const assetUrl = await uploadMomentAsset(presignedUpload, assetFile);

    return momentsApi.create({
      ...payload,
      assetUrl,
      assetMetadata: metadata,
    });
  },

  update: async (momentId: string, payload: UpdateMomentRequest): Promise<Moment> => {
    const { data } = await apiClient.patch<ApiEnvelope<unknown>>(`/moments/${momentId}`, payload);
    return normalizeMoment(unwrapApiData(data));
  },

  remove: async (momentId: string): Promise<MomentMutationResponse> => {
    const { data } = await apiClient.delete<ApiEnvelope<MomentMutationResponse>>(`/moments/${momentId}`);
    return unwrapApiData(data);
  },

  retryZgMigration: async (momentId: string): Promise<MomentMutationResponse> => {
    const { data } = await apiClient.post<ApiEnvelope<MomentMutationResponse>>(`/moments/${momentId}/zg/retry`);
    return unwrapApiData(data);
  },

  like: async (momentId: string): Promise<MomentLikeResponse> => {
    const { data } = await apiClient.post<ApiEnvelope<MomentLikeResponse>>(`/moments/${momentId}/like`);
    return unwrapApiData(data);
  },
};
