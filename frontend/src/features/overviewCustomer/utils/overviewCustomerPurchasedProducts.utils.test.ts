import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterPurchasedProductsBySearchTerm } from "./overviewCustomerPurchasedProducts.utils";

const sampleProducts = [
  {
    productCode: "101072",
    productName: "Produto Alpha",
    quantity: 10,
    volume: 5,
    revenue: 100,
    averagePrice: 10,
    marginPercentWeightedByRevenue: 20,
    firstPurchaseAt: "2024-01-01",
    lastPurchaseAt: "2024-02-01",
    frequencyDays: 30,
    revenueShare: 60,
  },
  {
    productCode: "202033",
    productName: "Produto Beta",
    quantity: 5,
    volume: 2,
    revenue: 50,
    averagePrice: 10,
    marginPercentWeightedByRevenue: 15,
    firstPurchaseAt: "2024-01-15",
    lastPurchaseAt: "2024-03-01",
    frequencyDays: 45,
    revenueShare: 40,
  },
];

describe("filterPurchasedProductsBySearchTerm", () => {
  it("returns all rows when search term is empty or whitespace", () => {
    assert.deepEqual(filterPurchasedProductsBySearchTerm(sampleProducts, ""), sampleProducts);
    assert.deepEqual(filterPurchasedProductsBySearchTerm(sampleProducts, "   "), sampleProducts);
  });

  it("filters by product name case-insensitively", () => {
    const filtered = filterPurchasedProductsBySearchTerm(sampleProducts, "alpha");
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.productName, "Produto Alpha");
  });

  it("filters by product code", () => {
    const filtered = filterPurchasedProductsBySearchTerm(sampleProducts, "202033");
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.productCode, "202033");
  });
});
