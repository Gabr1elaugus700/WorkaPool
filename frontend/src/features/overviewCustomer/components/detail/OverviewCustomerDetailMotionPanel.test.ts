import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { OverviewCustomerDetailMotionPanel } from "./OverviewCustomerDetailMotionPanel";

describe("OverviewCustomerDetailMotionPanel", () => {
  it("renders summary, structured tables and order-loss link", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(OverviewCustomerDetailMotionPanel, {
          customerCode: 4821,
          lastInvoicedPurchaseAt: "2026-08-01",
        lastLostOrderAt: "2026-08-05",
        lastCommercialMovementAt: "2026-08-05",
        invoicedCountLast12Months: 4,
        lostCountLast12Months: 2,
        recentInvoicedOrders: [
          {
            orderNumber: 1001,
            occurredAt: "2026-08-01",
            codRep: 10,
            branchCode: 1,
          },
        ],
        recentLostOrders: [
          {
            orderNumber: 1002,
            occurredAt: "2026-08-05",
            codRep: 10,
            sitped: 5,
          },
        ],
        isLoadingInvoiced: false,
        isLoadingLost: false,
        isErrorInvoiced: false,
        isErrorLost: false,
        }),
      ),
    );

    assert.match(markup, /Movimentação comercial recente/i);
    assert.match(markup, /Última compra \(NF faturada\)/i);
    assert.match(markup, /Pedidos faturados recentes/i);
    assert.match(markup, /Pedidos perdidos recentes/i);
    assert.match(markup, /1001/);
    assert.match(markup, /1002/);
    assert.match(markup, /Ver no Order Loss/i);
    assert.match(markup, /customerCode=4821/);
  });
});
