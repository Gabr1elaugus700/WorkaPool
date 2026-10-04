export function buildOverviewCustomerGroupQuotesQueryKey(
  customerCode: number,
  grupoCodigo: string | null,
  productCode: string | null,
  includeOtherCustomers: boolean,
) {
  return [
    "overview-customer-group-quotes",
    customerCode,
    grupoCodigo,
    productCode,
    includeOtherCustomers,
  ] as const;
}
