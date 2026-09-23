import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  materializeOverviewCustomerCommercialSummary,
  type OverviewCustomerCommercialSummarySeed,
} from "../../../../../src/features/overviewCustomer/sync/materializeOverviewCustomerCommercialSummary";

describe("materializeOverviewCustomerCommercialSummary", () => {
  it("ignores orders before Jan/2024 for since-Jan metrics", () => {
    const seed: OverviewCustomerCommercialSummarySeed = {
      lines: [
        {
          customerCode: 321,
          orderId: 9001,
          issuedAt: "2023-12-15",
          productCode: "999999",
          quantityInvoiced: 2,
          quantityReturned: 0,
          unitPrice: 100,
          lineMarginPercent: 10,
        },
        {
          customerCode: 321,
          orderId: 9002,
          issuedAt: "2024-01-10",
          productCode: "999999",
          quantityInvoiced: 1,
          quantityReturned: 0,
          unitPrice: 300,
          lineMarginPercent: 20,
        },
      ],
    };

    const snapshot = materializeOverviewCustomerCommercialSummary(
      seed,
      new Date("2026-10-01T00:00:00.000Z"),
    );

    assert.deepStrictEqual(snapshot.customers["321"], {
      revenueSinceJan2024: 300,
      revenueLast30Days: 0,
      revenueLast12Months: 0,
      orderCountSinceJan2024: 1,
      orderCountLast12Months: 0,
      averageTicketSinceJan2024: 300,
      averageTicketLast12Months: 0,
      volumeSinceJan2024: 1,
      volumeLast30Days: 0,
      volumeLast12Months: 0,
      marginPercentWeightedByRevenue: 16,
      purchaseFrequencyDays: 26,
      daysSinceLastPurchase: 995,
      maxInvoicedOrderMarginPercent: 20,
      minInvoicedOrderMarginPercent: 20,
    });
  });

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
      revenueLast30Days: 120,
      revenueLast12Months: 320,
      orderCountSinceJan2024: 3,
      orderCountLast12Months: 2,
      averageTicketSinceJan2024: 223.33,
      averageTicketLast12Months: 160,
      volumeSinceJan2024: 12,
      volumeLast30Days: 2,
      volumeLast12Months: 4,
      marginPercentWeightedByRevenue: 24.33,
      purchaseFrequencyDays: 297,
      daysSinceLastPurchase: 30,
      maxInvoicedOrderMarginPercent: 40,
      minInvoicedOrderMarginPercent: 20,
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
    assert.strictEqual(snapshot.customers["10"].maxInvoicedOrderMarginPercent, null);
    assert.strictEqual(snapshot.customers["10"].minInvoicedOrderMarginPercent, null);
  });

  it("ignores returned-only lines and keeps aggregates coherent", () => {
    const seed: OverviewCustomerCommercialSummarySeed = {
      lines: [
        {
          customerCode: 77,
          orderId: 3001,
          issuedAt: "2026-02-10",
          productCode: "999999",
          quantityInvoiced: 5,
          quantityReturned: 5,
          unitPrice: 40,
          lineMarginPercent: 25,
        },
        {
          customerCode: 77,
          orderId: 3002,
          issuedAt: "2026-02-20",
          productCode: "999999",
          quantityInvoiced: 2,
          quantityReturned: 0,
          unitPrice: 50,
          lineMarginPercent: 20,
        },
      ],
    };

    const snapshot = materializeOverviewCustomerCommercialSummary(
      seed,
      new Date("2026-10-01T00:00:00.000Z"),
    );

    assert.deepStrictEqual(snapshot.customers["77"], {
      revenueSinceJan2024: 100,
      revenueLast30Days: 0,
      revenueLast12Months: 100,
      orderCountSinceJan2024: 1,
      orderCountLast12Months: 1,
      averageTicketSinceJan2024: 100,
      averageTicketLast12Months: 100,
      volumeSinceJan2024: 2,
      volumeLast30Days: 0,
      volumeLast12Months: 2,
      marginPercentWeightedByRevenue: 20,
      purchaseFrequencyDays: null,
      daysSinceLastPurchase: 223,
      maxInvoicedOrderMarginPercent: 20,
      minInvoicedOrderMarginPercent: 20,
    });
  });
});
