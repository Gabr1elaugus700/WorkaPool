import React from "react";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerAccessDeniedState } from "./OverviewCustomerAccessDeniedState";

describe("OverviewCustomerAccessDeniedState", () => {
  it("shows an access denied message with navigation back to list", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerAccessDeniedState, {
        backHref: "/overview/customers",
      }),
    );

    assert.match(markup, /Acesso negado/);
    assert.match(markup, /Você não tem permissão para visualizar este cliente\./);
    assert.match(markup, /href="\/overview\/customers"/);
  });
});
