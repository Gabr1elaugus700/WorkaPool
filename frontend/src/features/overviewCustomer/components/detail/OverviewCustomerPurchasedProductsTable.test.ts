import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerPurchasedProductsTable } from "./OverviewCustomerPurchasedProductsTable";

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

describe("OverviewCustomerPurchasedProductsTable", () => {
  it("renders product columns with mix progress bar", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerPurchasedProductsTable, {
        rows: [sampleRow],
        searchTerm: "",
      }),
    );

    assert.match(markup, /Produto A/);
    assert.match(markup, /101072/);
    assert.match(markup, /R\$\s*280,00/);
    assert.match(markup, /73,68%/);
    assert.match(markup, /2024-02-10/);
    assert.match(markup, /Mix/i);
  });

  it("filters rows by search term", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerPurchasedProductsTable, {
        rows: [
          sampleRow,
          {
            ...sampleRow,
            productCode: "999",
            productName: "Outro Produto",
          },
        ],
        searchTerm: "Outro",
      }),
    );

    assert.match(markup, /Outro Produto/);
    assert.doesNotMatch(markup, /Produto A/);
  });

  it("renders empty filter message when search has no matches", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerPurchasedProductsTable, {
        rows: [sampleRow],
        searchTerm: "inexistente",
      }),
    );

    assert.match(markup, /Nenhum produto corresponde à busca/i);
  });
});
