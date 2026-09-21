import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerKpiGrid } from "./OverviewCustomerKpiGrid";

const summaryFixture = {
  revenueSinceJan2024: 1000,
  revenueLast12Months: 500,
  orderCountSinceJan2024: 12,
  orderCountLast12Months: 5,
  averageTicketSinceJan2024: 83.33,
  averageTicketLast12Months: 100,
  volumeSinceJan2024: 200,
  volumeLast12Months: 80,
  marginPercentWeightedByRevenue: 21.5,
  purchaseFrequencyDays: 27.3,
  daysSinceLastPurchase: 9,
};

describe("OverviewCustomerKpiGrid", () => {
  it("renders Jan/2024 labels and frequency fields", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerKpiGrid, {
        summary: summaryFixture,
      }),
    );

    assert.match(markup, /Faturamento \(desde Jan\/2024\)/);
    assert.match(markup, /Volume \(desde Jan\/2024\)/);
    assert.doesNotMatch(markup, /Pedidos \(desde Jan\/2024\)/);
    assert.match(markup, /Margem ponderada/);
    assert.match(markup, /Frequência média \(dias\)/);
    assert.match(markup, /Dias desde última compra/);
    assert.match(markup, /R\$\s*1\.000,00/);
    assert.match(markup, /21,50%/);
  });

  it("shows Não informado for nullable frequency and margin fields", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerKpiGrid, {
        summary: {
          ...summaryFixture,
          marginPercentWeightedByRevenue: null,
          purchaseFrequencyDays: null,
          daysSinceLastPurchase: null,
        },
      }),
    );

    const notInformedCount = (markup.match(/Não informado/g) ?? []).length;
    assert.equal(notInformedCount, 3);
  });
});
