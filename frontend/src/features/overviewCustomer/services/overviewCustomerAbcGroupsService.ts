import { apiFetchJson } from "@/lib/apiFetch";
import type { OverviewCustomerAbcGroupsResponse } from "../types/overviewCustomerAbcGroups.types";

export const OverviewCustomerAbcGroupsService = {
  getAbcGroups: async (
    customerCode: number,
  ): Promise<OverviewCustomerAbcGroupsResponse> => {
    return apiFetchJson<OverviewCustomerAbcGroupsResponse>(
      `/api/overview/customers/${encodeURIComponent(String(customerCode))}/grupos`,
    );
  },
};
