import type { OverviewCustomerDetailTabId } from "../components/detail/overviewCustomerDetailTabs.constants";

export function shouldFetchMonthlyEvolution(activeTab: OverviewCustomerDetailTabId): boolean {
  return activeTab === "overview" || activeTab === "history";
}

export function shouldFetchPurchasedProducts(activeTab: OverviewCustomerDetailTabId): boolean {
  return activeTab === "overview" || activeTab === "products";
}

export function shouldFetchRecentCommercialMotion(
  activeTab: OverviewCustomerDetailTabId,
): boolean {
  return activeTab === "overview" || activeTab === "motion";
}
