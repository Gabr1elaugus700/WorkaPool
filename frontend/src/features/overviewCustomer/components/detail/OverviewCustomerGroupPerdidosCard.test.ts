import React from "react";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerGroupPerdidosCard } from "./OverviewCustomerGroupPerdidosCard";

describe("OverviewCustomerGroupPerdidosCard", () => {
  it("renders empty copy only on success and retry on error", () => {
    const empty = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupPerdidosCard, {
        viewState: { kind: "empty" },
      }),
    );
    assert.match(empty, /Nenhum pedido encontrado\./);
    assert.doesNotMatch(empty, /Tentar novamente/);

    const errorWithoutRetry = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupPerdidosCard, {
        viewState: { kind: "error" },
      }),
    );
    assert.match(errorWithoutRetry, /Não foi possível carregar pedidos perdidos/i);
    assert.doesNotMatch(errorWithoutRetry, /Nenhum pedido encontrado\./);
    assert.doesNotMatch(errorWithoutRetry, /Tentar novamente/);

    const errorWithRetry = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupPerdidosCard, {
        viewState: { kind: "error" },
        onRetry: () => undefined,
      }),
    );
    assert.match(errorWithRetry, /Tentar novamente/);
    assert.doesNotMatch(errorWithRetry, /Nenhum pedido encontrado\./);
  });

  it("renders perdido rows with numped and motivo", () => {
    const loaded = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupPerdidosCard, {
        viewState: {
          kind: "rows",
          rows: [
            {
              numped: 100,
              datemi: "2026-09-01",
              vlrfinal: 80,
              qtdped: 5,
              preuni: 16,
              margem: 17.5,
              motivo: "Sem justificativa registrada.",
            },
          ],
        },
      }),
    );
    assert.match(loaded, /Pedido 100/);
    assert.match(loaded, /Sem justificativa registrada\./);
  });
});
