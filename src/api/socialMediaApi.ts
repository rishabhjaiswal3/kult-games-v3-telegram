import apiClient from "@/lib/apiClient";
import { isRecord, pickString, unwrapApiData } from "@/api/utils";
import type {
  ApiEnvelope,
  SocialPost,
  SocialPostsResponse,
  SubmitSocialPostRequest,
  SubmitSocialPostResponse,
} from "@/types/api";

function normalizeSocialPost(rawValue: unknown): SocialPost {
  const raw = isRecord(rawValue) ? rawValue : {};

  return {
    id: pickString(raw.id, raw._id, raw.postId, raw.post_id) ?? "",
    walletAddress: pickString(raw.walletAddress, raw.wallet_address) ?? "",
    platform: pickString(raw.platform) ?? "",
    postId: pickString(raw.postId, raw.post_id) ?? "",
    postUrl: pickString(raw.postUrl, raw.post_url) ?? "",
    rawData: raw.rawData ?? raw.raw_data,
    scrapedAt: pickString(raw.scrapedAt, raw.scraped_at),
    validationStatus: pickString(raw.validationStatus, raw.validation_status),
    createdAt: pickString(raw.createdAt, raw.created_at),
  };
}

function normalizeSocialPostsResponse(payload: unknown): SocialPostsResponse {
  const raw = isRecord(payload) ? payload : {};
  const posts = Array.isArray(raw.posts) ? raw.posts.map((post) => normalizeSocialPost(post)) : [];
  return { posts };
}

export const socialMediaApi = {
  submitPost: async (payload: SubmitSocialPostRequest): Promise<SubmitSocialPostResponse> => {
    const { data } = await apiClient.post<ApiEnvelope<SubmitSocialPostResponse>>("/social-media/posts", payload);
    return unwrapApiData(data);
  },

  getMyPosts: async (page = 1, perPage = 20): Promise<SocialPostsResponse> => {
    const { data } = await apiClient.get<ApiEnvelope<unknown>>("/social-media/posts/my", {
      params: { page, per_page: perPage },
    });
    return normalizeSocialPostsResponse(unwrapApiData(data));
  },
};
