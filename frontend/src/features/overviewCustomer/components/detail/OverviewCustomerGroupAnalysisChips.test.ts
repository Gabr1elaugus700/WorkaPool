import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerGroupAnalysisChips } from "./OverviewCustomerGroupAnalysisChips";

const SAMPLE_GRUPOS = [
  { grupoCodigo: "G01", grupoDescricao: "Grupo A", revenueShare: 42 },
  { grupoCodigo: "OUTROS", grupoDescricao: "OUTROS PRODUTOS", revenueShare: 18 },
];

describe("OverviewCustomerGroupAnalysisChips", () => {
  it("renders group description labels with tablist and tab roles", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupAnalysisChips, {
        grupos: SAMPLE_GRUPOS,
        selectedGrupoCodigo: "G01",
        onSelect: () => undefined,
      }),
    );

    assert.match(markup, /role="tablist"/);
    assert.match(markup, /role="tab"/);
    assert.match(markup, /Grupo A/);
    assert.match(markup, /OUTROS PRODUTOS/);
    assert.doesNotMatch(markup, />G01</);
    assert.doesNotMatch(markup, />OUTROS</);
  });

  it("marks the selected chip with aria-selected", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupAnalysisChips, {
        grupos: SAMPLE_GRUPOS,
        selectedGrupoCodigo: "OUTROS",
        onSelect: () => undefined,
      }),
    );

    assert.match(markup, /aria-selected="true"/);
    assert.match(markup, /aria-selected="false"/);
  });
});
