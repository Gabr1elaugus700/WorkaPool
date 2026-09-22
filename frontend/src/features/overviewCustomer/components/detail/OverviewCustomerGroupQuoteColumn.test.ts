import React from "react";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { OverviewCustomerGroupQuoteRow } from "../../types/overviewCustomerGroupQuotes.types";
import {
  OVERVIEW_CUSTOMER_GROUP_QUOTES_EMPTY_PRODUCTS,
  OVERVIEW_CUSTOMER_GROUP_QUOTES_EMPTY_ROWS,
  OVERVIEW_CUSTOMER_GROUP_QUOTES_ERROR,
  OVERVIEW_CUSTOMER_GROUP_QUOTES_REVEAL_OFF,
  OVERVIEW_CUSTOMER_GROUP_QUOTES_REVEAL_ON,
  OverviewCustomerGroupQuoteColumn,
} from "./OverviewCustomerGroupQuoteColumn";

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
  selectedProductName: "Produto 1",
  rows: [] as OverviewCustomerGroupQuoteRow[],
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
        selectedProductName: null,
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

  it("renders own and revealed rows without the legacy two-card titles", () => {
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

    assert.match(markup, /Pedido 10/);
    assert.match(markup, /Pedido 20/);
    assert.match(markup, /Cliente B/);
    assert.match(markup, new RegExp(OVERVIEW_CUSTOMER_GROUP_QUOTES_REVEAL_OFF));
    assert.doesNotMatch(markup, /Ganhos: Notas Faturadas/);
    assert.doesNotMatch(markup, /Perdidos: Cotações Sem Fechamento/);
  });

  it("hides reveal button for VENDAS and shows reveal label when available and off", () => {
    const withoutReveal = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupQuoteColumn, {
        ...baseProps,
        revealAvailable: false,
        rows: [sampleRow()],
      }),
    );
    const withReveal = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupQuoteColumn, {
        ...baseProps,
        revealAvailable: true,
        reveal: false,
        rows: [sampleRow()],
      }),
    );

    assert.doesNotMatch(
      withoutReveal,
      new RegExp(OVERVIEW_CUSTOMER_GROUP_QUOTES_REVEAL_ON),
    );
    assert.match(withReveal, new RegExp(OVERVIEW_CUSTOMER_GROUP_QUOTES_REVEAL_ON));
  });
});
