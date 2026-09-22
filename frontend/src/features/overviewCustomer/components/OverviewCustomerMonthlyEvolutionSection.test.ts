import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerMonthlyEvolutionSection } from "./OverviewCustomerMonthlyEvolutionSection";

describe("OverviewCustomerMonthlyEvolutionSection", () => {
  it("renders closed, loading, empty, error and loaded states safely", () => {
    const closed = renderToStaticMarkup(
      React.createElement(OverviewCustomerMonthlyEvolutionSection, {
        rows: [],
        isLoading: false,
        isError: false,
        isOpen: false,
        onToggle: () => undefined,
      }),
    );
    assert.match(closed, /Carregar evolução mensal/i);
    assert.match(closed, /Abra esta seção para carregar a evolução mensal/i);

    const loading = renderToStaticMarkup(
      React.createElement(OverviewCustomerMonthlyEvolutionSection, {
        rows: [],
        isLoading: true,
        isError: false,
        isOpen: true,
        onToggle: () => undefined,
      }),
    );
    assert.match(loading, /Carregando a evolução mensal deste cliente/i);

    const empty = renderToStaticMarkup(
      React.createElement(OverviewCustomerMonthlyEvolutionSection, {
        rows: [],
        isLoading: false,
        isError: false,
        isOpen: true,
        onToggle: () => undefined,
      }),
    );
    assert.match(empty, /Não há dados de evolução mensal para este cliente/i);

    const error = renderToStaticMarkup(
      React.createElement(OverviewCustomerMonthlyEvolutionSection, {
        rows: [],
        isLoading: false,
        isError: true,
        isOpen: true,
        onToggle: () => undefined,
      }),
    );
    assert.match(error, /Não foi possível carregar a evolução mensal/i);

    const loaded = renderToStaticMarkup(
      React.createElement(OverviewCustomerMonthlyEvolutionSection, {
        rows: [
          {
            month: "2024-01",
            revenue: 1000,
            volume: 80,
            orderCount: 4,
            marginPercent: 21.5,
          },
        ],
        isLoading: false,
        isError: false,
        isOpen: true,
        onToggle: () => undefined,
      }),
    );
    assert.match(loaded, /Evolução mensal/);
    assert.match(loaded, /2024-01/);
    assert.match(loaded, /R\$\s*1.000,00/);
    assert.match(loaded, /21,50%/);
  });
});
