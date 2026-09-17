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
  it("renders identity, branch badge and commercial signals", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerDetailHero, {
        customer: customerFixture,
        commercialSignals: {
          marginPercentWeightedByRevenue: 24.8,
          purchaseFrequencyDays: 16,
          daysSinceLastPurchase: 9,
        },
      }),
    );

    assert.match(markup, /QUIBRAS QUIMICA BRASILEIRA/);
    assert.match(markup, /#4821/);
    assert.match(markup, /Curitiba\/PR/);
    assert.match(markup, /CTB/);
    assert.match(markup, /12\.345\.678\/0001-90/);
    assert.match(markup, /24,80%/);
    assert.match(markup, /QQ/);
  });
});
