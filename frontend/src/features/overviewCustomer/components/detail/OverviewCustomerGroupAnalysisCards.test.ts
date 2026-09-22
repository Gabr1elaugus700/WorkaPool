import React from "react";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  resolveGanhosCardViewState,
  resolvePerdidosCardViewState,
} from "../../utils/overviewCustomerGroupAnaliseDisplay.utils";
import { OverviewCustomerGroupGanhosCard } from "./OverviewCustomerGroupGanhosCard";
import { OverviewCustomerGroupPerdidosCard } from "./OverviewCustomerGroupPerdidosCard";

const ganho = {
  numnfv: 9,
  numped: 9,
  datemi: "2024-09-01",
  vlrfinal: 90,
  qtdped: 1,
  preuni: 90,
  margem: 10,
};

describe("OverviewCustomerGroupAnalysisCards layout", () => {
  it("stacks ganhos above perdidos and keeps ganhos when perdidos fail", () => {
    const analise = {
      customerCode: 123,
      grupoCodigo: "G01",
      ganhos: [ganho],
      perdidos: null,
      perdidosFailed: true,
    };

    const markup = renderToStaticMarkup(
      React.createElement(
        "div",
        { className: "grid grid-cols-1 gap-4 md:grid-cols-2" },
        React.createElement(OverviewCustomerGroupGanhosCard, {
          viewState: resolveGanhosCardViewState({
            isInitialLoading: false,
            isError: false,
            ganhos: analise.ganhos,
          }),
        }),
        React.createElement(OverviewCustomerGroupPerdidosCard, {
          viewState: resolvePerdidosCardViewState({
            isInitialLoading: false,
            isError: false,
            perdidosFailed: analise.perdidosFailed,
            perdidos: analise.perdidos,
            hasLoadedAnalise: true,
          }),
          onRetry: () => undefined,
        }),
      ),
    );

    const ganhosIndex = markup.indexOf("Ganhos");
    const perdidosIndex = markup.indexOf("Perdidos");
    assert.ok(ganhosIndex >= 0);
    assert.ok(perdidosIndex > ganhosIndex);
    assert.match(markup, /grid-cols-1/);
    assert.match(markup, /md:grid-cols-2/);
    assert.match(markup, /NF 9/);
    assert.match(markup, /Não foi possível carregar pedidos perdidos/i);
    assert.match(markup, /Tentar novamente/);
    assert.doesNotMatch(markup, /Nenhum pedido encontrado\./);
  });
});
