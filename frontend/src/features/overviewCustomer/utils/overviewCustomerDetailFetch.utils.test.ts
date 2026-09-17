import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  shouldFetchMonthlyEvolution,
  shouldFetchPurchasedProducts,
  shouldFetchRecentCommercialMotion,
} from "./overviewCustomerDetailFetch.utils";

describe("overviewCustomerDetailFetch.utils", () => {
  it("fetches monthly evolution on overview and history tabs", () => {
    assert.equal(shouldFetchMonthlyEvolution("overview"), true);
    assert.equal(shouldFetchMonthlyEvolution("history"), true);
    assert.equal(shouldFetchMonthlyEvolution("products"), false);
    assert.equal(shouldFetchMonthlyEvolution("motion"), false);
  });

  it("fetches purchased products on overview and products tabs", () => {
    assert.equal(shouldFetchPurchasedProducts("overview"), true);
    assert.equal(shouldFetchPurchasedProducts("products"), true);
    assert.equal(shouldFetchPurchasedProducts("history"), false);
  });

  it("fetches recent commercial motion on overview and motion tabs", () => {
    assert.equal(shouldFetchRecentCommercialMotion("overview"), true);
    assert.equal(shouldFetchRecentCommercialMotion("motion"), true);
    assert.equal(shouldFetchRecentCommercialMotion("products"), false);
  });
});
