import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerDetailHero } from "./OverviewCustomerDetailHero";
import type { OverviewCustomerIdentity } from "../../types/overviewCustomerDetail.types";

const customerFixture: OverviewCustomerIdentity = {
  customerCode: 4821,
  tradeName: "QUIBRAS QUIMICA BRASILEIRA",
  document: "12.345.678/0001-90",
  city: "Curitiba",
  state: "PR",
  segment: "Quimica Brasil",
  registrationDate: "2018-03-15",
  primaryCodRep: 42,
  firstInvoicedPurchaseAt: "2024-01-10",
  lastInvoicedPurchaseAt: "2026-08-01",
  lastLostOrderAt: null,
  lastCommercialMovementAt: "2026-08-01",
  branchIndicator: "CTB",
};

describe("OverviewCustomerDetailHero", () => {
  it("renders identity, health score mock and commercial signals", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerDetailHero, {
        customer: customerFixture,
        commercialSignals: {
          purchaseFrequencyDays: 16,
          daysSinceLastPurchase: 9,
          maxInvoicedOrderMarginPercent: 40,
          minInvoicedOrderMarginPercent: 20,
        },
      }),
    );

    assert.match(markup, /QUIBRAS QUIMICA BRASILEIRA/);
    assert.match(markup, /Cód: #4821/);
    assert.match(markup, /Curitiba\/PR/);
    assert.match(markup, /CTB/);
    assert.match(markup, /12\.345\.678\/0001-90/);
    assert.match(markup, /Score de Saúde 360°/);
    assert.match(markup, /Dias desde última compra/);
    assert.match(markup, /Maior margem \(pedido ganho\)/);
    assert.match(markup, /Menor margem vendida/);
    assert.match(markup, /40,00%/);
    assert.match(markup, /20,00%/);
    assert.match(markup, /QQ/);
    assert.match(markup, /Quantidade de pedidos/);
    assert.match(markup, /Totais/);
    assert.match(markup, /Faturados/);
    assert.match(markup, /Perdidos/);
    assert.doesNotMatch(markup, /Recência/);
    assert.doesNotMatch(markup, /Documento:/);
  });

  it("renders orderCounts between identity and health score", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerDetailHero, {
        customer: customerFixture,
        orderCounts: {
          invoicedSinceJan2024: 10,
          lostSinceJan2024: 4,
          totalSinceJan2024: 14,
          invoicedLast60Days: 2,
          lostLast60Days: 1,
          totalLast60Days: 3,
        },
        commercialSignals: {
          purchaseFrequencyDays: 16,
          daysSinceLastPurchase: 9,
          maxInvoicedOrderMarginPercent: 40,
          minInvoicedOrderMarginPercent: 20,
        },
      }),
    );

    const identityIdx = markup.indexOf("QUIBRAS QUIMICA BRASILEIRA");
    const countsIdx = markup.indexOf("Quantidade de pedidos");
    const healthIdx = markup.indexOf("Score de Saúde 360°");
    assert.ok(identityIdx >= 0);
    assert.ok(countsIdx > identityIdx);
    assert.ok(healthIdx > countsIdx);
    assert.match(markup, />14</);
    assert.match(markup, />10</);
    assert.match(markup, />4</);
  });
});
