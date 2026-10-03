import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatIbcIdentifier } from "../../../../../src/features/ibc/services/formatIbcIdentifier";
import { getIbcIdentifierPrefix } from "../../../../../src/features/ibc/services/getIbcIdentifierPrefix";

describe("formatIbcIdentifier", () => {
  it("pads the sequencial to 5 digits after the prefix", () => {
    assert.equal(formatIbcIdentifier("HMS", 43), "HMS00043");
    assert.equal(formatIbcIdentifier("NHMS", 1), "NHMS00001");
  });

  it("supports two-letter product abbreviation prefixes", () => {
    assert.equal(formatIbcIdentifier("HMSO", 10), "HMSO00010");
  });

  it("rejects non-positive or fractional sequencial", () => {
    assert.throws(() => formatIbcIdentifier("HMS", 0));
    assert.throws(() => formatIbcIdentifier("HMS", 1.5));
  });
});

describe("getIbcIdentifierPrefix", () => {
  it("homologated prefix is HM + product abbreviation", () => {
    assert.equal(getIbcIdentifierPrefix("s"), "HMS");
    assert.equal(getIbcIdentifierPrefix("SO", true), "HMSO");
  });

  it("non-homologated prefix is NHM + product abbreviation", () => {
    assert.equal(getIbcIdentifierPrefix("S", false), "NHMS");
  });
});
