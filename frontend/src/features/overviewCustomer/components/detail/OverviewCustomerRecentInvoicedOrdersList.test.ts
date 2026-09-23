import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { OverviewCustomerRecentInvoicedOrder } from "../../types/overviewCustomerRecentCommercialMotion.types";
import { OverviewCustomerRecentInvoicedOrdersList } from "./OverviewCustomerRecentInvoicedOrdersList";

function sampleOrder(
  orderNumber: number,
  occurredAt: string,
): OverviewCustomerRecentInvoicedOrder {
  return {
    orderNumber,
    occurredAt,
    codRep: 10,
    branchCode: 1,
    revenue: 100,
    volume: 10,
    marginPercent: 12,
    items: [
      {
        productCode: "P1",
        productName: "Produto",
        quantity: 10,
        volume: 10,
        revenue: 100,
        unitPrice: 10,
        marginPercent: 12,
      },
    ],
  };
}

describe("OverviewCustomerRecentInvoicedOrdersList", () => {
  it("renders expandable order headers with commercial totals", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerRecentInvoicedOrdersList, {
        rows: [sampleOrder(1001, "2026-08-01")],
        isLoading: false,
        isError: false,
      }),
    );

    assert.match(markup, /#1001/);
    assert.match(markup, /Filial 1/);
    assert.match(markup, /Rep\. 10/);
    assert.match(markup, /Valor/i);
    assert.match(markup, /Volume/i);
    assert.match(markup, /Margem/i);
    assert.match(markup, /aria-expanded="false"/);
    assert.match(markup, /1 item/);
    assert.doesNotMatch(markup, /DANFE/i);
  });

  it("limits visible rows", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerRecentInvoicedOrdersList, {
        rows: [
          sampleOrder(1, "2026-08-06"),
          sampleOrder(2, "2026-08-05"),
          sampleOrder(3, "2026-08-04"),
          sampleOrder(4, "2026-08-03"),
          sampleOrder(5, "2026-08-02"),
          sampleOrder(6, "2026-08-01"),
        ],
        isLoading: false,
        isError: false,
        limit: 5,
      }),
    );

    assert.match(markup, /#1/);
    assert.match(markup, /#5/);
    assert.doesNotMatch(markup, /#6/);
  });
});
