import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerRecentLostOrdersTable } from "./OverviewCustomerRecentLostOrdersTable";

describe("OverviewCustomerRecentLostOrdersTable", () => {
  it("renders structured table with loading, empty and error states", () => {
    const loading = renderToStaticMarkup(
      React.createElement(OverviewCustomerRecentLostOrdersTable, {
        rows: [],
        isLoading: true,
        isError: false,
      }),
    );
    assert.match(loading, /Carregando pedidos perdidos recentes/i);

    const empty = renderToStaticMarkup(
      React.createElement(OverviewCustomerRecentLostOrdersTable, {
        rows: [],
        isLoading: false,
        isError: false,
      }),
    );
    assert.match(empty, /Nenhum pedido perdido recente/i);

    const error = renderToStaticMarkup(
      React.createElement(OverviewCustomerRecentLostOrdersTable, {
        rows: [],
        isLoading: false,
        isError: true,
      }),
    );
    assert.match(error, /Não foi possível carregar pedidos perdidos recentes/i);

    const loaded = renderToStaticMarkup(
      React.createElement(OverviewCustomerRecentLostOrdersTable, {
        rows: [
          {
            orderNumber: 1002,
            occurredAt: "2026-08-05",
            codRep: 10,
            sitped: 5,
          },
        ],
        isLoading: false,
        isError: false,
      }),
    );
    assert.match(loaded, /Pedido/i);
    assert.match(loaded, /1002/);
    assert.match(loaded, /2026-08-05/);
  });
});
