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

const commercialSignals = {
  purchaseFrequencyDays: 16,
  daysSinceLastPurchase: 9,
};

const billing = {
  revenueLast30Days: 3636032.83,
  volumeLast30Days: 1200,
  revenueLast12Months: 2890110,
  volumeLast12Months: 900,
};

describe("OverviewCustomerDetailHero", () => {
  it("renders identity and health score without a standalone order-count block", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerDetailHero, {
        customer: customerFixture,
        commercialSignals,
        billing,
      }),
    );

    assert.match(markup, /QUIBRAS QUIMICA BRASILEIRA/);
    assert.match(markup, /Cód: #4821/);
    assert.match(markup, /Curitiba\/PR/);
    assert.match(markup, /CTB/);
    assert.match(markup, /12\.345\.678\/0001-90/);
    assert.match(markup, /Score de Saúde 360°/);
    assert.match(markup, /Saudável/);
    assert.match(markup, /Indicador em desenvolvimento/);
    assert.match(markup, /Dias desde última compra/);
    assert.match(markup, /Frequência média/);
    assert.match(markup, /16 dias/);
    assert.match(markup, /Desde Jan\/2024/);
    assert.match(markup, /Últimos 60 dias/);
    assert.match(markup, /Faturados/);
    assert.match(markup, /Perdidos/);
    assert.match(markup, /QQ/);
    assert.match(markup, /Faturamento · últimos 30 dias/);
    assert.match(markup, /Últimos 12 meses/);
    assert.match(markup, /R\$\s*3\.636\.032,83/);
    assert.match(markup, /R\$\s*2\.890\.110,00/);
    assert.match(markup, /flex flex-wrap items-start gap-x-8/);
    assert.match(markup, /md:flex-row/);
    assert.doesNotMatch(markup, /Totais/);
    assert.doesNotMatch(markup, /minmax\(0,1fr\)/);
    assert.doesNotMatch(markup, /Quantidade de pedidos/);
    assert.doesNotMatch(markup, /Maior margem \(pedido ganho\)/);
    assert.doesNotMatch(markup, /Menor margem vendida/);
    assert.doesNotMatch(markup, /Recência/);
    assert.doesNotMatch(markup, /Documento:/);

    const identityIdx = markup.indexOf("QUIBRAS QUIMICA BRASILEIRA");
    const billingIdx = markup.indexOf("Faturamento · últimos 30 dias");
    const healthIdx = markup.indexOf("Score de Saúde 360°");
    const sinceIdx = markup.indexOf("Desde Jan/2024");
    const recentIdx = markup.indexOf("Últimos 60 dias");
    const footerIdx = markup.indexOf("Vendedor responsável");
    assert.ok(identityIdx >= 0);
    assert.ok(billingIdx > identityIdx);
    assert.ok(healthIdx > billingIdx);
    assert.ok(sinceIdx > healthIdx);
    assert.ok(recentIdx > sinceIdx);
    assert.ok(footerIdx > recentIdx);
  });

  it("renders order counts inside the health score and zeros when absent", () => {
    const withCounts = renderToStaticMarkup(
      React.createElement(OverviewCustomerDetailHero, {
        customer: customerFixture,
        billing,
        orderCounts: {
          invoicedSinceJan2024: 1200,
          lostSinceJan2024: 45,
          totalSinceJan2024: 1245,
          invoicedLast60Days: 12,
          lostLast60Days: 3,
          totalLast60Days: 15,
        },
        commercialSignals,
      }),
    );

    assert.match(withCounts, /1\.200/);
    assert.match(withCounts, />45</);
    assert.match(withCounts, />12</);
    assert.match(withCounts, />3</);
    assert.doesNotMatch(withCounts, /Totais/);

    const scoreStart = withCounts.indexOf('aria-label="Score de Saúde 360° (demonstração)"');
    const matrixIdx = withCounts.indexOf("Faturados");
    assert.ok(scoreStart >= 0);
    assert.ok(matrixIdx > scoreStart);

    const withoutCounts = renderToStaticMarkup(
      React.createElement(OverviewCustomerDetailHero, {
        customer: customerFixture,
        commercialSignals,
        billing,
      }),
    );
    const zeroMatches = withoutCounts.match(/>0</g) ?? [];
    assert.ok(zeroMatches.length >= 4);
  });
});
