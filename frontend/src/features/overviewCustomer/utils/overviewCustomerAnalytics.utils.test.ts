import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { OverviewCustomerPurchasedProduct } from "../types/overviewCustomerPurchasedProducts.types";
import {
  buildAbcConcentrationRows,
  computeMarginRange,
} from "./overviewCustomerAnalytics.utils";

function createProduct(
  overrides: Partial<OverviewCustomerPurchasedProduct> = {},
): OverviewCustomerPurchasedProduct {
  return {
    productCode: "100",
    productName: "Produto base",
    quantity: 1,
    volume: 1,
    revenue: 100,
    averagePrice: 100,
    marginPercentWeightedByRevenue: 20,
    firstPurchaseAt: "2024-01-01",
    lastPurchaseAt: "2024-02-01",
    frequencyDays: 30,
    revenueShare: 10,
    ...overrides,
  };
}

describe("overviewCustomerAnalytics.utils", () => {
  it("builds ABC rows ordered by revenue share descending", () => {
    const rows = buildAbcConcentrationRows([
      createProduct({ productCode: "A", productName: "Alpha", revenueShare: 15 }),
      createProduct({ productCode: "B", productName: "Beta", revenueShare: 45 }),
      createProduct({ productCode: "C", productName: "Gamma", revenueShare: 25 }),
    ]);

    assert.deepEqual(rows, [
      { productCode: "B", productName: "Beta", revenueShare: 45 },
      { productCode: "C", productName: "Gamma", revenueShare: 25 },
      { productCode: "A", productName: "Alpha", revenueShare: 15 },
    ]);
  });

  it("limits ABC rows to five items by default", () => {
    const products = Array.from({ length: 7 }, (_, index) =>
      createProduct({
        productCode: String(index),
        productName: `Produto ${index}`,
        revenueShare: index,
      }),
    );

    assert.equal(buildAbcConcentrationRows(products).length, 5);
  });

  it("computes margin range ignoring null values", () => {
    assert.deepEqual(computeMarginRange([10, null, 30, 20]), {
      min: 10,
      max: 30,
      avg: 20,
    });
  });

  it("returns null margin range when no valid values exist", () => {
    assert.deepEqual(computeMarginRange([null, null]), {
      min: null,
      max: null,
      avg: null,
    });
  });
});
