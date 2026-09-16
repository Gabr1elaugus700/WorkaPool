import { apiFetchJson } from "@/lib/apiFetch";
import type { OverviewCustomerDetailResponse } from "../types/overviewCustomerDetail.types";
import type { OverviewCustomerListResponse } from "../types/overviewCustomerList.types";
import type { OverviewCustomerMonthlyEvolutionResponse } from "../types/overviewCustomerMonthlyEvolution.types";
import type { OverviewCustomerPurchasedProductsResponse } from "../types/overviewCustomerPurchasedProducts.types";

export const OverviewCustomerService = {
  getDetail: async (
    customerCode: number,
  ): Promise<OverviewCustomerDetailResponse> => {
    return apiFetchJson<OverviewCustomerDetailResponse>(
      `/api/overview/customers/${encodeURIComponent(String(customerCode))}`,
    );
  },
  getMonthlyEvolution: async (
    customerCode: number,
  ): Promise<OverviewCustomerMonthlyEvolutionResponse> => {
    return apiFetchJson<OverviewCustomerMonthlyEvolutionResponse>(
      `/api/overview/customers/${encodeURIComponent(String(customerCode))}/monthly-evolution`,
    );
  },
  getPurchasedProducts: async (
    customerCode: number,
  ): Promise<OverviewCustomerPurchasedProductsResponse> => {
    return apiFetchJson<OverviewCustomerPurchasedProductsResponse>(
      `/api/overview/customers/${encodeURIComponent(String(customerCode))}/purchased-products`,
    );
  },
  list: async (params: { search?: string; page?: number }): Promise<OverviewCustomerListResponse> => {
    const searchParams = new URLSearchParams();
    if (params.search && params.search.trim().length > 0) {
      searchParams.set("search", params.search.trim());
    }
    if (typeof params.page === "number" && params.page > 0) {
      searchParams.set("page", String(params.page));
    }
    const queryString = searchParams.toString();
    const path = queryString
      ? `/api/overview/customers?${queryString}`
      : "/api/overview/customers";
    return apiFetchJson<OverviewCustomerListResponse>(path);
  },
};
