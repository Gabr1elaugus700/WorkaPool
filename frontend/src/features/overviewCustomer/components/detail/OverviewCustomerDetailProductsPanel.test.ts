import React from "react";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerDetailProductsPanel } from "./OverviewCustomerDetailProductsPanel";

const sampleRow = {
  productCode: "101072",
  productName: "Produto A",
  quantity: 12,
  volume: 6,
  revenue: 280,
  averagePrice: 23.33,
  marginPercentWeightedByRevenue: 38.57,
  firstPurchaseAt: "2024-01-10",
  lastPurchaseAt: "2024-02-10",
  frequencyDays: 31,
  revenueShare: 73.68,
};

describe("OverviewCustomerDetailProductsPanel", () => {
  it("renders loading, empty, error and loaded states with product count", () => {
    const loading = renderToStaticMarkup(
      React.createElement(OverviewCustomerDetailProductsPanel, {
        rows: [],
        isLoading: true,
        isError: false,
      }),
    );
    assert.match(loading, /Carregando produtos comprados/i);

    const empty = renderToStaticMarkup(
      React.createElement(OverviewCustomerDetailProductsPanel, {
        rows: [],
        isLoading: false,
        isError: false,
      }),
    );
    assert.match(empty, /Nenhum produto comprado disponível/i);

    const error = renderToStaticMarkup(
      React.createElement(OverviewCustomerDetailProductsPanel, {
        rows: [],
        isLoading: false,
        isError: true,
      }),
    );
    assert.match(error, /Não foi possível carregar os produtos comprados/i);

    const loaded = renderToStaticMarkup(
      React.createElement(OverviewCustomerDetailProductsPanel, {
        rows: [sampleRow],
        isLoading: false,
        isError: false,
      }),
    );
    assert.match(loaded, /Produtos comprados \(1\)/i);
    assert.match(loaded, /Buscar por nome ou código/i);
    assert.match(loaded, /Produto A/);
  });
});
