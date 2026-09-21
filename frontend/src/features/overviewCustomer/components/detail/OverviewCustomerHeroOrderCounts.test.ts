import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerHeroOrderCounts } from "./OverviewCustomerHeroOrderCounts";

describe("OverviewCustomerHeroOrderCounts", () => {
  it("renders 3x2 matrix labels and formatted values", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerHeroOrderCounts, {
        orderCounts: {
          invoicedSinceJan2024: 1200,
          lostSinceJan2024: 45,
          totalSinceJan2024: 1245,
          invoicedLast60Days: 12,
          lostLast60Days: 3,
          totalLast60Days: 15,
        },
      }),
    );

    assert.match(markup, /Quantidade de pedidos/);
    assert.match(markup, /Desde Jan\/2024/);
    assert.match(markup, /Últimos 60 dias/);
    assert.match(markup, /Totais/);
    assert.match(markup, /Faturados/);
    assert.match(markup, /Perdidos/);
    assert.match(markup, /1\.245/);
    assert.match(markup, /1\.200/);
    assert.match(markup, />45</);
    assert.match(markup, />15</);
    assert.match(markup, />12</);
    assert.match(markup, />3</);
  });

  it("renders zeros when orderCounts is absent", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerHeroOrderCounts, {
        orderCounts: undefined,
      }),
    );

    assert.match(markup, /Totais/);
    assert.match(markup, /Faturados/);
    assert.match(markup, /Perdidos/);
    const zeroMatches = markup.match(/>0</g) ?? [];
    assert.ok(zeroMatches.length >= 6);
  });
});
