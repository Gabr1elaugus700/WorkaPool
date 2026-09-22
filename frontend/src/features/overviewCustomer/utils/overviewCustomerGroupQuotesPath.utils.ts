import type { OverviewCustomerGroupQuotesQuery } from "../types/overviewCustomerGroupQuotes.types";

export function buildOverviewCustomerGroupQuotesPath(
  customerCode: number,
  grupoCodigo: string,
  query: OverviewCustomerGroupQuotesQuery = {},
): string {
  const params = new URLSearchParams();
  if (query.productCode != null && query.productCode.trim().length > 0) {
    params.set("codPro", query.productCode.trim());
  }
  if (query.reveal === true) {
    params.set("reveal", "true");
  }
  const queryString = params.toString();
  const base = `/api/overview/customers/${encodeURIComponent(String(customerCode))}/grupos/${encodeURIComponent(grupoCodigo)}/cotacoes`;
  return queryString.length > 0 ? `${base}?${queryString}` : base;
}
