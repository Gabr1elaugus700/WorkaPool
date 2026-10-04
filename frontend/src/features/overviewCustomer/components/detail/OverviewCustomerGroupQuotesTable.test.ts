import React from "react";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { OverviewCustomerGroupQuoteRow } from "../../types/overviewCustomerGroupQuotes.types";
import { OverviewCustomerGroupQuotesTable } from "./OverviewCustomerGroupQuotesTable";

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

describe("OverviewCustomerGroupQuotesTable", () => {
  it("renders every column header without Ações", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupQuotesTable, { rows: [sampleRow()] }),
    );

    const headers = Array.from(markup.matchAll(/<th[^>]*>([^<]*)<\/th>/g), (match) => match[1]);
    assert.deepEqual(headers, [
      "Pedido",
      "Data",
      "Vendedor",
      "Volume",
      "Preço unit.",
      "Valor",
      "Margem %",
      "Custo",
      "IPI",
      "ICMS",
      "ICMS %",
      "Frete",
      "Status &amp; motivo",
    ]);
    assert.doesNotMatch(markup, /Ações|Você/);
  });

  it("renders one body row per quote line", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupQuotesTable, {
        rows: [
          sampleRow({ orderNumber: 10 }),
          sampleRow({ orderNumber: 10, quantity: 3 }),
          sampleRow({ orderNumber: 20, outcome: "perdida", otherCustomer: true }),
        ],
      }),
    );

    assert.equal(markup.match(/data-tone=/g)?.length, 3);
  });
});
