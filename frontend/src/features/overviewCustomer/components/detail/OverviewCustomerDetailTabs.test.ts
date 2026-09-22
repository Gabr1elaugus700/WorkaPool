import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerDetailTabs } from "./OverviewCustomerDetailTabs";

describe("OverviewCustomerDetailTabs", () => {
  it("renders tab labels and active panel content", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerDetailTabs, {
        activeTab: "overview",
        onTabChange: () => undefined,
        productCount: 14,
        overviewPanel: React.createElement("p", null, "Painel visao geral"),
        historyPanel: React.createElement("p", null, "Painel historico"),
        productsPanel: React.createElement("p", null, "Painel produtos"),
        motionPanel: React.createElement("p", null, "Painel movimentacao"),
      }),
    );

    assert.match(markup, /Visão Geral 360°/);
    assert.match(markup, /Histórico &amp; Gráficos|Histórico & Gráficos/);
    assert.match(markup, /Produtos &amp; Mix|Produtos & Mix/);
    assert.match(markup, /14 itens/);
    assert.match(markup, /Painel visao geral/);
    assert.doesNotMatch(markup, /Painel historico/);
  });
});
