import React from "react";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { formatOverviewCurrency } from "../../utils/overviewCustomerFormatters";
import {
  OVERVIEW_CUSTOMER_GROUP_QUOTES_BENCHMARK_EMPTY,
  OverviewCustomerGroupQuotesBenchmarkBar,
} from "./OverviewCustomerGroupQuotesBenchmarkBar";

function render(benchmark: Parameters<typeof OverviewCustomerGroupQuotesBenchmarkBar>[0]["benchmark"]) {
  return renderToStaticMarkup(
    React.createElement(OverviewCustomerGroupQuotesBenchmarkBar, { benchmark }),
  );
}

describe("OverviewCustomerGroupQuotesBenchmarkBar", () => {
  it("renders won, lost and spread with currency and percent", () => {
    const markup = render({
      wonAveragePrice: 10,
      lostAveragePrice: 12.5,
      spreadAmount: 2.5,
      spreadPercent: 25,
    });

    assert.match(markup, /Preço médio ganho/);
    assert.match(markup, /Preço médio perdido/);
    assert.match(markup, /Spread/);
    assert.ok(markup.includes(`${formatOverviewCurrency(10)}/kg`));
    assert.ok(markup.includes(`${formatOverviewCurrency(12.5)}/kg`));
    assert.ok(markup.includes(`+${formatOverviewCurrency(2.5)}/kg`));
    assert.match(markup, /\+25,00%/);
  });

  it("shows a negative spread with a minus sign", () => {
    const markup = render({
      wonAveragePrice: 12,
      lostAveragePrice: 9,
      spreadAmount: -3,
      spreadPercent: -25,
    });

    assert.ok(markup.includes(`−${formatOverviewCurrency(3)}/kg`));
    assert.match(markup, /−25,00%/);
  });

  it("shows a placeholder for missing values and no percent", () => {
    const markup = render({
      wonAveragePrice: null,
      lostAveragePrice: 10,
      spreadAmount: null,
      spreadPercent: null,
    });

    assert.equal(
      markup.split(OVERVIEW_CUSTOMER_GROUP_QUOTES_BENCHMARK_EMPTY).length - 1,
      2,
    );
    assert.doesNotMatch(markup, /%/);
  });
});
