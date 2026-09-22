import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { OverviewCustomerRecentInvoicedOrder } from "../types/overviewCustomerRecentCommercialMotion.types";
import { OverviewCustomerRecentCommercialMotionSection } from "./OverviewCustomerRecentCommercialMotionSection";

function sampleOrder(): OverviewCustomerRecentInvoicedOrder {
  return {
    orderNumber: 1001,
    occurredAt: "2026-08-01",
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

function renderMotionSection(
  props: React.ComponentProps<typeof OverviewCustomerRecentCommercialMotionSection>,
) {
  return renderToStaticMarkup(
    React.createElement(OverviewCustomerRecentCommercialMotionSection, props),
  );
}

describe("OverviewCustomerRecentCommercialMotionSection", () => {
  it("renders separated movement dates and invoiced orders without lost list", () => {
    const html = renderMotionSection({
      lastInvoicedPurchaseAt: "2026-08-01",
      lastLostOrderAt: "2026-08-05",
      lastCommercialMovementAt: "2026-08-05",
      invoicedCountLast12Months: 4,
      lostCountLast12Months: 2,
      recentInvoicedOrders: [sampleOrder()],
      isLoadingInvoiced: false,
      isErrorInvoiced: false,
    });

    assert.match(html, /Última compra \(NF faturada\)/i);
    assert.match(html, /Último pedido perdido/i);
    assert.match(html, /Última movimentação comercial/i);
    assert.match(html, /Pedidos faturados recentes/i);
    assert.doesNotMatch(html, /Pedidos perdidos recentes/i);
    assert.match(html, /#1001/);
    assert.match(html, /Faturados \(12 meses\)/i);
    assert.doesNotMatch(html, /Ver no Order Loss/i);
  });

  it("renders first-paint movement dates while lazy lists are still loading", () => {
    const html = renderMotionSection({
      lastInvoicedPurchaseAt: "2026-08-01",
      lastLostOrderAt: "2026-08-05",
      lastCommercialMovementAt: "2026-08-05",
      invoicedCountLast12Months: 3,
      lostCountLast12Months: 1,
      recentInvoicedOrders: [],
      isLoadingInvoiced: true,
      isErrorInvoiced: false,
    });

    assert.match(html, /2026-08-01/);
    assert.match(html, /2026-08-05/);
    assert.match(html, /Carregando pedidos faturados recentes/i);
  });

  it("renders non-blocking loading and error states for invoiced orders", () => {
    const loading = renderMotionSection({
      lastInvoicedPurchaseAt: "2026-08-01",
      lastLostOrderAt: null,
      lastCommercialMovementAt: "2026-08-01",
      invoicedCountLast12Months: null,
      lostCountLast12Months: null,
      recentInvoicedOrders: [],
      isLoadingInvoiced: true,
      isErrorInvoiced: false,
    });

    assert.match(loading, /Carregando pedidos faturados recentes/i);

    const error = renderMotionSection({
      lastInvoicedPurchaseAt: "2026-08-01",
      lastLostOrderAt: "2026-08-05",
      lastCommercialMovementAt: "2026-08-05",
      invoicedCountLast12Months: 2,
      lostCountLast12Months: 1,
      recentInvoicedOrders: [],
      isLoadingInvoiced: false,
      isErrorInvoiced: true,
    });

    assert.match(error, /Não foi possível carregar pedidos faturados recentes/i);
  });
});
