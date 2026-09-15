import { apiFetchJson } from "@/lib/apiFetch";
import type { OverviewCustomerDetailResponse } from "../types/overviewCustomerDetail.types";

export const OverviewCustomerService = {
  getDetail: async (
    customerCode: number,
  ): Promise<OverviewCustomerDetailResponse> => {
    return apiFetchJson<OverviewCustomerDetailResponse>(
      `/api/overview/customers/${encodeURIComponent(String(customerCode))}`,
    );
  },
};
