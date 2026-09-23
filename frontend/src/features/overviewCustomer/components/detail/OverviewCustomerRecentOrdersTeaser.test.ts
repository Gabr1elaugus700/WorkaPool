import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { OverviewCustomerRecentInvoicedOrder } from "../../types/overviewCustomerRecentCommercialMotion.types";
import { OverviewCustomerRecentOrdersTeaser } from "./OverviewCustomerRecentOrdersTeaser";

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

describe("OverviewCustomerRecentOrdersTeaser", () => {
  it("renders up to five recent invoiced orders with totals and view-all action", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerRecentOrdersTeaser, {
        invoicedOrders: [
          sampleOrder(1001, "2026-08-01"),
          sampleOrder(1002, "2026-07-15"),
          sampleOrder(1003, "2026-07-01"),
          sampleOrder(1004, "2026-06-20"),
          sampleOrder(1005, "2026-06-10"),
          sampleOrder(1006, "2026-05-01"),
        ],
        invoicedCountLast12Months: 78,
        isLoading: false,
        isError: false,
        onViewAll: () => undefined,
      }),
    );

    assert.match(markup, /Pedidos faturados recentes/i);
    assert.match(markup, /Total \(12 meses\): 78 faturas/);
    assert.match(markup, /Exibindo 5 faturas recentes de 78 nos últimos 12 meses/);
    assert.match(markup, /#1001/);
    assert.match(markup, /#1005/);
    assert.doesNotMatch(markup, /#1006/);
    assert.match(markup, /Ver movimentação completa/i);
    assert.match(markup, /Valor/i);
    assert.match(markup, /Volume/i);
    assert.match(markup, /Margem/i);
    assert.doesNotMatch(markup, /100% Faturados/i);
    assert.doesNotMatch(markup, /DANFE/i);
  });
});
