import React from "react";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  OVERVIEW_CUSTOMER_GROUP_QUOTES_ALL_SELLERS,
  OVERVIEW_CUSTOMER_GROUP_QUOTES_SEARCH_PLACEHOLDER,
  OverviewCustomerGroupQuoteFiltersToolbar,
} from "./OverviewCustomerGroupQuoteFiltersToolbar";

const baseProps = {
  search: "",
  codRep: null,
  status: "todas" as const,
  sellerOptions: [
    { codRep: 10, label: "Ana" },
    { codRep: 20, label: "Bruno" },
  ],
  counts: { todas: 24, ganhas: 12, perdidas: 7, outros: 5 },
  outrosEnabled: true,
  onSearchChange: () => undefined,
  onSellerChange: () => undefined,
  onStatusChange: () => undefined,
};

describe("OverviewCustomerGroupQuoteFiltersToolbar", () => {
  it("renders search, all sellers and status defaults like the mock", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupQuoteFiltersToolbar, baseProps),
    );

    assert.match(
      markup,
      new RegExp(OVERVIEW_CUSTOMER_GROUP_QUOTES_SEARCH_PLACEHOLDER.replace(".", "\\.")),
    );
    assert.match(markup, new RegExp(OVERVIEW_CUSTOMER_GROUP_QUOTES_ALL_SELLERS));
    assert.match(markup, /Status: Todos/);
    assert.doesNotMatch(markup, /Você/);
  });

  it("shows the selected seller name and status label", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerGroupQuoteFiltersToolbar, {
        ...baseProps,
        search: "#123",
        codRep: 20,
        status: "perdidas" as const,
      }),
    );

    assert.match(markup, /value="#123"/);
    assert.match(markup, /Bruno/);
    assert.match(markup, /Status: Perdidas/);
    assert.doesNotMatch(markup, new RegExp(OVERVIEW_CUSTOMER_GROUP_QUOTES_ALL_SELLERS));
  });
});
