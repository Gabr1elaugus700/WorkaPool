import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { OverviewCustomerGroupQuoteRow } from "../types/overviewCustomerGroupQuotes.types";
import { summarizeOverviewCustomerGroupQuoteBenchmark } from "./overviewCustomerGroupQuotesBenchmark.utils";
import { applyOverviewCustomerGroupQuoteFilters } from "./overviewCustomerGroupQuotesFilter.utils";
import { selectVisibleOverviewCustomerGroupQuoteRows } from "./overviewCustomerGroupQuotesReveal.utils";

function sampleRow(
  overrides: Partial<OverviewCustomerGroupQuoteRow> = {},
): OverviewCustomerGroupQuoteRow {
  return {
    orderNumber: 100,
    issuedAt: "2026-09-15",
    outcome: "ganha",
    situation: 9,
    productCode: "P001",
    productName: "Produto 1",
    quantity: 2,
    unitPrice: 10,
    lineAmount: 20,
    marginPercent: 5,
    ipiAmount: 1,
    icmsAmount: 2,
    icmsPercent: 12,
    costPrice: 8,
    freightAmount: 1.5,
    carrierCode: 99,
    freightIncluded: true,
    codRep: 10,
    sellerName: "Ana",
    lossReason: null,
    otherCustomer: false,
    customerTradeName: null,
    repShortName: "Rep A",
    ...overrides,
  };
}

describe("summarizeOverviewCustomerGroupQuoteBenchmark", () => {
  it("weights the average price by volume instead of averaging unit prices", () => {
    const result = summarizeOverviewCustomerGroupQuoteBenchmark([
      sampleRow({ quantity: 100, unitPrice: 10, lineAmount: 1000 }),
      sampleRow({ quantity: 300, unitPrice: 14, lineAmount: 4200 }),
    ]);

    assert.equal(result.wonAveragePrice, 13);
  });

  it("computes the spread as lost minus won, in currency and percent of won", () => {
    const result = summarizeOverviewCustomerGroupQuoteBenchmark([
      sampleRow({ quantity: 10, lineAmount: 100 }),
      sampleRow({ outcome: "perdida", quantity: 10, lineAmount: 120 }),
    ]);

    assert.deepEqual(result, {
      wonAveragePrice: 10,
      lostAveragePrice: 12,
      spreadAmount: 2,
      spreadPercent: 20,
    });
  });

  it("returns null for the missing side and for the spread", () => {
    const result = summarizeOverviewCustomerGroupQuoteBenchmark([
      sampleRow({ outcome: "perdida", quantity: 4, lineAmount: 40 }),
    ]);

    assert.deepEqual(result, {
      wonAveragePrice: null,
      lostAveragePrice: 10,
      spreadAmount: null,
      spreadPercent: null,
    });
  });

  it("keeps the spread amount but not the percent when the won price is zero", () => {
    const result = summarizeOverviewCustomerGroupQuoteBenchmark([
      sampleRow({ quantity: 5, lineAmount: 0 }),
      sampleRow({ outcome: "perdida", quantity: 5, lineAmount: 50 }),
    ]);

    assert.equal(result.spreadAmount, 10);
    assert.equal(result.spreadPercent, null);
  });

  it("returns all nulls for an empty set or zero volume", () => {
    const empty = {
      wonAveragePrice: null,
      lostAveragePrice: null,
      spreadAmount: null,
      spreadPercent: null,
    };

    assert.deepEqual(summarizeOverviewCustomerGroupQuoteBenchmark([]), empty);
    assert.deepEqual(
      summarizeOverviewCustomerGroupQuoteBenchmark([sampleRow({ quantity: 0, lineAmount: 0 })]),
      empty,
    );
  });

  it("includes visible other-customer rows by outcome", () => {
    const result = summarizeOverviewCustomerGroupQuoteBenchmark([
      sampleRow({ quantity: 10, lineAmount: 100 }),
      sampleRow({ otherCustomer: true, quantity: 10, lineAmount: 140 }),
    ]);

    assert.equal(result.wonAveragePrice, 12);
  });

  it("drops other-customer rows when the reveal toggle hides them", () => {
    const rows = [
      sampleRow({ quantity: 10, lineAmount: 100 }),
      sampleRow({ otherCustomer: true, quantity: 10, lineAmount: 140 }),
    ];
    const hidden = selectVisibleOverviewCustomerGroupQuoteRows(rows, {
      revealAvailable: true,
      revealVisible: false,
    });

    assert.equal(summarizeOverviewCustomerGroupQuoteBenchmark(hidden).wonAveragePrice, 10);
  });

  it("follows the rows left by seller and status filters", () => {
    const rows = [
      sampleRow({ codRep: 10, quantity: 10, lineAmount: 100 }),
      sampleRow({ codRep: 20, sellerName: "Bruno", quantity: 10, lineAmount: 200 }),
      sampleRow({ codRep: 20, sellerName: "Bruno", outcome: "perdida", quantity: 10, lineAmount: 250 }),
    ];

    const bySeller = applyOverviewCustomerGroupQuoteFilters(
      rows,
      { search: "", codRep: 20, status: "todas" },
      { outrosEnabled: false },
    );
    const byStatus = applyOverviewCustomerGroupQuoteFilters(
      rows,
      { search: "", codRep: null, status: "ganhas" },
      { outrosEnabled: false },
    );

    assert.deepEqual(summarizeOverviewCustomerGroupQuoteBenchmark(bySeller.rows), {
      wonAveragePrice: 20,
      lostAveragePrice: 25,
      spreadAmount: 5,
      spreadPercent: 25,
    });
    assert.deepEqual(summarizeOverviewCustomerGroupQuoteBenchmark(byStatus.rows), {
      wonAveragePrice: 15,
      lostAveragePrice: null,
      spreadAmount: null,
      spreadPercent: null,
    });
  });
});
