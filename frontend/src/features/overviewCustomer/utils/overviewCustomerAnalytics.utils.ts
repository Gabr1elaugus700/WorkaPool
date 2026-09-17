import type { OverviewCustomerPurchasedProduct } from "../types/overviewCustomerPurchasedProducts.types";

export type AbcConcentrationRow = {
  productCode: string;
  productName: string;
  revenueShare: number;
};

export type MarginRange = {
  min: number | null;
  max: number | null;
  avg: number | null;
};

export function buildAbcConcentrationRows(
  products: OverviewCustomerPurchasedProduct[],
  maxItems = 5,
): AbcConcentrationRow[] {
  return [...products]
    .sort((first, second) => second.revenueShare - first.revenueShare)
    .slice(0, maxItems)
    .map((product) => ({
      productCode: product.productCode,
      productName: product.productName,
      revenueShare: product.revenueShare,
    }));
}

export function computeMarginRange(values: Array<number | null>): MarginRange {
  const validValues = values.filter((value): value is number => value != null);
  if (validValues.length === 0) {
    return { min: null, max: null, avg: null };
  }

  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  const avg = validValues.reduce((total, value) => total + value, 0) / validValues.length;

  return { min, max, avg };
}
