import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  materializeOverviewCustomerPurchasedProducts,
  type OverviewCustomerPurchasedProductsSeed,
} from "../../../../../src/features/overviewCustomer/sync/materializeOverviewCustomerPurchasedProducts";

describe("materializeOverviewCustomerPurchasedProducts", () => {
  it("aggregates only invoiced lines since 2024-01-01 with required derived fields", () => {
    const seed: OverviewCustomerPurchasedProductsSeed = {
      lines: [
        {
          customerCode: 123,
          orderId: 500,
          issuedAt: "2023-12-25",
          productCode: "999999",
          productName: "Produto Antigo",
          quantityInvoiced: 5,
          quantityReturned: 0,
          unitPrice: 10,
          lineMarginPercent: 10,
        },
        {
          customerCode: 123,
          orderId: 501,
          issuedAt: "2024-01-10",
          productCode: "101072",
          productName: "Produto 101072",
          quantityInvoiced: 10,
          quantityReturned: 2,
          unitPrice: 20,
          lineMarginPercent: 30,
        },
        {
          customerCode: 123,
          orderId: 502,
          issuedAt: "2024-02-10",
          productCode: "101072",
          productName: "Produto 101072",
          quantityInvoiced: 4,
          quantityReturned: 0,
          unitPrice: 30,
          lineMarginPercent: 50,
        },
        {
          customerCode: 123,
          orderId: 503,
          issuedAt: "2024-03-10",
          productCode: "200200",
          productName: "Produto B",
          quantityInvoiced: 3,
          quantityReturned: 1,
          unitPrice: 50,
          lineMarginPercent: 10,
        },
      ],
    };

    const snapshot = materializeOverviewCustomerPurchasedProducts(seed);
    const rows = snapshot.customers["123"];
    assert.ok(rows);
    assert.strictEqual(rows.length, 2);
    assert.strictEqual(rows[0].productCode, "101072");
    assert.strictEqual(rows[0].quantity, 12);
    assert.strictEqual(rows[0].volume, 6);
    assert.strictEqual(rows[0].revenue, 280);
    assert.strictEqual(rows[0].averagePrice, 23.33);
    assert.strictEqual(rows[0].marginPercentWeightedByRevenue, 38.57);
    assert.strictEqual(rows[0].firstPurchaseAt, "2024-01-10");
    assert.strictEqual(rows[0].lastPurchaseAt, "2024-02-10");
    assert.strictEqual(rows[0].frequencyDays, 31);
    assert.strictEqual(rows[0].revenueShare, 73.68);

    assert.strictEqual(rows[1].productCode, "200200");
    assert.strictEqual(rows[1].quantity, 2);
    assert.strictEqual(rows[1].volume, 2);
    assert.strictEqual(rows[1].revenue, 100);
    assert.strictEqual(rows[1].averagePrice, 50);
    assert.strictEqual(rows[1].marginPercentWeightedByRevenue, 10);
    assert.strictEqual(rows[1].firstPurchaseAt, "2024-03-10");
    assert.strictEqual(rows[1].lastPurchaseAt, "2024-03-10");
    assert.strictEqual(rows[1].frequencyDays, null);
    assert.strictEqual(rows[1].revenueShare, 26.32);
  });
});
