import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatCount } from "./formatCount";

describe("formatCount", () => {
  it("usa o singular para 1", () => {
    assert.equal(formatCount(1, "pedido", "pedidos"), "1 pedido");
  });

  it("usa o plural para mais de 1", () => {
    assert.equal(formatCount(3, "IBC", "IBCs"), "3 IBCs");
  });

  it("usa o plural para zero", () => {
    assert.equal(formatCount(0, "pedido", "pedidos"), "0 pedidos");
  });
});
