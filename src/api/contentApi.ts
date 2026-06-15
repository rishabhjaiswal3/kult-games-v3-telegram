import apiClient from "@/lib/apiClient";
import { isRecord, pickNumber, unwrapApiData } from "@/api/utils";
import type { ApiEnvelope, ContentSectionResponse, GetContentParams } from "@/types/api";

function normalizeContentSectionResponse(
  payload: unknown,
  fallbackPage: number,
  fallbackPageSize: number,
): ContentSectionResponse {
  const raw = isRecord(payload) ? payload : {};
  const content = Array.isArray(raw.content)
    ? raw.content.filter((value): value is Record<string, unknown> => isRecord(value))
    : [];

  return {
    content,
    totalContentCount: pickNumber(raw.totalContentCount, raw.total_content_count, raw.total) ?? content.length,
    page: pickNumber(raw.page) ?? fallbackPage,
    pageSize: pickNumber(raw.pageSize, raw.page_size) ?? fallbackPageSize,
  };
}

export const contentApi = {
  getContent: async (params: GetContentParams): Promise<ContentSectionResponse> => {
    const pageNum = params.pageNum ?? 1;
    const pageSize = params.pageSize ?? 10;
    const { data } = await apiClient.get<ApiEnvelope<unknown>>("/content", {
      params: {
        page: params.page,
        section: params.section,
        page_num: pageNum,
        page_size: pageSize,
      },
    });

    return normalizeContentSectionResponse(unwrapApiData(data), pageNum, pageSize);
  },
};