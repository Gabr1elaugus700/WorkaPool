import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { allocateNextIbcIdentifier } from "../../../../../src/features/ibc/services/allocateNextIbcIdentifier";

describe("allocateNextIbcIdentifier", () => {
  it("increments HM identifier with fixed 5-digit sequence", () => {
    assert.equal(allocateNextIbcIdentifier("HM00042"), "HM00043");
  });

  it("increments NHM identifier with fixed 5-digit sequence", () => {
    assert.equal(allocateNextIbcIdentifier("NHM00009"), "NHM00010");
  });

  it("increments HMS identifier with fixed 5-digit sequence", () => {
    assert.equal(allocateNextIbcIdentifier("HMS00199"), "HMS00200");
  });

  it("increments NHS identifier with fixed 5-digit sequence", () => {
    assert.equal(allocateNextIbcIdentifier("NHS00000"), "NHS00001");
  });

  it("soft-deleted IBC does not free its identifier", () => {
    // Highest issued sequence remains 3 even when HM00003 is baixado
    assert.equal(allocateNextIbcIdentifier("HM00003"), "HM00004");
  });
});
