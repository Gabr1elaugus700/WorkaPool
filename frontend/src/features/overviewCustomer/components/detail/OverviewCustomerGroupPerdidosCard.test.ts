import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerGroupPerdidosCard } from "./OverviewCustomerGroupPerdidosCard";

const GROUP_PROPS = {
  grupoDescricao: "Lauril",
  revenueShare: 27,
} as const;

describe("OverviewCustomerGroupPerdidosCard", () => {
  it("renders empty copy only on success and retry on error", () => {
    const empty = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupPerdidosCard, {
        viewState: { kind: "empty" },
        ...GROUP_PROPS,
      }),
    );
    assert.match(empty, /Nenhum pedido encontrado\./);
    assert.match(empty, /Perdidos: Cotações Sem Fechamento/);
    assert.doesNotMatch(empty, /Tentar novamente/);

    const errorWithoutRetry = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupPerdidosCard, {
        viewState: { kind: "error" },
        ...GROUP_PROPS,
      }),
    );
    assert.match(errorWithoutRetry, /Não foi possível carregar pedidos perdidos/i);
    assert.doesNotMatch(errorWithoutRetry, /Nenhum pedido encontrado\./);
    assert.doesNotMatch(errorWithoutRetry, /Tentar novamente/);

    const errorWithRetry = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupPerdidosCard, {
        viewState: { kind: "error" },
        ...GROUP_PROPS,
        onRetry: () => undefined,
      }),
    );
    assert.match(errorWithRetry, /Tentar novamente/);
    assert.doesNotMatch(errorWithRetry, /Nenhum pedido encontrado\./);
  });

  it("renders perdido rows with numped, motivo callout and perda total", () => {
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
        ...GROUP_PROPS,
      }),
    );
    assert.match(loaded, /Pedido 100/);
    assert.match(loaded, /Motivo Registrado:/);
    assert.match(loaded, /Sem justificativa registrada\./);
    assert.match(loaded, /Valor Ofertado/);
    assert.match(loaded, /Preço Ofertado/);
    assert.match(loaded, /Perda Total:/);
    assert.match(loaded, /Margem projetada:/);
  });
});
