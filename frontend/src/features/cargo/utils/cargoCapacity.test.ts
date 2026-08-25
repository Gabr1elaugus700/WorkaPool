import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cargoCapacity } from "./cargoCapacity.ts";

describe("cargoCapacity FE helpers", () => {
  it("Pedido weight for capacity equals sum of all produtos", () => {
    const weight = cargoCapacity.pedidoFromItems([
      { peso: 40 },
      { peso: 60 },
      { peso: 50 },
    ]);

    assert.strictEqual(weight, 150);
    assert.notStrictEqual(weight, 40);
  });

  it("occupied Carga weight sums every Pedido full item-sum", () => {
    const occupied = cargoCapacity.occupiedFromPedidos([
      { peso: 150 },
      { peso: 200 },
      { peso: 25 },
    ]);

    assert.strictEqual(occupied, 375);
  });

  it("blocks VENDAS over-capacity using full item-sums", () => {
    const allowed = cargoCapacity.mayAddPedido({
      role: "VENDAS",
      occupiedWeight: 900,
      pedidoWeight: 150,
      pesoMaximo: 1000,
    });

    assert.equal(allowed, false);
  });

  it("allows privileged over-capacity", () => {
    assert.equal(
      cargoCapacity.mayAddPedido({
        role: "LOGISTICA",
        occupiedWeight: 900,
        pedidoWeight: 150,
        pesoMaximo: 1000,
      }),
      true,
    );
    assert.equal(
      cargoCapacity.mayAddPedido({
        role: "ADMIN",
        occupiedWeight: 900,
        pedidoWeight: 150,
        pesoMaximo: 1000,
      }),
      true,
    );
  });
});
