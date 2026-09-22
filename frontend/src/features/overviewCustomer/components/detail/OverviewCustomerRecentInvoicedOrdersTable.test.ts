import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerRecentInvoicedOrdersTable } from "./OverviewCustomerRecentInvoicedOrdersTable";

describe("OverviewCustomerRecentInvoicedOrdersTable", () => {
  it("renders structured table with loading, empty and error states", () => {
    const loading = renderToStaticMarkup(
      React.createElement(OverviewCustomerRecentInvoicedOrdersTable, {
        rows: [],
        isLoading: true,
        isError: false,
      }),
    );
    assert.match(loading, /Carregando pedidos faturados recentes/i);

    const empty = renderToStaticMarkup(
      React.createElement(OverviewCustomerRecentInvoicedOrdersTable, {
        rows: [],
        isLoading: false,
        isError: false,
      }),
    );
    assert.match(empty, /Nenhum pedido faturado recente/i);

    const error = renderToStaticMarkup(
      React.createElement(OverviewCustomerRecentInvoicedOrdersTable, {
        rows: [],
        isLoading: false,
        isError: true,
      }),
    );
    assert.match(error, /Não foi possível carregar pedidos faturados recentes/i);

    const loaded = renderToStaticMarkup(
      React.createElement(OverviewCustomerRecentInvoicedOrdersTable, {
        rows: [
          {
            orderNumber: 1001,
            occurredAt: "2026-08-01",
            codRep: 10,
            branchCode: 1,
          },
        ],
        isLoading: false,
        isError: false,
      }),
    );
    assert.match(loaded, /Pedido/i);
    assert.match(loaded, /Filial/i);
    assert.match(loaded, /1001/);
    assert.match(loaded, /2026-08-01/);
  });
});
