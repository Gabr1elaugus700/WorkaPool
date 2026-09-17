import type { OverviewCustomerPurchasedProduct } from "../types/overviewCustomerPurchasedProducts.types";

export function filterPurchasedProductsBySearchTerm(
  rows: OverviewCustomerPurchasedProduct[],
  searchTerm: string,
): OverviewCustomerPurchasedProduct[] {
  const normalized = searchTerm.trim().toLowerCase();
  if (normalized.length === 0) {
    return rows;
  }

  return rows.filter(
    (row) =>
      row.productName.toLowerCase().includes(normalized) ||
      row.productCode.toLowerCase().includes(normalized),
  );
}
