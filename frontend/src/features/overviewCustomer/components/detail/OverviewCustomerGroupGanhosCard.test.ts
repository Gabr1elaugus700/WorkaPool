import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerGroupGanhosCard } from "./OverviewCustomerGroupGanhosCard";

describe("OverviewCustomerGroupGanhosCard", () => {
  it("renders loading, empty, error and ganho rows with numnfv", () => {
    const loading = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupGanhosCard, {
        viewState: { kind: "loading" },
      }),
    );
    assert.match(loading, /Carregando pedidos ganhos/i);

    const empty = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupGanhosCard, {
        viewState: { kind: "empty" },
      }),
    );
    assert.match(empty, /Nenhum pedido encontrado\./);

    const error = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupGanhosCard, {
        viewState: { kind: "error" },
      }),
    );
    assert.match(error, /Não foi possível carregar pedidos ganhos/i);

    const loaded = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupGanhosCard, {
        viewState: {
          kind: "rows",
          rows: [
            {
              numnfv: 42,
              numped: 99,
              datemi: "2024-09-01",
              vlrfinal: 90,
              qtdped: 1,
              preuni: 90,
              margem: 10,
            },
          ],
        },
      }),
    );
    assert.match(loaded, /NF 42/);
    assert.doesNotMatch(loaded, /Pedido 99/);
  });
});
