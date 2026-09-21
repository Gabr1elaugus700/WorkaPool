import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { OrderLossCustomerLink } from "./OrderLossCustomerLink";

describe("OrderLossCustomerLink", () => {
  it("renders a link to overview detail when customerCode is valid", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(OrderLossCustomerLink, {
          customerCode: 4821,
          name: "Cliente ACME",
        }),
      ),
    );

    assert.match(markup, /Cliente ACME/);
    assert.match(markup, /href="\/overview\/customers\/4821"/);
  });

  it("renders plain text when customerCode is missing", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OrderLossCustomerLink, {
        name: "Cliente",
      }),
    );

    assert.match(markup, /Cliente/);
    assert.doesNotMatch(markup, /href=/);
  });

  it("renders plain text when customerCode is invalid", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OrderLossCustomerLink, {
        customerCode: 0,
        name: "Cliente Zero",
      }),
    );

    assert.match(markup, /Cliente Zero/);
    assert.doesNotMatch(markup, /href=/);
  });
});
