import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { OverviewCustomerRecentInvoicedOrder } from "../../types/overviewCustomerRecentCommercialMotion.types";
import { OverviewCustomerDetailMotionPanel } from "./OverviewCustomerDetailMotionPanel";

function sampleOrder(
  overrides: Partial<OverviewCustomerRecentInvoicedOrder> = {},
): OverviewCustomerRecentInvoicedOrder {
  return {
    orderNumber: 1001,
    occurredAt: "2026-08-01",
    codRep: 10,
    branchCode: 1,
    revenue: 1500,
    volume: 120,
    marginPercent: 18.5,
    items: [
      {
        productCode: "P1",
        productName: "Tubo 100",
        quantity: 120,
        volume: 120,
        revenue: 1500,
        unitPrice: 12.5,
        marginPercent: 18.5,
      },
    ],
    ...overrides,
  };
}

describe("OverviewCustomerDetailMotionPanel", () => {
  it("renders summary and expandable invoiced orders without lost-order list", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerDetailMotionPanel, {
        lastInvoicedPurchaseAt: "2026-08-01",
        lastLostOrderAt: "2026-08-05",
        lastCommercialMovementAt: "2026-08-05",
        invoicedCountLast12Months: 4,
        lostCountLast12Months: 2,
        recentInvoicedOrders: [sampleOrder()],
        isLoadingInvoiced: false,
        isErrorInvoiced: false,
      }),
    );

    assert.match(markup, /Movimentação comercial recente/i);
    assert.match(markup, /Última compra \(NF faturada\)/i);
    assert.match(markup, /Último pedido perdido/i);
    assert.match(markup, /Pedidos faturados recentes/i);
    assert.doesNotMatch(markup, /Pedidos perdidos recentes/i);
    assert.doesNotMatch(markup, /Ver no Order Loss/i);
    assert.match(markup, /#1001/);
    assert.match(markup, /aria-expanded="false"/);
  });
});
