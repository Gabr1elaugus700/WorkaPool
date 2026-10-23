import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatIbcIdentifier } from "../../../../../src/features/ibc/services/formatIbcIdentifier";
import {
  getIbcIdentifierPrefix,
  isNaoHomologadoPrefixo,
  toNaoHomologadoPrefixo,
} from "../../../../../src/features/ibc/services/getIbcIdentifierPrefix";

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
  it("homologated prefix is HM + sigla", () => {
    assert.equal(getIbcIdentifierPrefix({ homologado: true, sigla: "s" }), "HMS");
    assert.equal(getIbcIdentifierPrefix({ homologado: true, sigla: "SO" }), "HMSO");
  });

  it("non-homologated prefix is NH + sigla, or NH when universal", () => {
    assert.equal(getIbcIdentifierPrefix({ homologado: false, sigla: "S" }), "NHS");
    assert.equal(getIbcIdentifierPrefix({ homologado: false, sigla: null }), "NH");
    assert.equal(getIbcIdentifierPrefix({ homologado: false }), "NH");
  });

  it("detects NH and legacy NHM without recalculating stored identifiers", () => {
    assert.equal(toNaoHomologadoPrefixo("HMS"), "NHMS");
    assert.equal(isNaoHomologadoPrefixo("NH"), true);
    assert.equal(isNaoHomologadoPrefixo("NHS"), true);
    assert.equal(isNaoHomologadoPrefixo("NHMS"), true);
    assert.equal(isNaoHomologadoPrefixo("NHM"), true);
    assert.equal(isNaoHomologadoPrefixo("HMS"), false);
    assert.equal(isNaoHomologadoPrefixo("HM"), false);
  });
});
