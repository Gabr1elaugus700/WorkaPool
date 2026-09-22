import React from "react";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { OverviewCustomerRecentCommercialMotionSection } from "./OverviewCustomerRecentCommercialMotionSection";

function renderMotionSection(
  props: React.ComponentProps<typeof OverviewCustomerRecentCommercialMotionSection>,
) {
  return renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(OverviewCustomerRecentCommercialMotionSection, props),
    ),
  );
}

describe("OverviewCustomerRecentCommercialMotionSection", () => {
  it("renders separated movement dates and both recent sections", () => {
    const html = renderMotionSection({
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
    });

    assert.match(html, /Última compra \(NF faturada\)/i);
    assert.match(html, /Último pedido perdido/i);
    assert.match(html, /Última movimentação comercial/i);
    assert.match(html, /Pedidos faturados recentes/i);
    assert.match(html, /Pedidos perdidos recentes/i);
    assert.match(html, /1001/);
    assert.match(html, /1002/);
    assert.match(html, /Faturados \(12 meses\)/i);
    assert.match(html, /Ver no Order Loss/i);
    assert.match(html, /customerCode=4821/);
  });

  it("renders first-paint movement dates while lazy lists are still loading", () => {
    const html = renderMotionSection({
      customerCode: 4821,
      lastInvoicedPurchaseAt: "2026-08-01",
      lastLostOrderAt: "2026-08-05",
      lastCommercialMovementAt: "2026-08-05",
      invoicedCountLast12Months: 3,
      lostCountLast12Months: 1,
      recentInvoicedOrders: [],
      recentLostOrders: [],
      isLoadingInvoiced: true,
      isLoadingLost: true,
      isErrorInvoiced: false,
      isErrorLost: false,
    });

    assert.match(html, /2026-08-01/);
    assert.match(html, /2026-08-05/);
    assert.match(html, /Carregando pedidos faturados recentes/i);
    assert.match(html, /Carregando pedidos perdidos recentes/i);
  });

  it("renders non-blocking loading, empty and error states per slice", () => {
    const loadingAndEmpty = renderMotionSection({
      customerCode: 4821,
      lastInvoicedPurchaseAt: "2026-08-01",
      lastLostOrderAt: null,
      lastCommercialMovementAt: "2026-08-01",
      invoicedCountLast12Months: null,
      lostCountLast12Months: null,
      recentInvoicedOrders: [],
      recentLostOrders: [],
      isLoadingInvoiced: true,
      isLoadingLost: false,
      isErrorInvoiced: false,
      isErrorLost: false,
    });

    assert.match(loadingAndEmpty, /Carregando pedidos faturados recentes/i);
    assert.match(loadingAndEmpty, /Nenhum pedido perdido recente para este cliente/i);

    const errorAndLoaded = renderMotionSection({
      customerCode: 4821,
      lastInvoicedPurchaseAt: "2026-08-01",
      lastLostOrderAt: "2026-08-05",
      lastCommercialMovementAt: "2026-08-05",
      invoicedCountLast12Months: 2,
      lostCountLast12Months: 1,
      recentInvoicedOrders: [
        {
          orderNumber: 1001,
          occurredAt: "2026-08-01",
          codRep: 10,
          branchCode: 1,
        },
      ],
      recentLostOrders: [],
      isLoadingInvoiced: false,
      isLoadingLost: false,
      isErrorInvoiced: false,
      isErrorLost: true,
    });

    assert.match(errorAndLoaded, /1001/);
    assert.match(errorAndLoaded, /Não foi possível carregar pedidos perdidos recentes/i);
  });
});
