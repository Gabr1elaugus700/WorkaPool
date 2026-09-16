import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerCommercialSummaryCard } from "./OverviewCustomerCommercialSummaryCard";

describe("OverviewCustomerCommercialSummaryCard", () => {
  it("renders Jan/2024 labels and frequency fields", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerCommercialSummaryCard, {
        summary: {
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
        },
      }),
    );

    assert.match(markup, /Faturamento \(desde Jan\/2024\)/);
    assert.match(markup, /Pedidos \(desde Jan\/2024\)/);
    assert.match(markup, /Ticket médio \(desde Jan\/2024\)/);
    assert.match(markup, /Volume \(desde Jan\/2024\)/);
    assert.match(markup, /Frequência média de compra \(dias\)/);
    assert.match(markup, /Dias desde a última compra/);
  });
});
