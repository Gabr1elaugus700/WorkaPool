import React from "react";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerGroupQuoteRevealToggle } from "./OverviewCustomerGroupQuoteRevealToggle";
import { OverviewCustomerGroupQuoteSummaryBadges } from "./OverviewCustomerGroupQuoteSummaryBadges";

describe("OverviewCustomerGroupQuoteSummaryBadges", () => {
  it("renders Total / Ganhas / Perdidas / Outros with their counts and no 'Você'", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupQuoteSummaryBadges, {
        counts: { todas: 7, ganhas: 3, perdidas: 2, outros: 2 },
      }),
    );

    assert.match(markup, /Total<span[^>]*>7</);
    assert.match(markup, /Ganhas<span[^>]*>3</);
    assert.match(markup, /Perdidas<span[^>]*>2</);
    assert.match(markup, /Outros<span[^>]*>2</);
    assert.doesNotMatch(markup, /Você/);
  });
});

describe("OverviewCustomerGroupQuoteRevealToggle", () => {
  function render(reveal: boolean) {
    return renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupQuoteRevealToggle, {
        otherCustomerCount: 4,
        reveal,
        onRevealChange: () => undefined,
      }),
    );
  }

  it("marks Visíveis as pressed when reveal is on", () => {
    const markup = render(true);

    assert.match(markup, /Outros Vendedores/);
    assert.match(markup, />4</);
    assert.match(markup, /aria-pressed="true"[^>]*>Visíveis</);
    assert.match(markup, /aria-pressed="false"[^>]*>Ocultos</);
  });

  it("marks Ocultos as pressed when reveal is off", () => {
    const markup = render(false);

    assert.match(markup, /aria-pressed="false"[^>]*>Visíveis</);
    assert.match(markup, /aria-pressed="true"[^>]*>Ocultos</);
  });
});
