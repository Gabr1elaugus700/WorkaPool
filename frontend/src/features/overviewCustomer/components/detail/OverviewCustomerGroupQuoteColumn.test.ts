import React from "react";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { OverviewCustomerGroupQuoteRow } from "../../types/overviewCustomerGroupQuotes.types";
import {
  OVERVIEW_CUSTOMER_GROUP_QUOTES_EMPTY_FILTERED,
  OVERVIEW_CUSTOMER_GROUP_QUOTES_EMPTY_PRODUCTS,
  OVERVIEW_CUSTOMER_GROUP_QUOTES_EMPTY_ROWS,
  OVERVIEW_CUSTOMER_GROUP_QUOTES_ERROR,
  OverviewCustomerGroupQuoteColumn,
} from "./OverviewCustomerGroupQuoteColumn";
import { OVERVIEW_CUSTOMER_GROUP_QUOTES_TITLE } from "./OverviewCustomerGroupQuotesHeader";

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

const baseProps = {
  products: [{ productCode: "P001", productName: "Produto 1" }],
  selectedProductCode: "P001",
  rows: [] as OverviewCustomerGroupQuoteRow[],
  summaryCounts: { todas: 0, ganhas: 0, perdidas: 0, outros: 0 },
  otherCustomerCount: 0,
  isLoading: false,
  isError: false,
  revealAvailable: false,
  reveal: false,
  onProductChange: () => undefined,
  onRevealChange: () => undefined,
  onRetry: () => undefined,
};

describe("OverviewCustomerGroupQuoteColumn", () => {
  it("shows loading skeleton and not empty copy while loading", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupQuoteColumn, {
        ...baseProps,
        isLoading: true,
      }),
    );

    assert.match(markup, /Carregando cotações do grupo/);
    assert.doesNotMatch(markup, new RegExp(OVERVIEW_CUSTOMER_GROUP_QUOTES_EMPTY_PRODUCTS));
    assert.doesNotMatch(markup, new RegExp(OVERVIEW_CUSTOMER_GROUP_QUOTES_EMPTY_ROWS));
  });

  it("shows empty products message when there are no products after load", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupQuoteColumn, {
        ...baseProps,
        products: [],
        selectedProductCode: null,
      }),
    );

    assert.match(markup, new RegExp(OVERVIEW_CUSTOMER_GROUP_QUOTES_EMPTY_PRODUCTS));
  });

  it("shows empty rows message when product has no quotes", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupQuoteColumn, {
        ...baseProps,
        rows: [],
      }),
    );

    assert.match(markup, new RegExp(OVERVIEW_CUSTOMER_GROUP_QUOTES_EMPTY_ROWS));
    assert.match(markup, /P001/);
    assert.match(markup, /Produto 1/);
  });

  it("shows the filters toolbar and filtered empty copy when filters hide every row", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupQuoteColumn, {
        ...baseProps,
        rows: [],
        hasUnfilteredRows: true,
        filtersToolbar: React.createElement("div", null, "toolbar-slot"),
      }),
    );

    assert.match(markup, /toolbar-slot/);
    assert.match(markup, new RegExp(OVERVIEW_CUSTOMER_GROUP_QUOTES_EMPTY_FILTERED));
    assert.doesNotMatch(markup, new RegExp(OVERVIEW_CUSTOMER_GROUP_QUOTES_EMPTY_ROWS));
  });

  it("hides the filters toolbar when the product has no quotes", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupQuoteColumn, {
        ...baseProps,
        rows: [],
        hasUnfilteredRows: false,
        filtersToolbar: React.createElement("div", null, "toolbar-slot"),
      }),
    );

    assert.doesNotMatch(markup, /toolbar-slot/);
    assert.match(markup, new RegExp(OVERVIEW_CUSTOMER_GROUP_QUOTES_EMPTY_ROWS));
  });

  it("shows error with retry and not empty copy", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupQuoteColumn, {
        ...baseProps,
        isError: true,
      }),
    );

    assert.match(markup, new RegExp(OVERVIEW_CUSTOMER_GROUP_QUOTES_ERROR));
    assert.match(markup, /Tentar novamente/);
    assert.doesNotMatch(markup, new RegExp(OVERVIEW_CUSTOMER_GROUP_QUOTES_EMPTY_ROWS));
  });

  it("renders own and revealed rows in the table without the legacy two-card titles", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupQuoteColumn, {
        ...baseProps,
        revealAvailable: true,
        reveal: true,
        rows: [
          sampleRow({ orderNumber: 10, quantity: 1 }),
          sampleRow({
            orderNumber: 10,
            quantity: 2,
            lineAmount: 40,
          }),
          sampleRow({
            orderNumber: 20,
            otherCustomer: true,
            customerTradeName: "Cliente B",
            sellerName: "Bruno",
            codRep: 20,
          }),
        ],
      }),
    );

    assert.match(markup, /<table/);
    assert.equal(markup.match(/data-tone=/g)?.length, 3);
    assert.match(markup, />10</);
    assert.match(markup, />20</);
    assert.match(markup, /Cliente B/);
    assert.match(markup, /<tbody[^>]*><tr[^>]*data-tone=/);
    assert.doesNotMatch(markup, /Ganhos: Notas Faturadas/);
    assert.doesNotMatch(markup, /Perdidos: Cotações Sem Fechamento/);
    assert.doesNotMatch(markup, /Você/);
  });

  it("renders title, legend and product chips with the selected one marked", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupQuoteColumn, {
        ...baseProps,
        products: [
          { productCode: "P001", productName: "Produto 1" },
          { productCode: "P002", productName: "Produto 2" },
        ],
        rows: [sampleRow()],
      }),
    );

    assert.ok(markup.includes(OVERVIEW_CUSTOMER_GROUP_QUOTES_TITLE.replace("&", "&amp;")));
    assert.match(markup, /Insumo/);
    assert.match(markup, /aria-selected="true"[^>]*>.*?P001/);
    assert.match(markup, /aria-selected="false"[^>]*>.*?P002/);
    assert.match(markup, /Ganha</);
    assert.match(markup, /Perdida</);
    assert.match(markup, /Outro vendedor/);
  });

  it("hides the reveal toggle for VENDAS and shows it with the other-customer count otherwise", () => {
    const withoutReveal = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupQuoteColumn, {
        ...baseProps,
        revealAvailable: false,
        otherCustomerCount: 3,
        rows: [sampleRow()],
      }),
    );
    const withReveal = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupQuoteColumn, {
        ...baseProps,
        revealAvailable: true,
        reveal: false,
        otherCustomerCount: 3,
        rows: [sampleRow()],
      }),
    );

    assert.doesNotMatch(withoutReveal, /Outros Vendedores/);
    assert.match(withReveal, /Outros Vendedores/);
    assert.match(withReveal, />3</);
  });
});
