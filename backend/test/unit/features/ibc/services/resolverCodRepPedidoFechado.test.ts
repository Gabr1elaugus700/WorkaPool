import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolverCodRepPedidoFechado } from "../../../../../src/features/ibc/services/resolverCodRepPedidoFechado";

const pedidos = [
  { numPed: "10", codRep: 4, cliente: "A" },
  { numPed: "20", cliente: "B" },
  { numPed: "30", codRep: 0, cliente: "C" },
  { numPed: 40, codRep: 7, cliente: "D" },
  { numPed: "50", codRep: 999, cliente: "E" },
];

describe("resolverCodRepPedidoFechado", () => {
  it("devolve o codRep quando o pedido da carga fechada tem representante", () => {
    assert.equal(resolverCodRepPedidoFechado(pedidos, "10"), 4);
  });

  it("devolve null quando o codRep está ausente", () => {
    assert.equal(resolverCodRepPedidoFechado(pedidos, "20"), null);
    assert.equal(resolverCodRepPedidoFechado([{ numPed: "20", codRep: null }], "20"), null);
  });

  it("devolve null quando o codRep é 0", () => {
    assert.equal(resolverCodRepPedidoFechado(pedidos, "30"), null);
  });

  it("aceita numPed numérico no JSON", () => {
    assert.equal(resolverCodRepPedidoFechado(pedidos, "40"), 7);
  });

  it("devolve 999 como o representante daquele pedido", () => {
    assert.equal(resolverCodRepPedidoFechado(pedidos, "50"), 999);
  });
});
