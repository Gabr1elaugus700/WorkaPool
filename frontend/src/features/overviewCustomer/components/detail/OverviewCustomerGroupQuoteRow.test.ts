import React from "react";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { OverviewCustomerGroupQuoteRow } from "../../types/overviewCustomerGroupQuotes.types";
import { OverviewCustomerGroupQuoteRowView } from "./OverviewCustomerGroupQuoteRow";

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

describe("OverviewCustomerGroupQuoteRowView", () => {
  it("renders own won row saturated without badges or customer name", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupQuoteRowView, {
        row: sampleRow({ outcome: "ganha", otherCustomer: false }),
      }),
    );

    assert.match(markup, /Pedido 100/);
    assert.match(markup, /bg-primary\/15/);
    assert.doesNotMatch(markup, />Ganha</);
    assert.doesNotMatch(markup, /10 Ana/);
    assert.doesNotMatch(markup, /Cliente B/);
    assert.doesNotMatch(markup, /DANFE|NF /i);
  });

  it("renders own lost row with loss reason and without badges", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupQuoteRowView, {
        row: sampleRow({
          outcome: "perdida",
          situation: 5,
          lossReason: "Preço alto",
          otherCustomer: false,
        }),
      }),
    );

    assert.match(markup, /bg-destructive\/15/);
    assert.match(markup, /Preço alto/);
    assert.doesNotMatch(markup, />Perdida</);
  });

  it("renders revealed other-customer row muted with badges and trade name", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupQuoteRowView, {
        row: sampleRow({
          outcome: "ganha",
          otherCustomer: true,
          customerTradeName: "Cliente B",
          sellerName: "Bruno",
          codRep: 20,
        }),
      }),
    );

    assert.match(markup, /opacity-80/);
    assert.match(markup, /Cliente B/);
    assert.match(markup, />Ganha</);
    assert.match(markup, /20 Bruno/);
    assert.match(markup, /bg-sky-600/);
  });

  it("falls back to repShortName on the blue badge when sellerName is null", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupQuoteRowView, {
        row: sampleRow({
          otherCustomer: true,
          customerTradeName: "Outro",
          sellerName: null,
          repShortName: "Rep B",
          codRep: 20,
        }),
      }),
    );

    assert.match(markup, /20 Rep B/);
  });
});
