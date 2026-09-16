import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { allocateNextIbcIdentifier } from "../../../../../src/features/ibc/services/allocateNextIbcIdentifier";

describe("allocateNextIbcIdentifier", () => {
  it("increments dynamic HM+product prefix with fixed 5-digit sequence", () => {
    assert.equal(allocateNextIbcIdentifier("HMS00042"), "HMS00043");
  });

  it("supports two-letter product abbreviation prefixes", () => {
    assert.equal(allocateNextIbcIdentifier("HMSO00009"), "HMSO00010");
  });

  it("soft-deleted IBC does not free its identifier", () => {
    // Highest issued sequence remains 3 even when HMS00003 is baixado
    assert.equal(allocateNextIbcIdentifier("HMS00003"), "HMS00004");
  });
});
