import { apiFetchJson } from "@/lib/apiFetch";
import type {
  OverviewCustomerGroupQuotesQuery,
  OverviewCustomerGroupQuotesResponse,
} from "../types/overviewCustomerGroupQuotes.types";
import { buildOverviewCustomerGroupQuotesPath } from "../utils/overviewCustomerGroupQuotesPath.utils";

export const OverviewCustomerGroupQuotesService = {
  getQuotes: async (
    customerCode: number,
    grupoCodigo: string,
    query: OverviewCustomerGroupQuotesQuery = {},
  ): Promise<OverviewCustomerGroupQuotesResponse> => {
    return apiFetchJson<OverviewCustomerGroupQuotesResponse>(
      buildOverviewCustomerGroupQuotesPath(customerCode, grupoCodigo, query),
    );
  },
};
