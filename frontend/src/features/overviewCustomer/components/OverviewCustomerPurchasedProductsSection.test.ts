import React from "react";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerPurchasedProductsSection } from "./OverviewCustomerPurchasedProductsSection";

describe("OverviewCustomerPurchasedProductsSection", () => {
  it("renders loading, empty, error and loaded states safely", () => {
    const loading = renderToStaticMarkup(
      React.createElement(OverviewCustomerPurchasedProductsSection, {
        rows: [],
        isLoading: true,
        isError: false,
      }),
    );
    assert.match(loading, /Carregando produtos comprados/i);

    const empty = renderToStaticMarkup(
      React.createElement(OverviewCustomerPurchasedProductsSection, {
        rows: [],
        isLoading: false,
        isError: false,
      }),
    );
    assert.match(empty, /Nenhum produto comprado disponível/i);

    const error = renderToStaticMarkup(
      React.createElement(OverviewCustomerPurchasedProductsSection, {
        rows: [],
        isLoading: false,
        isError: true,
      }),
    );
    assert.match(error, /Não foi possível carregar os produtos comprados/i);

    const loaded = renderToStaticMarkup(
      React.createElement(OverviewCustomerPurchasedProductsSection, {
        rows: [
          {
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
          },
        ],
        isLoading: false,
        isError: false,
      }),
    );
    assert.match(loaded, /Produtos comprados \(1\)/);
    assert.match(loaded, /Buscar por nome ou código/i);
    assert.match(loaded, /Produto A/);
    assert.match(loaded, /101072/);
    assert.match(loaded, /R\$\s*280,00/);
    assert.match(loaded, /73,68%/);
    assert.match(loaded, /2024-02-10/);
  });
});
