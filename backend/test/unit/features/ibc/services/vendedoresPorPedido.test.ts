import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { vendedoresPorPedido } from "../../../../../src/features/ibc/services/vendedoresPorPedido";

describe("vendedoresPorPedido", () => {
  it("mapeia o nome gravado no JSON da carga fechada", () => {
    const mapa = vendedoresPorPedido([
      { numPed: "10", vendedor: " Ana Silva " },
      { numPed: 20, vendedor: "Bruno" },
    ]);
    assert.equal(mapa.get("10"), "Ana Silva");
    assert.equal(mapa.get("20"), "Bruno");
  });

  it("ignora vendedor vazio, ausente e pedido sem número", () => {
    const mapa = vendedoresPorPedido([
      { numPed: "10", vendedor: "   " },
      { numPed: "11" },
      { vendedor: "Sem pedido" },
      "fora",
      null,
    ]);
    assert.equal(mapa.size, 0);
  });

  it("devolve mapa vazio quando a foto não é uma lista", () => {
    assert.equal(vendedoresPorPedido(null).size, 0);
    assert.equal(vendedoresPorPedido({ pedidos: [] }).size, 0);
  });

  it("mantém o primeiro nome quando o mesmo pedido aparece duas vezes", () => {
    const mapa = vendedoresPorPedido([
      { numPed: "10", vendedor: "Primeiro" },
      { numPed: "10", vendedor: "Segundo" },
    ]);
    assert.equal(mapa.get("10"), "Primeiro");
  });
});
