import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { OverviewCustomerGroupQuoteRow } from "../types/overviewCustomerGroupQuotes.types";
import {
  applyOverviewCustomerGroupQuoteFilters,
  filterOverviewCustomerGroupQuoteRowsBySearchAndSeller,
  filterOverviewCustomerGroupQuoteRowsByStatus,
  listOverviewCustomerGroupQuoteSellerOptions,
  summarizeOverviewCustomerGroupQuoteStatusCounts,
} from "./overviewCustomerGroupQuotesFilter.utils";

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
  sampleRow({ orderNumber: 12345, codRep: 10 }),
  sampleRow({ orderNumber: 12399, outcome: "perdida", codRep: 10 }),
  sampleRow({ orderNumber: 55501, outcome: "perdida", codRep: 20, sellerName: "Bruno" }),
  sampleRow({ orderNumber: 70001, otherCustomer: true, codRep: 30, sellerName: "Carla" }),
  sampleRow({
    orderNumber: 70002,
    otherCustomer: true,
    outcome: "perdida",
    codRep: 20,
    sellerName: "Bruno",
  }),
];

function orderNumbers(list: OverviewCustomerGroupQuoteRow[]): number[] {
  return list.map((row) => row.orderNumber);
}

describe("filterOverviewCustomerGroupQuoteRowsBySearchAndSeller", () => {
  it("returns all rows when search is empty and no seller is selected", () => {
    const result = filterOverviewCustomerGroupQuoteRowsBySearchAndSeller(rows, {
      search: "  ",
      codRep: null,
    });

    assert.deepEqual(orderNumbers(result), orderNumbers(rows));
  });

  it("matches orderNumber by substring, ignoring # and spaces", () => {
    const plain = filterOverviewCustomerGroupQuoteRowsBySearchAndSeller(rows, {
      search: "123",
      codRep: null,
    });
    const hashed = filterOverviewCustomerGroupQuoteRowsBySearchAndSeller(rows, {
      search: " #123 ",
      codRep: null,
    });

    assert.deepEqual(orderNumbers(plain), [12345, 12399]);
    assert.deepEqual(orderNumbers(hashed), [12345, 12399]);
  });

  it("filters by codRep when a seller is selected", () => {
    const result = filterOverviewCustomerGroupQuoteRowsBySearchAndSeller(rows, {
      search: "",
      codRep: 20,
    });

    assert.deepEqual(orderNumbers(result), [55501, 70002]);
  });

  it("combines search and seller", () => {
    const result = filterOverviewCustomerGroupQuoteRowsBySearchAndSeller(rows, {
      search: "7000",
      codRep: 20,
    });

    assert.deepEqual(orderNumbers(result), [70002]);
  });
});

describe("filterOverviewCustomerGroupQuoteRowsByStatus", () => {
  it("keeps every row for todas", () => {
    assert.deepEqual(
      orderNumbers(filterOverviewCustomerGroupQuoteRowsByStatus(rows, "todas")),
      orderNumbers(rows),
    );
  });

  it("keeps only own won rows for ganhas", () => {
    assert.deepEqual(
      orderNumbers(filterOverviewCustomerGroupQuoteRowsByStatus(rows, "ganhas")),
      [12345],
    );
  });

  it("keeps only own lost rows for perdidas", () => {
    assert.deepEqual(
      orderNumbers(filterOverviewCustomerGroupQuoteRowsByStatus(rows, "perdidas")),
      [12399, 55501],
    );
  });

  it("keeps only other customers rows for outros", () => {
    assert.deepEqual(
      orderNumbers(filterOverviewCustomerGroupQuoteRowsByStatus(rows, "outros")),
      [70001, 70002],
    );
  });
});

describe("summarizeOverviewCustomerGroupQuoteStatusCounts", () => {
  it("counts each status consistently with the status filter", () => {
    const counts = summarizeOverviewCustomerGroupQuoteStatusCounts(rows);

    assert.deepEqual(counts, { todas: 5, ganhas: 1, perdidas: 2, outros: 2 });
    for (const status of ["todas", "ganhas", "perdidas", "outros"] as const) {
      assert.equal(
        counts[status],
        filterOverviewCustomerGroupQuoteRowsByStatus(rows, status).length,
      );
    }
  });

  it("returns zeros for an empty set", () => {
    assert.deepEqual(summarizeOverviewCustomerGroupQuoteStatusCounts([]), {
      todas: 0,
      ganhas: 0,
      perdidas: 0,
      outros: 0,
    });
  });
});

describe("applyOverviewCustomerGroupQuoteFilters", () => {
  it("counts after search and seller, then applies status last", () => {
    const result = applyOverviewCustomerGroupQuoteFilters(
      rows,
      { search: "", codRep: 20, status: "perdidas" },
      { outrosEnabled: true },
    );

    assert.deepEqual(result.counts, { todas: 2, ganhas: 0, perdidas: 1, outros: 1 });
    assert.deepEqual(orderNumbers(result.rows), [55501]);
    assert.equal(result.sellerOptions.length, 3);
  });

  it("falls back to todas when outros is selected but reveal is hidden", () => {
    const result = applyOverviewCustomerGroupQuoteFilters(
      rows,
      { search: "", codRep: null, status: "outros" },
      { outrosEnabled: false },
    );

    assert.equal(result.filters.status, "todas");
    assert.equal(result.rows.length, rows.length);
  });

  it("drops a selected seller that is no longer among the visible rows", () => {
    const result = applyOverviewCustomerGroupQuoteFilters(
      rows,
      { search: "", codRep: 999, status: "todas" },
      { outrosEnabled: true },
    );

    assert.equal(result.filters.codRep, null);
    assert.equal(result.rows.length, rows.length);
  });
});

describe("listOverviewCustomerGroupQuoteSellerOptions", () => {
  it("dedupes by codRep and sorts by label", () => {
    assert.deepEqual(listOverviewCustomerGroupQuoteSellerOptions(rows), [
      { codRep: 10, label: "Ana" },
      { codRep: 20, label: "Bruno" },
      { codRep: 30, label: "Carla" },
    ]);
  });

  it("falls back to repShortName and then codRep", () => {
    const options = listOverviewCustomerGroupQuoteSellerOptions([
      sampleRow({ codRep: 40, sellerName: "  ", repShortName: "Rep D" }),
      sampleRow({ codRep: 50, sellerName: null, repShortName: null }),
    ]);

    assert.deepEqual(options, [
      { codRep: 50, label: "50" },
      { codRep: 40, label: "Rep D" },
    ]);
  });
});
