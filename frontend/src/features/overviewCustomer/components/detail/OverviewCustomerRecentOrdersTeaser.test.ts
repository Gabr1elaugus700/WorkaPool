import React from "react";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerRecentOrdersTeaser } from "./OverviewCustomerRecentOrdersTeaser";

describe("OverviewCustomerRecentOrdersTeaser", () => {
  it("renders up to three recent invoiced orders and view-all action", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerRecentOrdersTeaser, {
        invoicedOrders: [
          { orderNumber: 1001, occurredAt: "2026-08-01", codRep: 10, branchCode: 1 },
          { orderNumber: 1002, occurredAt: "2026-07-15", codRep: 10, branchCode: 1 },
          { orderNumber: 1003, occurredAt: "2026-07-01", codRep: 10, branchCode: 1 },
          { orderNumber: 1004, occurredAt: "2026-06-20", codRep: 10, branchCode: 1 },
        ],
        isLoading: false,
        isError: false,
        onViewAll: () => undefined,
      }),
    );

    assert.match(markup, /Pedidos faturados recentes/i);
    assert.match(markup, /#1001/);
    assert.match(markup, /#1003/);
    assert.doesNotMatch(markup, /#1004/);
    assert.match(markup, /Ver movimentação completa/i);
  });
});
