import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildOverviewCustomerGroupQuotesQueryKey } from "./overviewCustomerGroupQuotesQueryKey.utils";

describe("buildOverviewCustomerGroupQuotesQueryKey", () => {
  it("includes customer, group, product and the fetch-level reveal flag", () => {
    assert.deepEqual(
      buildOverviewCustomerGroupQuotesQueryKey(123, "G1", "P001", true),
      ["overview-customer-group-quotes", 123, "G1", "P001", true],
    );
  });

  it("changes when the product changes so a new load happens", () => {
    assert.notDeepEqual(
      buildOverviewCustomerGroupQuotesQueryKey(123, "G1", "P001", true),
      buildOverviewCustomerGroupQuotesQueryKey(123, "G1", "P002", true),
    );
  });

  it("changes when the group changes so a new load happens", () => {
    assert.notDeepEqual(
      buildOverviewCustomerGroupQuotesQueryKey(123, "G1", "P001", true),
      buildOverviewCustomerGroupQuotesQueryKey(123, "G2", "P001", true),
    );
  });

  it("stays stable across repeated builds, so the visual reveal toggle cannot refetch", () => {
    assert.deepEqual(
      buildOverviewCustomerGroupQuotesQueryKey(123, "G1", "P001", true),
      buildOverviewCustomerGroupQuotesQueryKey(123, "G1", "P001", true),
    );
  });
});
