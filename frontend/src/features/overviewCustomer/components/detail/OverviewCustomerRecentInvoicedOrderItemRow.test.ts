import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { OverviewCustomerRecentInvoicedOrderItem } from "../../types/overviewCustomerRecentCommercialMotion.types";
import { OverviewCustomerRecentInvoicedOrderItemRow } from "./OverviewCustomerRecentInvoicedOrderItemRow";

function sampleItem(
  overrides: Partial<OverviewCustomerRecentInvoicedOrderItem> = {},
): OverviewCustomerRecentInvoicedOrderItem {
  return {
    productCode: "401004",
    productName: "Acido cloridrico",
    quantity: 2400,
    volume: 2400,
    revenue: 5760,
    unitPrice: 2.4,
    marginPercent: 14.95,
    ...overrides,
  };
}

describe("OverviewCustomerRecentInvoicedOrderItemRow", () => {
  it("renders product code, unit price, and commercial totals without DANFE", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerRecentInvoicedOrderItemRow, {
        item: sampleItem(),
      }),
    );

    assert.match(markup, /401004/);
    assert.match(markup, /Acido cloridrico/);
    assert.match(markup, /Preço unitário/i);
    assert.match(markup, /Qtd \/ Volume/i);
    assert.match(markup, /Total/i);
    assert.match(markup, /Margem/i);
    assert.doesNotMatch(markup, /DANFE/i);
  });
});
