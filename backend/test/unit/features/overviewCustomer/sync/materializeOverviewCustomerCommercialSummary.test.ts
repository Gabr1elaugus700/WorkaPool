import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  materializeOverviewCustomerCommercialSummary,
  type OverviewCustomerCommercialSummarySeed,
} from "../../../../../src/features/overviewCustomer/sync/materializeOverviewCustomerCommercialSummary";

describe("materializeOverviewCustomerCommercialSummary", () => {
  it("matches trusted numeric fixture including 101072 half-volume and weighted margin", () => {
    const seed: OverviewCustomerCommercialSummarySeed = {
      lines: [
        {
          customerCode: 123,
          orderId: 1001,
          issuedAt: "2025-01-15",
          productCode: "101072",
          quantityInvoiced: 10,
          quantityReturned: 0,
          unitPrice: 20,
          lineMarginPercent: 30,
        },
        {
          customerCode: 123,
          orderId: 1001,
          issuedAt: "2025-01-15",
          productCode: "999999",
          quantityInvoiced: 4,
          quantityReturned: 1,
          unitPrice: 50,
          lineMarginPercent: 10,
        },
        {
          customerCode: 123,
          orderId: 1002,
          issuedAt: "2026-05-10",
          productCode: "999999",
          quantityInvoiced: 2,
          quantityReturned: 0,
          unitPrice: 100,
          lineMarginPercent: 20,
        },
        {
          customerCode: 123,
          orderId: 1003,
          issuedAt: "2026-09-01",
          productCode: "101072",
          quantityInvoiced: 6,
          quantityReturned: 2,
          unitPrice: 30,
          lineMarginPercent: 40,
        },
      ],
    };

    const snapshot = materializeOverviewCustomerCommercialSummary(
      seed,
      new Date("2026-10-01T00:00:00.000Z"),
    );

    assert.deepStrictEqual(snapshot.customers["123"], {
      revenueSinceJan2024: 670,
      revenueLast12Months: 320,
      orderCountSinceJan2024: 3,
      orderCountLast12Months: 2,
      averageTicketSinceJan2024: 223.33,
      averageTicketLast12Months: 160,
      volumeSinceJan2024: 12,
      volumeLast12Months: 4,
      marginPercentWeightedByRevenue: 24.33,
      purchaseFrequencyDays: 297,
      daysSinceLastPurchase: 30,
    });
  });

  it("returns null frequency and margin when there is only one order and no valid margin", () => {
    const seed: OverviewCustomerCommercialSummarySeed = {
      lines: [
        {
          customerCode: 10,
          orderId: 2001,
          issuedAt: "2026-09-20",
          productCode: "999999",
          quantityInvoiced: 3,
          quantityReturned: 0,
          unitPrice: 10,
          lineMarginPercent: null,
        },
      ],
    };

    const snapshot = materializeOverviewCustomerCommercialSummary(
      seed,
      new Date("2026-10-01T00:00:00.000Z"),
    );

    assert.strictEqual(snapshot.customers["10"].purchaseFrequencyDays, null);
    assert.strictEqual(snapshot.customers["10"].marginPercentWeightedByRevenue, null);
    assert.strictEqual(snapshot.customers["10"].daysSinceLastPurchase, 11);
  });
});
