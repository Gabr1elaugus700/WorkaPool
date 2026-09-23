import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveOverviewCustomerOrderCounts } from "./overviewCustomerOrderCounts.utils";

describe("resolveOverviewCustomerOrderCounts", () => {
  it("returns zeros when orderCounts is absent", () => {
    assert.deepStrictEqual(resolveOverviewCustomerOrderCounts(undefined), {
      invoicedSinceJan2024: 0,
      lostSinceJan2024: 0,
      totalSinceJan2024: 0,
      invoicedLast60Days: 0,
      lostLast60Days: 0,
      totalLast60Days: 0,
    });
    assert.deepStrictEqual(resolveOverviewCustomerOrderCounts(null), {
      invoicedSinceJan2024: 0,
      lostSinceJan2024: 0,
      totalSinceJan2024: 0,
      invoicedLast60Days: 0,
      lostLast60Days: 0,
      totalLast60Days: 0,
    });
  });

  it("passes through provided counts", () => {
    const counts = {
      invoicedSinceJan2024: 10,
      lostSinceJan2024: 4,
      totalSinceJan2024: 14,
      invoicedLast60Days: 2,
      lostLast60Days: 1,
      totalLast60Days: 3,
    };
    assert.deepStrictEqual(resolveOverviewCustomerOrderCounts(counts), counts);
  });
});
