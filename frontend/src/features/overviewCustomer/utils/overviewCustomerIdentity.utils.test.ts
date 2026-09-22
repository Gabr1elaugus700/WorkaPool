import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deriveOverviewCustomerInitials,
  formatOverviewBranchIndicator,
} from "./overviewCustomerIdentity.utils";

describe("overviewCustomerIdentity.utils", () => {
  it("derives two-letter initials from trade name", () => {
    assert.equal(deriveOverviewCustomerInitials("QUIBRAS QUIMICA BRASILEIRA"), "QQ");
  });

  it("formats branch indicator labels", () => {
    assert.equal(formatOverviewBranchIndicator("BOTH"), "MGA + CTB");
    assert.equal(formatOverviewBranchIndicator("MGA"), "MGA");
  });
});
