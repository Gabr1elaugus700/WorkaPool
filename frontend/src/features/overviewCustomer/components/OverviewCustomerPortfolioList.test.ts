import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { OverviewCustomerPortfolioList } from "./OverviewCustomerPortfolioList";
import type { OverviewCustomerListRow } from "../types/overviewCustomerList.types";

function createRow(overrides: Partial<OverviewCustomerListRow> = {}): OverviewCustomerListRow {
  return {
    customerCode: 123,
    tradeName: "Cliente ACME",
    city: "Maringa",
    state: "PR",
    primaryCodRep: 10,
    branchIndicator: "MGA",
    lastPurchaseAt: "2026-08-01",
    daysSinceLastPurchase: 10,
    ...overrides,
  };
}

describe("OverviewCustomerPortfolioList", () => {
  it("renders empty state when there are no rows", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerPortfolioList, {
        items: [],
        isLoading: false,
      }),
    );

    assert.match(markup, /Nenhum cliente encontrado na carteira/);
  });

  it("renders rows with navigation links to detail route", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(OverviewCustomerPortfolioList, {
          items: [createRow()],
          isLoading: false,
        }),
      ),
    );

    assert.match(markup, /Cliente ACME/);
    assert.match(markup, /href="\/overview\/customers\/123"/);
    assert.match(markup, /#123/);
  });
});
