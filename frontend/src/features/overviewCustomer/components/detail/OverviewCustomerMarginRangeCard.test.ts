import React from "react";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerMarginRangeCard } from "./OverviewCustomerMarginRangeCard";

describe("OverviewCustomerMarginRangeCard", () => {
  it("renders min, average and max margin values", () => {
    const loaded = renderToStaticMarkup(
      React.createElement(OverviewCustomerMarginRangeCard, {
        margins: [10, 30, 20],
        isLoading: false,
        isError: false,
      }),
    );

    assert.match(loaded, /Faixa histórica de margem/i);
    assert.match(loaded, /Mínima/);
    assert.match(loaded, /Média/);
    assert.match(loaded, /Máxima/);
    assert.match(loaded, /10,00%/);
    assert.match(loaded, /30,00%/);
    assert.match(loaded, /20,00%/);
  });

  it("renders empty state when margins are unavailable", () => {
    const empty = renderToStaticMarkup(
      React.createElement(OverviewCustomerMarginRangeCard, {
        margins: [null, null],
        isLoading: false,
        isError: false,
      }),
    );

    assert.match(empty, /Margem indisponível para este cliente/i);
  });
});
