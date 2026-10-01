import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerDetailFirstPaintSkeleton } from "./OverviewCustomerDetailFirstPaintSkeleton";

describe("OverviewCustomerDetailFirstPaintSkeleton", () => {
  it("renders hero loading placeholders without the removed KPI grid", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerDetailFirstPaintSkeleton),
    );

    assert.match(markup, /Carregando análise comercial do cliente/i);
    assert.match(markup, /Carregando identidade do cliente/i);
    assert.doesNotMatch(markup, /Carregando indicadores comerciais/i);
  });
});
