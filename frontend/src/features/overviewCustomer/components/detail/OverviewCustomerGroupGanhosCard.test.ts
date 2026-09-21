import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerGroupGanhosCard } from "./OverviewCustomerGroupGanhosCard";

const GROUP_PROPS = {
  grupoDescricao: "Lauril",
  revenueShare: 27,
} as const;

describe("OverviewCustomerGroupGanhosCard", () => {
  it("renders empty and error messages without inventing rows", () => {
    const empty = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupGanhosCard, {
        viewState: { kind: "empty" },
        ...GROUP_PROPS,
      }),
    );
    assert.match(empty, /Nenhum pedido encontrado\./);
    assert.match(empty, /Ganhos: Notas Faturadas/);
    assert.match(empty, /Lauril 27%/);

    const error = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupGanhosCard, {
        viewState: { kind: "error" },
        ...GROUP_PROPS,
      }),
    );
    assert.match(error, /Não foi possível carregar pedidos ganhos/);

    const loading = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupGanhosCard, {
        viewState: { kind: "loading" },
        ...GROUP_PROPS,
      }),
    );
    assert.match(loading, /Carregando notas faturadas do grupo selecionado/);
  });

  it("renders ganho rows with NF identity, metrics and volume pill", () => {
    const loaded = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupGanhosCard, {
        viewState: {
          kind: "rows",
          rows: [
            {
              numnfv: 235638,
              numped: 1,
              datemi: "2026-09-01",
              vlrfinal: 7030,
              qtdped: 1000,
              preuni: 7.03,
              margem: 13.99,
            },
          ],
        },
        ...GROUP_PROPS,
      }),
    );
    assert.match(loaded, /NF 235638/);
    assert.match(loaded, /Valor Total/);
    assert.match(loaded, /Preço unit\./);
    assert.match(loaded, /Volume:/);
    assert.match(loaded, /1\.000,00 kg/);
  });
});
