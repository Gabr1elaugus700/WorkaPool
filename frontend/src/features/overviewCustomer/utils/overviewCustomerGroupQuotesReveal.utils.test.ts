import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { OverviewCustomerGroupQuoteRow } from "../types/overviewCustomerGroupQuotes.types";
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

const rows = [
  sampleRow({ orderNumber: 1 }),
  sampleRow({ orderNumber: 2, otherCustomer: true }),
  sampleRow({ orderNumber: 3, outcome: "perdida" }),
  sampleRow({ orderNumber: 4, otherCustomer: true }),
];

function orderNumbers(list: OverviewCustomerGroupQuoteRow[]): number[] {
  return list.map((row) => row.orderNumber);
}

describe("selectVisibleOverviewCustomerGroupQuoteRows", () => {
  it("never shows other customers when reveal is not available for the role", () => {
    const visible = selectVisibleOverviewCustomerGroupQuoteRows(rows, {
      revealAvailable: false,
      revealVisible: true,
    });

    assert.deepEqual(orderNumbers(visible), [1, 3]);
    assert.equal(
      visible.some((row) => row.otherCustomer),
      false,
    );
  });

  it("hides other customers when reveal is available but toggled off", () => {
    const visible = selectVisibleOverviewCustomerGroupQuoteRows(rows, {
      revealAvailable: true,
      revealVisible: false,
    });

    assert.deepEqual(orderNumbers(visible), [1, 3]);
  });

  it("shows all rows in original order when reveal is available and visible", () => {
    const visible = selectVisibleOverviewCustomerGroupQuoteRows(rows, {
      revealAvailable: true,
      revealVisible: true,
    });

    assert.deepEqual(orderNumbers(visible), [1, 2, 3, 4]);
  });
});
