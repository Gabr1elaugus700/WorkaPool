import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { cargoCapacityWeight } from "../../../../../src/features/cargo/services/cargoCapacityWeight";

describe("cargoCapacityWeight", () => {
  after(async () => {
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it("Pedido weight for capacity is the sum of all item weights", () => {
    const total = cargoCapacityWeight.pedidoFromItems([
      { peso: 40 },
      { peso: 60 },
      { peso: 50 },
    ]);

    assert.strictEqual(total, 150);
    assert.notStrictEqual(total, 40);
  });

  it("Carga occupied weight sums full Pedido totals", () => {
    const pedidoA = {
      peso: cargoCapacityWeight.pedidoFromItems([{ peso: 100 }, { peso: 50 }]),
    };
    const pedidoB = {
      peso: cargoCapacityWeight.pedidoFromItems([{ peso: 200 }, { peso: 25 }]),
    };

    const occupied = cargoCapacityWeight.occupiedFromPedidos([pedidoA, pedidoB]);

    assert.strictEqual(occupied, 375);
    assert.notStrictEqual(100 + 200, occupied);
  });
});
