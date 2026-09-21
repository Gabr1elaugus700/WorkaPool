import { apiFetchJson } from "@/lib/apiFetch";
import type { OverviewCustomerGroupAnaliseResponse } from "../types/overviewCustomerGroupAnalise.types";

export const OverviewCustomerGroupAnaliseService = {
  getAnalise: async (
    customerCode: number,
    grupoCodigo: string,
  ): Promise<OverviewCustomerGroupAnaliseResponse> => {
    return apiFetchJson<OverviewCustomerGroupAnaliseResponse>(
      `/api/overview/customers/${encodeURIComponent(String(customerCode))}/grupos/${encodeURIComponent(grupoCodigo)}/analise`,
    );
  },
};
