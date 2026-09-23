import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { OrderLossCustomerFilterBanner } from "./OrderLossCustomerFilterBanner";

describe("OrderLossCustomerFilterBanner", () => {
  it("links the filter banner #code to overview customer detail", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(OrderLossCustomerFilterBanner, {
          customerCode: 4821,
        }),
      ),
    );

    assert.match(markup, /Filtrando pedidos perdidos do cliente/);
    assert.match(markup, /#4821/);
    assert.match(markup, /href="\/overview\/customers\/4821"/);
  });
});
