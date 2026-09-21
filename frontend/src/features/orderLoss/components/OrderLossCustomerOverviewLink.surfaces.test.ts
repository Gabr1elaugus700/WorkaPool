import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { SellerOrdersList } from "./SellerOrdersList";
import { SellersList } from "./SellersList";
import type { LegacyOrder, Seller } from "../types/orderLoss.types";

function createOrder(overrides: Partial<LegacyOrder> = {}): LegacyOrder {
  return {
    id: "1",
    orderNumber: "1001",
    clientName: "Cliente ACME",
    customerCode: 4821,
    status: "lost",
    city: "Maringa",
    seller: "Vendedor",
    sellerId: "10",
    totalWeight: 10,
    averageMargin: 12,
    totalValue: 1500,
    createdAt: new Date("2026-09-01"),
    updatedAt: new Date("2026-09-01"),
    products: [],
    ...overrides,
  };
}

describe("orderLoss customer overview link surfaces", () => {
  it("SellerOrdersList links customer name to overview detail", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(SellerOrdersList, {
          orders: [createOrder()],
          onUpdateLossReason: () => undefined,
        }),
      ),
    );

    assert.match(markup, /Cliente ACME/);
    assert.match(markup, /href="\/overview\/customers\/4821"/);
  });

  it("SellersList links customer name to overview detail when seller is expanded", () => {
    const seller: Seller = {
      id: "10",
      name: "Vendedor Teste",
      orders: [createOrder()],
    };

    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(SellersList, {
          sellers: [seller],
          initialExpandedSellerId: "10",
        }),
      ),
    );

    assert.match(markup, /Cliente ACME/);
    assert.match(markup, /href="\/overview\/customers\/4821"/);
  });
});
