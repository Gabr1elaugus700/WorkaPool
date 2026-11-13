import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { corHexComOpacidade } from "./corHexComOpacidade";

describe("corHexComOpacidade", () => {
  it("acrescenta o canal alfa ao hex de 6 dígitos", () => {
    assert.equal(corHexComOpacidade("#ffff00", 0.2), "#FFFF0033");
    assert.equal(corHexComOpacidade("#FF5F11", 1), "#FF5F11FF");
    assert.equal(corHexComOpacidade("#FF5F11", 0), "#FF5F1100");
  });

  it("limita a opacidade entre 0 e 1", () => {
    assert.equal(corHexComOpacidade("#000000", 2), "#000000FF");
    assert.equal(corHexComOpacidade("#000000", -1), "#00000000");
  });

  it("devolve o valor original quando não é hex de 6 dígitos", () => {
    assert.equal(corHexComOpacidade("red", 0.5), "red");
  });
});
