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

function render(row: OverviewCustomerGroupQuoteRow): string {
  return renderToStaticMarkup(
    React.createElement(
      "table",
      null,
      React.createElement(
        "tbody",
        null,
        React.createElement(OverviewCustomerGroupQuoteRowView, { row }),
      ),
    ),
  );
}

describe("OverviewCustomerGroupQuoteRowView", () => {
  it("renders own won row green with seller name and every DTO metric", () => {
    const markup = render(sampleRow());

    assert.match(markup, /<tr(?=[^>]*data-tone="ganha")(?=[^>]*bg-primary\/10)/);
    assert.match(markup, />100</);
    assert.match(markup, />Faturado</);
    assert.match(markup, />15\/09\/2026</);
    assert.match(markup, />Ana</);
    assert.match(markup, /2,00 kg/);
    assert.match(markup, /R\$\s10,00\/kg/);
    assert.match(markup, /R\$\s20,00/);
    assert.match(markup, />5,00%</);
    assert.match(markup, /R\$\s8,00/);
    assert.match(markup, /R\$\s1,00/);
    assert.match(markup, /R\$\s2,00/);
    assert.match(markup, />12,00%</);
    assert.match(markup, /R\$\s1,50/);
    assert.match(markup, /Transp\. 99/);
    assert.match(markup, /Frete incluso/);
    assert.match(markup, />Ganha</);
    assert.doesNotMatch(markup, /Você|Ações|NF-e|DANFE|Filial/i);
  });

  it("renders own lost row red with loss reason", () => {
    const markup = render(
      sampleRow({ outcome: "perdida", situation: 5, lossReason: "Preço alto" }),
    );

    assert.match(markup, /<tr(?=[^>]*data-tone="perdida")(?=[^>]*bg-destructive\/10)/);
    assert.match(markup, />Sem fechamento</);
    assert.match(markup, />Perdida</);
    assert.match(markup, /Preço alto/);
  });

  it("renders other-customer row neutral with seller name and trade name", () => {
    const markup = render(
      sampleRow({
        otherCustomer: true,
        customerTradeName: "Cliente B",
        sellerName: "Bruno",
        codRep: 20,
      }),
    );

    assert.match(markup, /<tr(?=[^>]*data-tone="outro")(?=[^>]*bg-muted\/40)/);
    assert.match(markup, />Bruno</);
    assert.match(markup, /Cliente B/);
    assert.doesNotMatch(markup, /20 Bruno/);
  });

  it("falls back to repShortName and reports missing freight data", () => {
    const markup = render(
      sampleRow({
        sellerName: null,
        repShortName: "Rep B",
        freightAmount: null,
        carrierCode: null,
        freightIncluded: false,
        marginPercent: null,
      }),
    );

    assert.match(markup, />Rep B</);
    assert.match(markup, /Frete não incluso/);
    assert.doesNotMatch(markup, /Transp\./);
    assert.match(markup, /Não informado/);
  });
});
