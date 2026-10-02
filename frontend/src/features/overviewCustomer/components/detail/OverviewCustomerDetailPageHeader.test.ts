import React from "react";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { OverviewCustomerDetailPageHeader } from "./OverviewCustomerDetailPageHeader";

describe("OverviewCustomerDetailPageHeader", () => {
  it("renders breadcrumb, title and back link to portfolio", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(OverviewCustomerDetailPageHeader, {
          tradeName: "QUIBRAS QUIMICA",
          customerCode: 4821,
        }),
      ),
    );

    assert.match(markup, /Análise Comercial 360°/);
    assert.match(markup, />CRM</);
    assert.match(markup, /QUIBRAS QUIMICA/);
    assert.match(markup, /href="\/crm"/);
    assert.match(markup, /Voltar para o CRM/);
    assert.match(markup, /Exportar relatório/i);
    assert.match(markup, /disabled/);
  });
});
