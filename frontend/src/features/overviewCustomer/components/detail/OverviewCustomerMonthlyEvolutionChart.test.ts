import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerMonthlyEvolutionChart } from "./OverviewCustomerMonthlyEvolutionChart";

describe("OverviewCustomerMonthlyEvolutionChart", () => {
  it("renders loading, empty, error and loaded states safely", () => {
    const loading = renderToStaticMarkup(
      React.createElement(OverviewCustomerMonthlyEvolutionChart, {
        rows: [],
        isLoading: true,
        isError: false,
      }),
    );
    assert.match(loading, /Carregando a evolução mensal/i);

    const empty = renderToStaticMarkup(
      React.createElement(OverviewCustomerMonthlyEvolutionChart, {
        rows: [],
        isLoading: false,
        isError: false,
      }),
    );
    assert.match(empty, /Não há dados de evolução mensal/i);

    const error = renderToStaticMarkup(
      React.createElement(OverviewCustomerMonthlyEvolutionChart, {
        rows: [],
        isLoading: false,
        isError: true,
      }),
    );
    assert.match(error, /Não foi possível carregar a evolução mensal/i);

    const loaded = renderToStaticMarkup(
      React.createElement(OverviewCustomerMonthlyEvolutionChart, {
        rows: [
          {
            month: "2024-01",
            revenue: 1000,
            volume: 200,
            orderCount: 3,
            marginPercent: 21.5,
          },
        ],
        isLoading: false,
        isError: false,
      }),
    );
    assert.match(loaded, /Evolução mensal de faturamento e volume/i);
    assert.match(loaded, /recharts-surface|ComposedChart/);
  });
});
