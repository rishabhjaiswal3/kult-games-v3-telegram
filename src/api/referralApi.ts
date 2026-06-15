import apiClient from "@/lib/apiClient";
import { unwrapApiData } from "@/api/utils";
import type { ApiEnvelope, ReferralInfo } from "@/types/api";

export const referralApi = {
  getMine: async (): Promise<ReferralInfo> => {
    const { data } = await apiClient.get<ApiEnvelope<ReferralInfo>>("/referral/me");
    return unwrapApiData(data);
  },
};
