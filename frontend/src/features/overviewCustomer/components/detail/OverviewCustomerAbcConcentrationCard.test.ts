import React from "react";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerAbcConcentrationCard } from "./OverviewCustomerAbcConcentrationCard";

describe("OverviewCustomerAbcConcentrationCard", () => {
  it("renders top products by revenue share with loading and empty states", () => {
    const loading = renderToStaticMarkup(
      React.createElement(OverviewCustomerAbcConcentrationCard, {
        products: [],
        isLoading: true,
        isError: false,
      }),
    );
    assert.match(loading, /Carregando concentração de mix/i);

    const empty = renderToStaticMarkup(
      React.createElement(OverviewCustomerAbcConcentrationCard, {
        products: [],
        isLoading: false,
        isError: false,
      }),
    );
    assert.match(empty, /Nenhum produto no mix/i);

    const loaded = renderToStaticMarkup(
      React.createElement(OverviewCustomerAbcConcentrationCard, {
        products: [
          {
            productCode: "101",
            productName: "Produto Beta",
            quantity: 1,
            volume: 1,
            revenue: 500,
            averagePrice: 500,
            marginPercentWeightedByRevenue: 22,
            firstPurchaseAt: "2024-01-01",
            lastPurchaseAt: "2024-02-01",
            frequencyDays: 30,
            revenueShare: 45,
          },
        ],
        isLoading: false,
        isError: false,
      }),
    );
    assert.match(loaded, /Concentração de mix/i);
    assert.match(loaded, /Produto Beta/);
    assert.match(loaded, /45/);
  });
});
