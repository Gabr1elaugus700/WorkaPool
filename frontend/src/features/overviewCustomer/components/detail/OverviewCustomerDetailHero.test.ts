import React from "react";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
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
    assert.doesNotMatch(markup, /Recência/);
    assert.doesNotMatch(markup, /Documento:/);
  });
});
