import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { allocateNextIbcIdentifier } from "../../../../../src/features/ibc/services/allocateNextIbcIdentifier";

describe("allocateNextIbcIdentifier", () => {
  it("next identifier is HM with zero-padded increment", () => {
    assert.equal(allocateNextIbcIdentifier("HM0007"), "HM0008");
  });

  it("soft-deleted IBC does not free its identifier", () => {
    // Highest issued sequence remains 3 even when HM0003 is baixado
    assert.equal(allocateNextIbcIdentifier("HM0003"), "HM0004");
  });
});
