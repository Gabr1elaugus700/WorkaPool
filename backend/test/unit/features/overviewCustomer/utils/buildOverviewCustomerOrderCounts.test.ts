import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildOverviewCustomerOrderCounts } from "../../../../../src/features/overviewCustomer/utils/buildOverviewCustomerOrderCounts";

describe("buildOverviewCustomerOrderCounts", () => {
  it("derives totals from the four base counts", () => {
    assert.deepStrictEqual(
      buildOverviewCustomerOrderCounts({
        invoicedCountSinceJan2024: 10,
        lostCountSinceJan2024: 4,
        invoicedCountLast60Days: 2,
        lostCountLast60Days: 1,
      }),
      {
        invoicedSinceJan2024: 10,
        lostSinceJan2024: 4,
        totalSinceJan2024: 14,
        invoicedLast60Days: 2,
        lostLast60Days: 1,
        totalLast60Days: 3,
      },
    );
  });

  it("defaults missing base counts to zero", () => {
    assert.deepStrictEqual(buildOverviewCustomerOrderCounts({}), {
      invoicedSinceJan2024: 0,
      lostSinceJan2024: 0,
      totalSinceJan2024: 0,
      invoicedLast60Days: 0,
      lostLast60Days: 0,
      totalLast60Days: 0,
    });
  });

  it("keeps lost zeros when only invoiced counts are present", () => {
    assert.deepStrictEqual(
      buildOverviewCustomerOrderCounts({
        invoicedCountSinceJan2024: 5,
        invoicedCountLast60Days: 2,
      }),
      {
        invoicedSinceJan2024: 5,
        lostSinceJan2024: 0,
        totalSinceJan2024: 5,
        invoicedLast60Days: 2,
        lostLast60Days: 0,
        totalLast60Days: 2,
      },
    );
  });
});
